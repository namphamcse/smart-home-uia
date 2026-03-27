from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.notification import *
from app.services import NotificationService
from app.core.dependencies import get_current_user


router = APIRouter(
    tags=["Notifications"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[NotificationResponse])
@inject
def list_notifications(
    service: NotificationService = Depends(Provide[Container.notification_service]),
):
    return service.get_all()


@router.get("/{notification_id}", response_model=NotificationResponse)
@inject
def get_notification(
    notification_id: int,
    service: NotificationService = Depends(Provide[Container.notification_service]),
):
    return service.get_by_id(notification_id)


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
@inject
def create_notification(
    payload: NotificationCreate,
    service: NotificationService = Depends(Provide[Container.notification_service]),
):
    return service.create(payload)


@router.put("/{notification_id}", response_model=NotificationResponse)
@inject
def update_notification(
    notification_id: int,
    payload: NotificationUpdate,
    service: NotificationService = Depends(Provide[Container.notification_service]),
):
    return service.update(notification_id, payload)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
def delete_notification(
    notification_id: int,
    service: NotificationService = Depends(Provide[Container.notification_service]),
):
    service.delete(notification_id)