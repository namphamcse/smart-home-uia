from dependency_injector import containers, providers
from app.repositories import *
from app.services import *
from supabase import create_client
from app.core.config import settings

class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    supabase = providers.Singleton(
        create_client,
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY
    )

    device_repo = providers.Factory(DeviceRepository, db=supabase)
    sensor_repo = providers.Factory(SensorRepository, db=supabase)
    sensor_log_repo = providers.Factory(SensorLogRepository, db=supabase)
    alert_threshold_repo = providers.Factory(AlertThresholdRepository, db=supabase)
    notification_repo = providers.Factory(NotificationRepository, db=supabase)
    device_control_repo = providers.Factory(DeviceControlRepository, db=supabase)
    automation_rule_repo = providers.Factory(AutomationRuleRepository, db=supabase)

    device_service = providers.Factory(DeviceService, repo=device_repo)
    sensor_service = providers.Factory(SensorService, repo=sensor_repo)
    sensor_log_service = providers.Factory(SensorLogService, repo=sensor_log_repo)
    alert_threshold_service = providers.Factory(AlertThresholdService, repo=alert_threshold_repo)
    notification_service = providers.Factory(NotificationService, repo=notification_repo)
    device_control_service = providers.Factory(DeviceControlService, repo=device_control_repo)
    automation_rule_service = providers.Factory(AutomationRuleService, repo=automation_rule_repo)