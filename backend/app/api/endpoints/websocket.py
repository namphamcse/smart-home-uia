from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.websocket.manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    tags=["WebSocket"]
)

@router.websocket("/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await ws_manager.connect(websocket, device_id)
    try:
        while True:
            data = await websocket.receive_text()
            # TODO: Handle incoming messages from clients if needed
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, device_id)