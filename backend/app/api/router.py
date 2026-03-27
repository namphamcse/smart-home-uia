from fastapi import APIRouter
from app.api.endpoints import *

api_router = APIRouter()

api_router.include_router(devices_router, prefix="/devices", tags=["Devices"])
api_router.include_router(sensors_router, prefix="/sensors", tags=["Sensors"])
api_router.include_router(alert_thresholds_router, prefix="/alert-thresholds", tags=["Alert Thresholds"])
api_router.include_router(device_controls_router, prefix="/device-controls", tags=["Device Controls"])
api_router.include_router(notifications_router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(automation_rules_router, prefix="/automation-rules", tags=["Automation Rules"])
api_router.include_router(sensor_logs_router, prefix="/sensor-logs", tags=["Sensor Logs"])
api_router.include_router(websocket_router, prefix="/ws", tags=["WebSocket"])