from app.schemas.notification import NotificationCreate, NotificationUpdate
from app.repositories import NotificationRepository
from app.core.exceptions import *


class NotificationService:
    def __init__(self, repo: NotificationRepository):
        self.repo = repo

    def get_by_id(self, notification_id: int) -> dict:
        notification = self.repo.get_by_id(notification_id)
        if not notification:
            raise NotificationNotFoundException(notification_id)
        return notification

    def get_all(self) -> list:
        return self.repo.get_all()

    def create(self, payload: NotificationCreate) -> dict:
        return self.repo.create(payload.model_dump())

    def update(self, notification_id: int, payload: NotificationUpdate) -> dict:
        self.get_by_id(notification_id)
        return self.repo.update(notification_id, payload.model_dump(exclude_unset=True))

    def delete(self, notification_id: int) -> None:
        self.get_by_id(notification_id)
        self.repo.delete(notification_id)