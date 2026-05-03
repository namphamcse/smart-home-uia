import asyncio
import time
from typing import Callable, Optional
from app.core.enums import *
from app.schemas.notification import NotificationCreate
import logging

from app.services.notification_service import NotificationService
from app.mqtt.client import MQTTGateway

logger = logging.getLogger(__name__)

class FaceRecognitionQueue: 
    def __init__(self, face_manager, notification: NotificationService, mqtt: MQTTGateway, max_queue_size: int = 10, cooldown: int = 10):
        self.face_manager = face_manager
        self.notification = notification
        self.mqtt = mqtt
        self.queue: asyncio.Queue = asyncio.Queue(maxsize=max_queue_size)
        self.is_processing = False
        self.cooldown = cooldown
        self.last_recognition_time = 0
    
    async def start_worker(self):
        """Start background worker"""
        self.is_processing = True
        try:
            while self.is_processing:
                try:
                    face_image, callback = await asyncio.wait_for(
                        self.queue.get(), 
                        timeout=1.0
                    )
                    
                    # Process face recognition
                    result, confidence = await self.face_manager.recognize_face(face_image)
                    
                    logger.info(f"Recognition result: {result}, confidence: {confidence:.4f}")
                    # Call callback with result
                    if callback:
                        callback(result, confidence)
                        if self._should_trigger_action():
                            self.last_recognition_time = time.time()
                            self._trigger_action(result, confidence)
                    
                except asyncio.TimeoutError:
                    continue
                except Exception as e:
                    logger.error(f"Error processing face: {e}")
        
        except Exception as e:
            logger.error(f"Worker crashed: {e}")
            self.is_processing = False
    
    async def add_face(self, face_image, callback: Optional[Callable] = None):
        """Add face to queue for processing"""
        try:
            self.queue.put_nowait((face_image, callback))
        except asyncio.QueueFull:
            logger.warning("Face recognition queue is full, skipping frame")
    
    def stop_worker(self):
        """Stop background worker"""
        self.is_processing = False
    

    def _should_trigger_action(self) -> bool:
        """Check if enough time has passed since last recognition"""        
        current_time = time.time()
        last_time = self.last_recognition_time
        time_elapsed = current_time - last_time
        
        if time_elapsed >= self.cooldown:
            return True
        
        return False
    
    def _trigger_action(self, result: RecognitionEnum, confidence: float):
        if result == RecognitionEnum.STRANGER:
            self.notification.create(NotificationCreate(
                title="Unknown Person Detected",
                description=f"A face that is not recognized has been detected at your entrance. Please check your camera feed immediately.",
                notification_type=NotificationTypeEnum.ALERT,
                severity=SeverityEnum.HIGH
            ))
            self.mqtt.send_command({"Front Door": 0})
        elif result == RecognitionEnum.OWNER:
            self.notification.create(NotificationCreate(
                title="Welcome Home",
                description=f"Welcome back! The system has recognized you as the owner. You can now control your smart home devices.",
                notification_type=NotificationTypeEnum.ALERT,
                severity=SeverityEnum.LOW
            ))
            self.mqtt.send_command({"Front Door": 1})