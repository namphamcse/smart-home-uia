import asyncio
import json
from fastapi import WebSocket
from app.utils.logger import get_logger

logger = get_logger(__name__)

class WebSocketManager:
    def __init__(self):
        self._connections: list[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()

        async with self._lock:
            self._connections.append(websocket)

        logger.info("[WS] Client connected")

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self._connections:
                self._connections.remove(websocket)

        logger.info("[WS] Client disconnected")

    async def broadcast(self, data: dict):
        if not self._connections:
            return

        payload = json.dumps(data)

        dead = []

        for ws in self._connections.copy():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.disconnect(ws)
