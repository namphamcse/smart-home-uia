import logging
import numpy as np
import onnxruntime as ort
import os
import urllib.request
from typing import Optional
from scipy.spatial.distance import cosine

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    """Using ONNX Runtime with GPU support for face embedding extraction and comparison"""
    
    def __init__(self, model_path: str, model_url: str):
        try:
            # Ensure model directory exists
            os.makedirs(os.path.dirname(model_path) or ".", exist_ok=True)
            
            # Auto-download model if not exists
            if not os.path.exists(model_path):
                urllib.request.urlretrieve(model_url, model_path)
            
            # Setup ONNX with GPU support
            providers = [
                ('CUDAExecutionProvider', {'cudnn_conv_algo_search': 'EXHAUSTIVE'}),
                'CPUExecutionProvider'
            ]
            
            self.session = ort.InferenceSession(model_path, providers=providers)
            self.input_name = self.session.get_inputs()[0].name
            self.output_name = self.session.get_outputs()[0].name
            
            self.prepared = True
            
        except Exception as e:
            logger.error(f"Failed to initialize FaceRecognitionService: {e}")
            self.prepared = False
    
    async def extract_embedding(self, face_image: np.ndarray) -> Optional[np.ndarray]:
        """Extract embedding using ONNX"""
        if not self.prepared:
            return None
        
        try:
            # Normalize to [-1, 1]
            img = face_image.astype(np.float32)
            img = (img - 127.5) / 128.0
            
            # Shape: (H, W, C) -> (1, H, W, C) - NHWC format
            img = np.expand_dims(img, axis=0)
            
            # Run inference
            output = self.session.run(
                [self.output_name],
                {self.input_name: img}
            )
            
            # Extract and normalize embedding
            embedding = output[0][0]
            embedding = embedding / np.linalg.norm(embedding)
            
            return embedding
        except Exception as e:
            logger.error(f"Embedding extraction failed: {e}")
            return None
    
    async def compare_faces(
        self, 
        embedding1: np.ndarray, 
        embedding2: np.ndarray,
        threshold: float = 0.6
    ) -> float:
        """Compare embeddings using cosine similarity"""
        try:
            distance = cosine(embedding1, embedding2)
            similarity = 1 - distance
            return float(np.clip(similarity, 0, 1))
        except Exception as e:
            logger.error(f"Comparison failed: {e}")
            return 0.0