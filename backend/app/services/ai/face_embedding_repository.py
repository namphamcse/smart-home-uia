# services/face_embedding_repository.py
from typing import Optional, Dict, List
import numpy as np
import json
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class FaceEmbeddingRepository:
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self.embeddings_cache: Dict[str, Dict] = {}
        self._load_embeddings()
    
    def _load_embeddings(self):
        try:
            for embedding_file in self.storage_path.glob("*.json"):
                user_id = embedding_file.stem
                with open(embedding_file, 'r') as f:
                    data = json.load(f)
                    # Convert list to numpy array
                    data['embedding'] = np.array(data['embedding'])
                    self.embeddings_cache[user_id] = data
            logger.info(f"Loaded {len(self.embeddings_cache)} face embeddings")
        except Exception as e:
            logger.error(f"Failed to load embeddings: {e}")
    
    async def get_embedding(self, user_id: str) -> Optional[np.ndarray]:
        if user_id in self.embeddings_cache:
            return self.embeddings_cache[user_id]['embedding']
        return None
    
    async def save_embedding(self, user_id: str, embedding: np.ndarray, metadata: dict = None):
        try:
            data = {
                'user_id': user_id,
                'embedding': embedding.tolist(),
                'metadata': metadata or {},
                'created_at': str(np.datetime64('now'))
            }
            
            embedding_file = self.storage_path / f"{user_id}.json"
            with open(embedding_file, 'w') as f:
                json.dump(data, f)
            
            # Update cache
            self.embeddings_cache[user_id] = {
                'embedding': embedding,
                'metadata': data['metadata']
            }
            logger.info(f"Saved embedding for user: {user_id}")
        except Exception as e:
            logger.error(f"Failed to save embedding: {e}")
    
    async def get_all_embeddings(self) -> Dict[str, np.ndarray]:
        return {
            user_id: data['embedding'] 
            for user_id, data in self.embeddings_cache.items()
        }