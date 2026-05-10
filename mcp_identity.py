"""MCP identity, cursor, role, and presence management.

Encapsulates the mutable runtime state that MCP tools read/write,
so it can be tested and imported without pulling in the full bridge.
"""

import json
import logging
import os
import threading
import time
from pathlib import Path

log = logging.getLogger(__name__)

ACTIVITY_TIMEOUT = 8
PRESENCE_TIMEOUT = 10


class McpIdentity:
    def __init__(self):
        self._presence: dict[str, float] = {}
        self._activity: dict[str, bool] = {}
        self._activity_ts: dict[str, float] = {}
        self._thoughts: dict[str, str] = {}
        self._presence_lock = threading.Lock()
        self._renamed_from: set[str] = set()
        self._cursors: dict[str, dict[str, int]] = {}
        self._cursors_lock = threading.Lock()
        self._empty_read_count: dict[str, int] = {}
        self._last_read_channel: dict[str, str] = {}
        self._last_read_job_id: dict[str, int] = {}
        self._last_read_lock = threading.Lock()
        self._roles: dict[str, str] = {}
        self._roles_file: Path | None = None
        self._cursors_file: Path | None = None

    # --- File persistence ---

    def set_cursors_file(self, path: Path):
        self._cursors_file = path

    def set_roles_file(self, path: Path):
        self._roles_file = path

    def load_cursors(self):
        if self._cursors_file is None or not self._cursors_file.exists():
            return
        try:
            data = json.loads(self._cursors_file.read_text("utf-8"))
            with self._cursors_lock:
                self._cursors.update(data)
        except Exception:
            log.warning("Failed to load cursor state from %s", self._cursors_file)

    def save_cursors(self):
        if self._cursors_file is None:
            return
        try:
            with self._cursors_lock:
                snapshot = dict(self._cursors)
            self._cursors_file.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._cursors_file.with_suffix(".tmp")
            tmp.write_text(json.dumps(snapshot), "utf-8")
            os.replace(tmp, self._cursors_file)
        except Exception:
            log.warning("Failed to save cursor state to %s", self._cursors_file)

    def load_roles(self):
        if self._roles_file is None or not self._roles_file.exists():
            return
        try:
            self._roles = json.loads(self._roles_file.read_text("utf-8"))
        except Exception:
            log.warning("Failed to load roles from %s", self._roles_file)

    def save_roles(self):
        if self._roles_file is None:
            return
        try:
            self._roles_file.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._roles_file.with_suffix(".tmp")
            tmp.write_text(json.dumps(self._roles), "utf-8")
            os.replace(tmp, self._roles_file)
        except Exception:
            log.warning("Failed to save roles to %s", self._roles_file)

    # --- Presence ---

    def touch_presence(self, name: str):
        with self._presence_lock:
            self._presence[name] = time.time()

    def get_online(self) -> list[str]:
        now = time.time()
        with self._presence_lock:
            return [n for n, ts in self._presence.items()
                    if now - ts < PRESENCE_TIMEOUT]

    def is_online(self, name: str) -> bool:
        now = time.time()
        with self._presence_lock:
            last = self._presence.get(name, 0)
            return (now - last) < PRESENCE_TIMEOUT

    def last_seen(self, name: str) -> float:
        """Return the last presence timestamp for a name, or 0 if never seen."""
        with self._presence_lock:
            return self._presence.get(name, 0)

    def is_renamed(self, name: str) -> bool:
        with self._presence_lock:
            return name in self._renamed_from

    def discard_renamed(self, name: str):
        with self._presence_lock:
            self._renamed_from.discard(name)

    def add_renamed_from(self, old_name: str):
        with self._presence_lock:
            self._renamed_from.add(old_name)

    # --- Activity ---

    def set_active(self, name: str, active: bool):
        with self._presence_lock:
            self._activity[name] = active
            if active:
                self._activity_ts[name] = time.time()

    def is_active(self, name: str) -> bool:
        with self._presence_lock:
            if not self._activity.get(name):
                return False
            ts = self._activity_ts.get(name, 0)
            return (time.time() - ts) < ACTIVITY_TIMEOUT

    def expire_stale_activity(self, online: set[str]):
        with self._presence_lock:
            stale = [n for n in self._activity
                     if self._activity.get(n) and n not in online]
            for n in stale:
                self._activity[n] = False

    def get_active_set(self) -> set[str]:
        now = time.time()
        with self._presence_lock:
            return {name for name, active in self._activity.items()
                    if active and (now - self._activity_ts.get(name, 0)) < ACTIVITY_TIMEOUT}

    # --- Thoughts ---

    def set_thoughts(self, name: str, text: str):
        with self._presence_lock:
            self._thoughts[name] = text

    def get_thoughts(self, name: str) -> str:
        with self._presence_lock:
            return self._thoughts.get(name, "")

    # --- Cursors ---

    def get_cursor(self, sender: str, channel: str) -> int:
        with self._cursors_lock:
            return self._cursors.get(sender, {}).get(channel, 0)

    def update_cursor(self, sender: str, msgs: list[dict], channel: str | None):
        if not msgs:
            return
        max_id = max(m.get("id", 0) for m in msgs)
        with self._cursors_lock:
            if sender not in self._cursors:
                self._cursors[sender] = {}
            if channel:
                self._cursors[sender][channel] = max_id
            else:
                for ch in list(self._cursors[sender].keys()):
                    self._cursors[sender][ch] = max_id
        self.save_cursors()

    def migrate_cursors_rename(self, old_name: str, new_name: str):
        with self._cursors_lock:
            for agent_cursors in self._cursors.values():
                if old_name in agent_cursors:
                    agent_cursors[new_name] = agent_cursors.pop(old_name)
        self.save_cursors()

    def migrate_cursors_delete(self, channel: str):
        with self._cursors_lock:
            for agent_cursors in self._cursors.values():
                agent_cursors.pop(channel, None)
        self.save_cursors()

    # --- Last read tracking ---

    def set_last_read_channel(self, sender: str, channel: str):
        with self._last_read_lock:
            self._last_read_channel[sender] = channel

    def get_last_read_channel(self, sender: str) -> str:
        with self._last_read_lock:
            return self._last_read_channel.get(sender, "")

    def set_last_read_job_id(self, sender: str, job_id: int):
        with self._last_read_lock:
            self._last_read_job_id[sender] = job_id

    def get_last_read_job_id(self, sender: str) -> int:
        with self._last_read_lock:
            return self._last_read_job_id.get(sender, 0)

    # --- Roles ---

    def set_role(self, name: str, role: str):
        if role:
            self._roles[name] = role
        else:
            self._roles.pop(name, None)
        self.save_roles()

    def get_role(self, name: str) -> str:
        return self._roles.get(name, "")

    def get_all_roles(self) -> dict[str, str]:
        return dict(self._roles)

    # --- Identity lifecycle ---

    def migrate_identity(self, old_name: str, new_name: str):
        with self._presence_lock:
            if old_name in self._presence:
                self._presence[new_name] = self._presence.pop(old_name)
            if old_name in self._activity:
                self._activity[new_name] = self._activity.pop(old_name)
            if old_name in self._activity_ts:
                self._activity_ts[new_name] = self._activity_ts.pop(old_name)
            self._renamed_from.add(old_name)
        with self._cursors_lock:
            if old_name in self._cursors:
                self._cursors[new_name] = self._cursors.pop(old_name)
        if old_name in self._roles:
            self._roles[new_name] = self._roles.pop(old_name)
            self.save_roles()
        self.save_cursors()

    def purge_identity(self, name: str):
        with self._presence_lock:
            self._presence.pop(name, None)
            self._activity.pop(name, None)
            self._activity_ts.pop(name, None)
        with self._cursors_lock:
            self._cursors.pop(name, None)
        if name in self._roles:
            del self._roles[name]
            self.save_roles()
        self.save_cursors()
