import asyncio
import json
from fastapi import WebSocket
from app.utils.logger import get_logger

logger = get_logger(__name__)


class WebSocketManager:
    def __init__(self):
        self._connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, device_id: str):
        await websocket.accept()
        async with self._lock:
            self._connections.setdefault(device_id, []).append(websocket)
        logger.info(f"[WS] Client connected -> device={device_id}  "
                    f"total={self._count()}")

    async def disconnect(self, websocket: WebSocket, device_id: str):
        async with self._lock:
            conns = self._connections.get(device_id, [])
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                self._connections.pop(device_id, None)
        logger.info(f"[WS] Client disconnected -> device={device_id}")

    async def broadcast_to_device(self, device_id: str, data: dict):
        conns = self._connections.get(device_id, [])
        if not conns:
            return

        payload = json.dumps(data)
        dead = []
        for ws in conns:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)

        for ws in dead:
            await self.disconnect(ws, device_id)

    async def broadcast_all(self, data: dict):
        for device_id in list(self._connections.keys()):
            await self.broadcast_to_device(device_id, data)

    def _count(self) -> int:
        return sum(len(v) for v in self._connections.values())


ws_manager = WebSocketManager()