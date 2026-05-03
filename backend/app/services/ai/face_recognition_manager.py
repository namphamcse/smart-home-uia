from typing import Optional, Tuple
import numpy as np
import logging
from app.core.enums import RecognitionEnum
from app.services import FaceEmbeddingRepository
from app.services import FaceRecognitionService

logger = logging.getLogger(__name__)

class FaceRecognitionManager:
    """Manager to orchestrate face recognition workflow"""
    
    def __init__(self, recognition_service: FaceRecognitionService, embedding_repo: FaceEmbeddingRepository, similarity_threshold: float = 0.5):
        self.recognition_service = recognition_service
        self.embedding_repo = embedding_repo
        self.similarity_threshold = similarity_threshold
    
    async def recognize_face(self, face_image: np.ndarray) -> Tuple[RecognitionEnum, float]:
        try:
            # Extract embedding from face image
            embedding = await self.recognition_service.extract_embedding(face_image)
            
            if embedding is None:
                return RecognitionEnum.UNKNOWN, 0.0
            
            
            all_embeddings = await self.embedding_repo.get_all_embeddings()
            
            if not all_embeddings:
                logger.warning("No embeddings found in repository")
                return RecognitionEnum.UNKNOWN, 0.0
            
            best_match_user_id = None
            best_similarity = 0.0
            
            for user_id, stored_embedding in all_embeddings.items():
                similarity = await self.recognition_service.compare_faces(
                    embedding,
                    stored_embedding,
                    self.similarity_threshold
                )
                
                logger.debug(f"Comparing with {user_id}: similarity={similarity:.4f}")
                
                if similarity >= self.similarity_threshold:
                    logger.info(f"Face matched with user: {user_id} (similarity: {similarity:.4f})")
                    return RecognitionEnum.OWNER, similarity
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_user_id = user_id
            
            logger.info(f"Face is stranger (best match: {best_match_user_id} with similarity {best_similarity:.4f})")
            return RecognitionEnum.STRANGER, best_similarity
        except Exception as e:
            logger.error(f"Face recognition failed: {e}")
            return RecognitionEnum.UNKNOWN, 0.0,
    
    async def register_owner_face(self, face_image: np.ndarray, owner_name: str) -> bool:
        try:
            embedding = await self.recognition_service.extract_embedding(face_image)
            if embedding is None:
                return False
            
            await self.embedding_repo.save_embedding(
                owner_name,
                embedding,
                metadata={'face_registered': True}
            )
            logger.info(f"Owner face registered: {owner_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to register owner face: {e}")
            return False