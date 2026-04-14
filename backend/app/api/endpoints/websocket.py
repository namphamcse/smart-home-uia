from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from app.websocket.manager import ws_manager
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    tags=["WebSocket"]
)

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)