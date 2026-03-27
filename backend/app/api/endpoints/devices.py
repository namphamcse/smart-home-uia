from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceResponse
from app.services import DeviceService
from app.core.dependencies import get_current_user


router = APIRouter(
    tags=["Devices"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[DeviceResponse])
@inject
def list_devices(
    service: DeviceService = Depends(Provide[Container.device_service]),
):  
    return service.get_all()


@router.get("/{device_id}", response_model=DeviceResponse)
@inject
def get_device(
    device_id: int,
    service: DeviceService = Depends(Provide[Container.device_service]),
):
    return service.get_by_id(device_id)


@router.post("/", response_model=DeviceResponse, status_code=status.HTTP_201_CREATED)
@inject
def create_device(
    payload: DeviceCreate,
    service: DeviceService = Depends(Provide[Container.device_service]),
):
    return service.create(payload)


@router.put("/{device_id}", response_model=DeviceResponse)
@inject
def update_device(
    device_id: int,
    payload: DeviceUpdate,
    service: DeviceService = Depends(Provide[Container.device_service]),
):
    return service.update(device_id, payload)


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
def delete_device(
    device_id: int,
    service: DeviceService = Depends(Provide[Container.device_service]),
):
    service.delete(device_id)
