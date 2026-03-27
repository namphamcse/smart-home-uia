from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.sensor import SensorResponse
from app.services import SensorService
from app.core.dependencies import get_current_user

router = APIRouter(
    tags=["Sensors"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[SensorResponse])
@inject
def list_sensors(
    service: SensorService = Depends(Provide[Container.sensor_service]),
):
    return service.get_all()


@router.get("/{sensor_id}", response_model=SensorResponse)
@inject
def get_sensor(
    sensor_id: int,
    service: SensorService = Depends(Provide[Container.sensor_service]),
):
    return service.get_by_id(sensor_id)
