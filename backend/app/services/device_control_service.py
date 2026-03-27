from app.schemas.device_control import *
from app.repositories import DeviceControlRepository
from app.core.exceptions import *

class DeviceControlService:
    def __init__(self, repo: DeviceControlRepository):
        self.repo = repo

    def get_by_device_id(self, device_id: int) -> list:
        return self.repo.get_by_device_id(device_id)
    
    def create(self, payload: DeviceControlCreate) -> dict:
        return self.repo.create(payload.model_dump())
    
    def get_all(self) -> list:
        return self.repo.get_all()