from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.websocket.manager import WebSocketManager
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(
    tags=["WebSocket"]
)

@router.websocket("/")
@inject
async def websocket_endpoint(
    websocket: WebSocket,
    ws_manager: WebSocketManager = Depends(Provide[Container.ws_manager]),
):
    await ws_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)