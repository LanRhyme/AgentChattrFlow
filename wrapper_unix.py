"""Mac/Linux agent injection — uses tmux send-keys to type into the agent CLI.

Called by wrapper.py on Mac and Linux. Requires tmux to be installed.
  - Mac:   brew install tmux
  - Linux: apt install tmux  (or yum, pacman, etc.)

How it works:
  1. Creates a tmux session running the agent CLI
  2. Queue watcher sends keystrokes via 'tmux send-keys'
  3. Wrapper attaches to the session so you see the full TUI
  4. Ctrl+B, D to detach (agent keeps running in background)
"""

import shlex
import shutil
import subprocess
import sys
import time


def _session_exists(session_name: str) -> bool:
    """Return True while the tmux session is still alive."""
    result = subprocess.run(
        ["tmux", "has-session", "-t", session_name],
        capture_output=True,
    )
    return result.returncode == 0


def _check_tmux():
    """Verify tmux is installed, exit with helpful message if not."""
    if shutil.which("tmux"):
        return
    print("\n  Error: tmux is required for auto-trigger on Mac/Linux.")
    if sys.platform == "darwin":
        print("  Install: brew install tmux")
    else:
        print("  Install: apt install tmux  (or yum/pacman equivalent)")
    sys.exit(1)


def inject(text: str, *, tmux_session: str, delay: float = 0.3):
    """Send text + Enter to a tmux session via send-keys."""
    # Use -l to send text literally (avoids misinterpreting as key names),
    # then send Enter as a separate key press
    subprocess.run(
        ["tmux", "send-keys", "-t", tmux_session, "-l", text],
        capture_output=True,
    )
    # Scale delay with text length so longer prompts get more processing time
    time.sleep(max(delay, len(text) * 0.001))
    subprocess.run(
        ["tmux", "send-keys", "-t", tmux_session, "Enter"],
        capture_output=True,
    )


def get_activity_checker(session_name, trigger_flag=None):
    """Return a callable that detects tmux pane output by hashing content."""
    last_hash = [None]
    _is_active = [False]

    def check():
        # External trigger: queue watcher injected a message
        triggered = False
        if trigger_flag is not None and trigger_flag[0]:
            trigger_flag[0] = False
            triggered = True
            _is_active[0] = True

        try:
            result = subprocess.run(
                ["tmux", "capture-pane", "-t", session_name, "-p"],
                capture_output=True, timeout=2,
            )
            raw_content = result.stdout.decode("utf-8", errors="replace")
            
            # Filter out CLI UI elements (headers, status bars, quotas, ASCII art)
            lines = []
            for line in raw_content.split("\n"):
                line_trimmed = line.rstrip()
                if not line_trimmed:
                    continue
                
                # 1. Box-drawing and Decorative Pattern Check
                # If a line is mostly (60%+) box characters or dividers, it's UI.
                stripped_line = line_trimmed.strip()
                ui_chars = "─━═─ ▄▀█▌▐░▒▓▖▗▘▙▚▛▜▝▞▟╭╯╰╮│┌┐└┘├┤┬┴┼"
                symbol_count = sum(1 for c in stripped_line if c in ui_chars)
                is_mostly_symbols = (symbol_count / len(stripped_line)) > 0.6 if stripped_line else False
                
                # 2. Specific AI CLI Patterns (Gemini, Claude, etc.)
                line_lower = stripped_line.lower()
                is_ui = (
                    is_mostly_symbols or
                    ("gemini cli" in line_lower) or
                    ("signed in as" in line_lower) or
                    ("signed in with google" in line_lower) or
                    ("plan:" in line_lower and ("google" in line_lower or "claude" in line_lower)) or
                    ("mcp issues" in line_lower) or
                    ("update available" in line_lower and "/extensions" in line_lower) or
                    ("shortcuts" in line_lower and "?" in line_lower) or
                    ("shift+tab" in line_lower and "accept" in line_lower) or
                    ("gemini.md files" in line_lower) or
                    ("type your message" in line_lower) or
                    ("ctrl+b" in line_lower and "detach" in line_lower) or
                    ("workspace" in line_lower and ("branch" in line_lower or "model" in line_lower)) or
                    ("branch" in line_lower and "sandbox" in line_lower) or
                    ("quota" in line_lower and "used" in line_lower) or
                    (stripped_line.startswith("(") and stripped_line.endswith(")"))
                )
                
                if not is_ui:
                    lines.append(line_trimmed)
            
            screen_content = "\n".join(lines).strip()
            h = hash(screen_content)
            changed = last_hash[0] is not None and h != last_hash[0]
            last_hash[0] = h
            
            if changed or triggered:
                _is_active[0] = True
            else:
                # Basic idle logic for Unix (could be improved with hysteresis like Windows)
                _is_active[0] = False

            return _is_active[0], screen_content
        except Exception:
            return _is_active[0], ""

    return check


def run_agent(
    command,
    extra_args,
    cwd,
    env,
    queue_file,
    agent,
    no_restart,
    start_watcher,
    strip_env=None,
    pid_holder=None,
    session_name=None,
    inject_env=None,
    inject_delay: float = 0.3,
):
    """Run agent inside a tmux session, inject via tmux send-keys."""
    _check_tmux()

    session_name = session_name or f"agentchattr-{agent}"
    agent_cmd = " ".join(
        [shlex.quote(command)] + [shlex.quote(a) for a in extra_args]
    )

    # Build env(1) prefix for the command INSIDE the tmux session.
    # subprocess.run(env=...) only affects the tmux client binary — the
    # session shell inherits from the tmux server instead.  Use env(1)
    # to set (-u to unset, VAR=val to inject) vars in the actual session.
    env_parts = []
    if strip_env:
        env_parts.extend(f"-u {shlex.quote(v)}" for v in strip_env)
    if inject_env:
        env_parts.extend(
            f"{shlex.quote(k)}={shlex.quote(v)}"
            for k, v in inject_env.items()
        )
    if env_parts:
        agent_cmd = f"env {' '.join(env_parts)} {agent_cmd}"

    # Resolve cwd to absolute path (tmux -c needs it)
    from pathlib import Path
    abs_cwd = str(Path(cwd).resolve())

    # Wire up injection with the tmux session name
    inject_fn = lambda text: inject(text, tmux_session=session_name, delay=inject_delay)
    start_watcher(inject_fn)

    print(f"  Using tmux session: {session_name}")
    print(f"  Detach: Ctrl+B, D  (agent keeps running)")
    print(f"  Reattach: tmux attach -t {session_name}\n")

    while True:
        try:
            # Clean up stale session from a previous crash
            subprocess.run(
                ["tmux", "kill-session", "-t", session_name],
                capture_output=True,
            )

            # Create tmux session running the agent CLI
            result = subprocess.run(
                ["tmux", "new-session", "-d", "-s", session_name,
                 "-c", abs_cwd, agent_cmd],
                env=env,
            )
            if result.returncode != 0:
                print(f"  Error: failed to create tmux session (exit {result.returncode})")
                break

            # Attach — blocks until agent exits or user detaches (Ctrl+B, D)
            subprocess.run(["tmux", "attach-session", "-t", session_name])

            # Check: did the agent exit, or did the user just detach?
            if _session_exists(session_name):
                # Session still alive — user detached, agent running in background.
                # Keep the wrapper alive so the local proxy and heartbeats survive.
                print(f"\n  Detached. {agent.capitalize()} still running in tmux.")
                print(f"  Reattach: tmux attach -t {session_name}")
                while _session_exists(session_name):
                    time.sleep(1)
                break

            # Session gone — agent exited
            if no_restart:
                break

            print(f"\n  {agent.capitalize()} exited.")
            print(f"  Restarting in 3s... (Ctrl+C to quit)")
            time.sleep(3)
        except KeyboardInterrupt:
            # Kill the tmux session on Ctrl+C
            subprocess.run(
                ["tmux", "kill-session", "-t", session_name],
                capture_output=True,
            )
            break
