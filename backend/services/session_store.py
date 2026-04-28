import threading
from typing import Any


class SessionStore:
    def __init__(self):
        self._sessions: dict[str, dict] = {}
        self._overrides: dict[str, list] = {}
        self._history: dict[str, list] = {}
        self._lock = threading.Lock()

    def create(self, session_id: str, data: dict) -> dict:
        with self._lock:
            self._sessions[session_id] = dict(data)
            self._overrides[session_id] = []
            self._history[session_id] = []
            return self._sessions[session_id]

    def get(self, session_id: str) -> dict | None:
        return self._sessions.get(session_id)

    def update(self, session_id: str, data: dict) -> dict | None:
        with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None
            session.update(data)
            return session

    def delete(self, session_id: str) -> bool:
        with self._lock:
            existed = session_id in self._sessions
            self._sessions.pop(session_id, None)
            self._overrides.pop(session_id, None)
            self._history.pop(session_id, None)
            return existed

    def queue_override(self, session_id: str, override: dict) -> None:
        with self._lock:
            if session_id not in self._overrides:
                self._overrides[session_id] = []
            self._overrides[session_id].append(override)

    def pop_overrides(self, session_id: str) -> list[dict]:
        with self._lock:
            overrides = self._overrides.get(session_id, [])
            self._overrides[session_id] = []
            return overrides

    def append_history(self, session_id: str, frame: dict) -> None:
        with self._lock:
            if session_id not in self._history:
                self._history[session_id] = []
            self._history[session_id].append(frame)

    def get_history(self, session_id: str) -> list[dict]:
        return list(self._history.get(session_id, []))

    def list_sessions(self) -> list[str]:
        return list(self._sessions.keys())


session_store = SessionStore()
