"""Entry point — starts MCP server (port 8200) + web UI (port 8300)."""

import argparse
import asyncio
import secrets
import sys
import threading
import time
import logging
from pathlib import Path

# Ensure the project directory is on the import path
ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))


def _parse_args():
    parser = argparse.ArgumentParser(
        description="Start agentchattr (web UI + MCP server).",
        epilog="Flags override config.toml for this invocation. The same flags "
               "are also accepted by wrapper.py and wrapper_api.py so a launcher "
               "can isolate per-project instances by passing matching values to "
               "each process.",
    )
    parser.add_argument("--data-dir",      default=None, help="Override server.data_dir (path)")
    parser.add_argument("--port",          default=None, help="Override server.port (int)")
    parser.add_argument("--mcp-http-port", default=None, help="Override mcp.http_port (int)")
    parser.add_argument("--mcp-sse-port",  default=None, help="Override mcp.sse_port (int)")
    parser.add_argument("--upload-dir",    default=None, help="Override images.upload_dir (path)")
    parser.add_argument("--allow-network", action="store_true",
                        help="Allow binding to non-localhost hosts (with confirmation).")
    return parser.parse_args()


def _get_local_ip():
    import socket
    try:
        # Get all interfaces
        hostname = socket.gethostname()
        all_ips = socket.gethostbyname_ex(hostname)[2]
        
        # Priority 1: Real LAN IPs
        lan_prefixes = ("192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.21.", "172.22.", "172.23.", "172.24.", "172.25.", "172.26.", "172.27.", "172.28.", "172.29.", "172.30.", "172.31.")
        for ip in all_ips:
            if ip.startswith(lan_prefixes) and not ip.startswith("198.18."):
                return ip

        # Priority 2: Standard socket method
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
        s.close()
        if not ip.startswith("127."):
            return ip
            
        return all_ips[0] if all_ips else "127.0.0.1"
    except Exception:
        return "127.0.0.1"


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    # Parse flags for --help support; the actual env propagation happens via
    # the shared config_loader.apply_cli_overrides helper so run.py and the
    # wrappers use identical extraction logic.
    args = _parse_args()

    from config_loader import apply_cli_overrides, load_config
    apply_cli_overrides()

    config_path = ROOT / "config.toml"
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        sys.exit(1)

    config = load_config(ROOT)

    # Determine host/port before configuring the app so middleware knows the intent
    host = config.get("server", {}).get("host", "127.0.0.1")
    port = config.get("server", {}).get("port", 8300)

    if args.allow_network and host in ("127.0.0.1", "localhost"):
        host = "0.0.0.0"
        config.setdefault("server", {})["host"] = "0.0.0.0"

    # --- Security: generate a random session token (in-memory only) ---
    session_token = secrets.token_hex(32)

    # Configure the FastAPI app (creates shared store)
    from app import app, configure, set_event_loop, store as _store_ref
    configure(config, session_token=session_token)

    # Share stores with the MCP bridge
    from app import store, rules, summaries, jobs, room_settings, registry, router as app_router, agents as app_agents, session_engine, session_store
    import mcp_bridge
    mcp_bridge.store = store
    mcp_bridge.rules = rules
    mcp_bridge.summaries = summaries
    mcp_bridge.jobs = jobs
    mcp_bridge.room_settings = room_settings
    mcp_bridge.registry = registry
    mcp_bridge.config = config
    mcp_bridge.router = app_router
    mcp_bridge.agents = app_agents

    # Enable cursor and role persistence across restarts
    data_dir = ROOT / config.get("server", {}).get("data_dir", "./data")
    mcp_bridge._CURSORS_FILE = data_dir / "mcp_cursors.json"
    mcp_bridge._load_cursors()
    mcp_bridge._ROLES_FILE = data_dir / "roles.json"
    mcp_bridge._load_roles()

    # Start MCP servers in background threads
    http_port = config.get("mcp", {}).get("http_port", 8200)
    sse_port = config.get("mcp", {}).get("sse_port", 8201)
    mcp_bridge.mcp_http.settings.port = http_port
    mcp_bridge.mcp_sse.settings.port = sse_port

    threading.Thread(target=mcp_bridge.run_http_server, daemon=True).start()
    threading.Thread(target=mcp_bridge.run_sse_server, daemon=True).start()
    time.sleep(0.5)
    logging.getLogger(__name__).info("MCP streamable-http on port %d, SSE on port %d", http_port, sse_port)

    # Mount static files
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import HTMLResponse

    static_dir = ROOT / "static"

    @app.get("/")
    async def index():
        # Read index.html fresh each request so changes take effect without restart.
        # Inject the session token into the HTML so the browser client can use it.
        # This is safe: same-origin policy prevents cross-origin pages from reading
        # the response body, so only the user's own browser tab gets the token.
        html = (static_dir / "index.html").read_text("utf-8")
        injected = html.replace(
            "</head>",
            f'<script>window.__SESSION_TOKEN__="{session_token}";</script>\n</head>',
        )
        return HTMLResponse(injected, headers={"Cache-Control": "no-store"})

    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # Capture the event loop for the store→WebSocket bridge
    @app.on_event("startup")
    async def on_startup():
        set_event_loop(asyncio.get_running_loop())
        # Resume any sessions that were active before restart
        if session_engine:
            session_engine.resume_active_sessions()

    # Run web server
    import uvicorn

    # --- Security: warn if binding to a non-localhost address ---
    if host not in ("127.0.0.1", "localhost", "::1"):
        local_ip = _get_local_ip()
        print(f"\n  !! SECURITY WARNING — binding to {host} !!")
        print("  This exposes agentchattr to your local network.")
        print()
        print("  Risks:")
        print("  - No TLS: traffic (including session token) is plaintext")
        print("  - Anyone on your network can sniff the token and gain full access")
        print("  - With the token, anyone can @mention agents and trigger tool execution")
        print("  - If agents run with auto-approve, this means remote code execution")
        print()
        print("  Only use this on a trusted home network. Never on public/shared WiFi.")
        if not args.allow_network:
            print("  Pass --allow-network to start anyway, or set host to 127.0.0.1.\n")
            sys.exit(1)
        else:
            print()
            try:
                confirm = input(f"  Type YES to allow network access (Local IP: {local_ip}): ").strip()
            except (EOFError, KeyboardInterrupt):
                confirm = ""
            if confirm != "YES":
                print("  Aborted.\n")
                sys.exit(1)

    print(f"\n  agentchattr")
    print(f"  Local Web UI:   http://localhost:{port}")
    if host in ("0.0.0.0", ""):
        local_ip = _get_local_ip()
        print(f"  Network Web UI: http://{local_ip}:{port}")
    else:
        print(f"  Web UI:         http://{host}:{port}")
    
    print(f"  MCP HTTP:       http://{host if host not in ('0.0.0.0', '') else 'localhost'}:{http_port}/mcp")
    print(f"  MCP SSE:        http://{host if host not in ('0.0.0.0', '') else 'localhost'}:{sse_port}/sse")
    print(f"  Data:           {data_dir}")
    print(f"  Agents auto-trigger on @mention")
    print(f"\n  Session token: {session_token}\n")

    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    main()

