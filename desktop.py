"""Desktop launcher — wraps the agentchattr web UI in a native WebView window.

Requires: pip install pywebview
On Windows uses Edge WebView2 (pre-installed on Win 10/11).

Usage:
    python desktop.py
    python desktop.py --port 9000
    python desktop.py --allow-network    # bind to 0.0.0.0 (with confirmation)
"""

import argparse
import asyncio
import secrets
import sys
import threading
import time
import logging
from pathlib import Path

ROOT = Path(__file__).parent
sys.path.insert(0, str(ROOT))


def _parse_args():
    parser = argparse.ArgumentParser(description="Launch agentchattr as a desktop app.")
    parser.add_argument("--port", default=None, help="Override server.port (int)")
    parser.add_argument("--data-dir", default=None, help="Override server.data_dir (path)")
    parser.add_argument("--allow-network", action="store_true",
                        help="Allow binding to non-localhost hosts (with confirmation).")
    return parser.parse_args()


def _get_local_ip():
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0)
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def _start_server(config, session_token, port, host="127.0.0.1"):
    """Start FastAPI + MCP servers in background threads. Returns the uvicorn server."""
    from app import app, configure, set_event_loop
    configure(config, tok=session_token)

    from app import store, rules, summaries, jobs, room_settings, registry
    from app import router as app_router, agents as app_agents, session_engine, session_store
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

    data_dir = ROOT / config.get("server", {}).get("data_dir", "./data")
    mcp_bridge.identity.set_cursors_file(data_dir / "mcp_cursors.json")
    mcp_bridge.identity.load_cursors()
    mcp_bridge.identity.set_roles_file(data_dir / "roles.json")
    mcp_bridge.identity.load_roles()

    http_port = config.get("mcp", {}).get("http_port", 8200)
    sse_port = config.get("mcp", {}).get("sse_port", 8201)
    mcp_bridge.mcp_http.settings.port = http_port
    mcp_bridge.mcp_sse.settings.port = sse_port

    threading.Thread(target=mcp_bridge.run_http_server, daemon=True).start()
    threading.Thread(target=mcp_bridge.run_sse_server, daemon=True).start()
    time.sleep(0.3)

    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import HTMLResponse

    static_dir = ROOT / "static"

    @app.get("/")
    async def index():
        html = (static_dir / "index.html").read_text("utf-8")
        injected = html.replace(
            "</head>",
            f'<script>window.__SESSION_TOKEN__="{session_token}";</script>\n</head>',
        )
        return HTMLResponse(injected, headers={"Cache-Control": "no-store"})

    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    # Use on_event for compatibility — lifespan is set via app.py
    @app.on_event("startup")
    async def on_startup():
        set_event_loop(asyncio.get_running_loop())
        if session_engine:
            session_engine.resume_active_sessions()

    import uvicorn
    config_uvicorn = uvicorn.Config(
        app, host=host, port=port, log_level="warning",
    )
    server = uvicorn.Server(config_uvicorn)
    return server


def main():
    logging.basicConfig(
        level=logging.WARNING,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    args = _parse_args()

    from config_loader import apply_cli_overrides, load_config
    apply_cli_overrides()

    config_path = ROOT / "config.toml"
    if not config_path.exists():
        print(f"Error: {config_path} not found")
        sys.exit(1)

    config = load_config(ROOT)

    host = config.get("server", {}).get("host", "127.0.0.1")
    port = int(args.port) if args.port else config.get("server", {}).get("port", 8300)
    if args.data_dir:
        config.setdefault("server", {})["data_dir"] = args.data_dir

    if args.allow_network and host in ("127.0.0.1", "localhost"):
        host = "0.0.0.0"
        config.setdefault("server", {})["host"] = "0.0.0.0"

    # Security: warn if binding to non-localhost
    if host not in ("127.0.0.1", "localhost", "::1"):
        local_ip = _get_local_ip()
        print(f"\n  !! SECURITY WARNING — binding to {host} !!")
        print("  This exposes agentchattr to your local network.")
        print()
        print("  Risks:")
        print("  - No TLS: traffic (including session token) is plaintext")
        print("  - Anyone on your network can sniff the token and gain full access")
        print("  - With the token, anyone can @mention agents and trigger tool execution")
        print()
        print("  Only use this on a trusted home network. Never on public/shared WiFi.")
        if not args.allow_network:
            print("  Pass --allow-network to start anyway.\n")
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

    session_token = secrets.token_hex(32)

    # Start server in a background thread
    server = _start_server(config, session_token, port, host)
    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()

    # Wait for server to be ready (poll with HTTP request)
    import urllib.request
    import urllib.error
    ready = False
    for _ in range(50):
        if server.started:
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1)
                ready = True
                break
            except (urllib.error.URLError, OSError):
                pass
        time.sleep(0.1)

    if not ready:
        print("Error: server failed to start")
        sys.exit(1)

    # Open native WebView window
    try:
        import webview
    except ImportError:
        print("Error: pywebview is not installed.")
        print("Install it with: pip install pywebview")
        sys.exit(1)

    webview_host = "localhost" if host in ("0.0.0.0", "") else host
    window = webview.create_window(
        "agentchattr",
        url=f"http://{webview_host}:{port}",
        width=1200,
        height=800,
        min_size=(800, 600),
    )

    def on_closed():
        server.should_exit = True

    window.events.closed += on_closed

    webview.start(debug=False)


if __name__ == "__main__":
    main()
