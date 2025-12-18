# app/ws_manager.py
import asyncio
import json
from typing import Set
from fastapi import WebSocket

class WSManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()
        self.lock = asyncio.Lock()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        async with self.lock:
            self.active.add(ws)

    async def disconnect(self, ws: WebSocket):
        async with self.lock:
            self.active.discard(ws)

    async def broadcast(self, payload: dict):
        dead = []
        msg = json.dumps(payload)
        async with self.lock:
            for ws in list(self.active):
                try:
                    await ws.send_text(msg)
                except Exception:
                    dead.append(ws)
            for d in dead:
                self.active.discard(d)

ws_manager = WSManager()
