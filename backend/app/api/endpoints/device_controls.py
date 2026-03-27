from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.device_control import *
from app.services import DeviceControlService
from app.core.dependencies import get_current_user


router = APIRouter(
    tags=["DeviceControls"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=list[DeviceControlResponse])
@inject
def list_device_controls(
    device_id: int | None = None, # ?device_id={device_id}
    service: DeviceControlService = Depends(Provide[Container.device_control_service]),
):
    if device_id:
        return service.get_by_device_id(device_id)
    return service.get_all()

@router.post("/", response_model=DeviceControlResponse, status_code=status.HTTP_201_CREATED)
@inject
def create_device_control(
    payload: DeviceControlCreate,
    service: DeviceControlService = Depends(Provide[Container.device_control_service]),
):
    return service.create(payload)