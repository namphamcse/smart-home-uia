from app.schemas.device import DeviceCreate, DeviceUpdate
from app.schemas.device_control import DeviceControlCreate
from app.schemas.notification import NotificationCreate
from app.repositories import DeviceRepository
from app.core.exceptions import *
from app.core.enums import *
from app.services.device_control_service import DeviceControlService
from app.services.notification_service import NotificationService

from app.utils.logger import get_logger
logger = get_logger(__name__)

class DeviceService:
    def __init__(self, repo: DeviceRepository, control: DeviceControlService, notification: NotificationService):
        self.repo = repo
        self.control = control
        self.notification = notification

    def get_by_id(self, device_id: int) -> dict:
        device = self.repo.get_by_id(device_id)
        if not device:
            raise DeviceNotFoundException(device_id)  # domain exception
        return device

    def create(self, payload: DeviceCreate) -> dict:
        existing = self.repo.get_by_name(payload.device_name)
        if existing:
            raise DuplicateDeviceException(payload.device_name)
        device = self.repo.create(payload.model_dump())

        # notification logic
        self.notification.create(
            NotificationCreate(
                device_id=device['device_id'],
                title=f"New {device['device_name']} Added",
                description=f"{device['device_name']} has been added to the system.",
                notification_type=NotificationTypeEnum.DEVICE,
                severity=SeverityEnum.LOW
            )
        )
        return device

    def update(self, device_id: int, payload: DeviceUpdate) -> dict:
        device = self.get_by_id(device_id)  # auto raise if not found

        data = payload.model_dump(exclude_unset=True)

        # handle if device change status (create device control)
        if "is_active" in data:
            self.control.create(DeviceControlCreate(device_id=device_id,
                                                    device_name=device['device_name'],
                                                    action=ActionEnum.TURN_ON if data["is_active"] else ActionEnum.TURN_OFF,
                                                    value=None,
                                                    source=SourceEnum.APP))
        
        # notification logic
        changed_fields = [k for k in data.keys() if k != "is_active"]
        # if device change other field -> create notification 
        if changed_fields != []: 
            changes = []

            for key, n_value in data.items():
                if key == "is_active":
                    continue

                o_value = device.get(key)

                if o_value != n_value:
                    changes.append(f"{key.replace('_', ' ').title()} -> {n_value}")

            self.notification.create(NotificationCreate(
                device_id=device_id,
                title=f"{device["device_name"]} Settings Updated",
                description= "Updated: " + ", ".join(changes),
                notification_type=NotificationTypeEnum.DEVICE,
                severity=SeverityEnum.LOW
            ))
            
        return self.repo.update(device_id, data)

    def delete(self, device_id: int) -> None:
        device = self.get_by_id(device_id) 

        self.repo.delete(device_id)

        # notification logic
        self.notification.create(
            NotificationCreate(
                device_id=device_id,
                title=f"{device['device_name']} Removed",
                description=f"{device['device_name']} has been removed from the system.",
                notification_type=NotificationTypeEnum.DEVICE,
                severity=SeverityEnum.MEDIUM
            )
        )

    def get_all(self) -> list:
        return self.repo.get_all()