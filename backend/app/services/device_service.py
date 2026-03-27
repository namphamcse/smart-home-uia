from app.schemas.device import DeviceCreate, DeviceUpdate
from app.repositories import DeviceRepository
from app.core.exceptions import *

from app.utils.logger import get_logger
logger = get_logger(__name__)

class DeviceService:
    def __init__(self, repo: DeviceRepository):
        self.repo = repo

    def get_by_id(self, device_id: int) -> dict:
        device = self.repo.get_by_id(device_id)
        if not device:
            raise DeviceNotFoundException(device_id)  # domain exception
        return device

    def create(self, payload: DeviceCreate) -> dict:
        existing = self.repo.get_by_name(payload.name)
        if existing:
            raise DuplicateDeviceException(payload.name)
        return self.repo.create(payload.model_dump())

    def update(self, device_id: int, payload: DeviceUpdate) -> dict:
        self.get_by_id(device_id)  # auto raise if not found
        return self.repo.update(device_id, payload.model_dump(exclude_unset=True))

    def delete(self, device_id: int) -> None:
        self.get_by_id(device_id) 
        self.repo.delete(device_id)

    def get_all(self) -> list:
        return self.repo.get_all()