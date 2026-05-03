from fastapi import APIRouter, Depends, Form, File, UploadFile, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.core.dependencies import get_current_user
from app.services.ai.face_recognition_manager import FaceRecognitionManager
from app.services.edge.mediapipe_processor import MediaPipeFaceDetector
from app.core.enums import RecognitionEnum

router = APIRouter(tags=["Faces"], dependencies=[Depends(get_current_user)])

@router.post("/")
@inject
async def register_owner_face(
    owner_name: str = Form(...),         
    frame: UploadFile = File(...),
    edge: MediaPipeFaceDetector = Depends(Provide[Container.mediapipe_processor]),
    ai: FaceRecognitionManager = Depends(Provide[Container.face_recognition_manager])  
):
    img = edge.decode_frame(await frame.read())
    faces = edge.get_faces(img)
    if not faces:
        return {"message": "No faces detected"}
    
    for face_bbox in faces:
        # crop face from frame
        face = edge.crop_face(img, face_bbox["box"])
        # request ai service to identify the face
        result, confidence = await ai.recognize_face(face)
        
        if result == RecognitionEnum.UNKNOWN:
            success = await ai.register_owner_face(face, owner_name)
            if success:
                return {"message": "Owner face registered successfully"}
            else:
                return {"message": "Failed to register owner face"}, status.HTTP_500_INTERNAL_SERVER_ERROR
