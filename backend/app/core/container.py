from dependency_injector import containers, providers
from app.repositories import *
from app.services import *
from supabase import create_client
from app.websocket.system_manager import SystemWebSocketManager
from app.websocket.camera_manager import CameraWebSocketManager
from app.mqtt.client import MQTTGateway
from app.core.config import settings
from app.core.scheduler import Scheduler

class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    supabase = providers.Singleton(create_client, settings.SUPABASE_URL, settings.SUPABASE_KEY)

    scheduler = providers.Singleton(Scheduler)

    system_manager = providers.Singleton(SystemWebSocketManager)
    camera_manager = providers.Singleton(CameraWebSocketManager)

    device_repo = providers.Factory(DeviceRepository, supabase)
    sensor_repo = providers.Factory(SensorRepository, supabase)
    sensor_log_repo = providers.Factory(SensorLogRepository, supabase)
    alert_threshold_repo = providers.Factory(AlertThresholdRepository, supabase)
    notification_repo = providers.Factory(NotificationRepository, supabase)
    device_control_repo = providers.Factory(DeviceControlRepository, supabase)
    automation_rule_repo = providers.Factory(AutomationRuleRepository, supabase)

    sensor_service = providers.Factory(SensorService, sensor_repo)
    sensor_log_service = providers.Factory(SensorLogService, sensor_log_repo, sensor_service)
    notification_service = providers.Factory(NotificationService, notification_repo)

    mqtt_gateway = providers.Singleton(MQTTGateway, system_manager, notification_service, sensor_log_service)

    device_control_service = providers.Factory(DeviceControlService, device_control_repo, mqtt_gateway)
    device_service = providers.Factory(DeviceService, device_repo, device_control_service, notification_service)
    
    alert_threshold_service = providers.Factory(AlertThresholdService, alert_threshold_repo)
    automation_engine = providers.Factory(AutomationEngine, automation_rule_repo, device_service, notification_service, scheduler, mqtt_gateway)
    automation_rule_service = providers.Factory(AutomationRuleService, automation_rule_repo, notification_service, automation_engine)

    mediapipe_processor = providers.Factory(MediaPipeFaceDetector, settings.EDGE_MODEL_PATH, settings.EDGE_MODEL_URL)

    face_recognition_service = providers.Factory(FaceRecognitionService, settings.AI_MODEL_PATH, settings.AI_MODEL_URL)
    face_embedding_repo = providers.Singleton(FaceEmbeddingRepository, settings.AI_STORAGE_PATH)
    face_recognition_manager = providers.Factory(FaceRecognitionManager, face_recognition_service, face_embedding_repo)

    face_recognition_queue = providers.Singleton(FaceRecognitionQueue, face_recognition_manager, notification_service, mqtt_gateway)