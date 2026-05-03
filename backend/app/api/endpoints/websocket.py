from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.websocket.system_manager import SystemWebSocketManager
from app.websocket.camera_manager import CameraWebSocketManager
from app.services.edge.mediapipe_processor import MediaPipeFaceDetector
from app.utils.logger import get_logger
from app.services.ai.face_recognition_queue import FaceRecognitionQueue

logger = get_logger(__name__)

router = APIRouter(
    tags=["WebSocket"]
)

@router.websocket("/system")
@inject
async def system_websocket(
    websocket: WebSocket,
    system_manager: SystemWebSocketManager = Depends(Provide[Container.system_manager]),
):
    await system_manager.connect(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await system_manager.disconnect(websocket)


@router.websocket("/camera")
@inject
async def camera_websocket(
    websocket: WebSocket,
    camera_manager: CameraWebSocketManager = Depends(Provide[Container.camera_manager]),
    edge: MediaPipeFaceDetector = Depends(Provide[Container.mediapipe_processor]),
    face_queue: FaceRecognitionQueue = Depends(Provide[Container.face_recognition_queue])
):
    await camera_manager.connect(websocket)
    frame_count = 0
    recognition_results = {}
    skip_frames = 2  # Skip 2 frames, process 1
    
    try:
        while True:
            frame = await websocket.receive_bytes()
            frame_count += 1
            
            # Skip frames to reduce load
            if frame_count % (skip_frames + 1) != 0:
                img = edge.decode_frame(frame)
                if img is not None:
                    frame = edge.encode_frame(img)
                await camera_manager.broadcast(frame)
                continue
            
            img = edge.decode_frame(frame)
            
            if img is not None:
                faces = edge.get_faces(img)
                
                if faces:
                    # Draw results
                    for i, face_bbox in enumerate(faces):
                        if i in recognition_results:
                            result, confidence = recognition_results[i]
                            label = f"{result.value} ({confidence:.2f})"
                            img = edge.draw_face_with_label(img, face_bbox["box"], label=label)
                        else:
                            img = edge.draw_faces(img, [face_bbox])
                    
                    # Add faces to recognition queue
                    recognition_results.clear()
                    for face_idx, face_bbox in enumerate(faces):
                        face = edge.crop_face(img, face_bbox["box"])
                        await face_queue.add_face(
                            face, 
                            make_callback(face_idx, recognition_results)
                        )
                frame = edge.encode_frame(img)
            await camera_manager.broadcast(frame)

    except Exception as e:
        logger.error(f"Camera WebSocket error: {e}")
        await camera_manager.disconnect(websocket)


def make_callback(face_idx: int, results_dict: dict):
    def callback(result, confidence):
        results_dict[face_idx] = (result, confidence)
    return callback