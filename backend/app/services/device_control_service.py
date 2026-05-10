from app.schemas.device_control import *
from app.repositories import DeviceControlRepository
from app.core.exceptions import *
from app.core.enums import *
from app.mqtt.client import MQTTGateway
class DeviceControlService:
    def __init__(self, repo: DeviceControlRepository, mqtt: MQTTGateway):
        self.repo = repo
        self.mqtt = mqtt

    def get_by_device_id(self, device_id: int) -> list:
        return self.repo.get_by_device_id(device_id)
    
    def create(self, payload: DeviceControlCreate) -> dict:
        result = self.mqtt.send_command({payload.device_name: 1 if payload.value == ActionEnum.TURN_ON else 0})

        if result is False:
            raise DeviceStateChangeNotAllowedException(payload.device_id)

        return self.repo.create(payload.model_dump(exclude={"device_name"}))
    
    def get_all(self) -> list:
        return self.repo.get_all()