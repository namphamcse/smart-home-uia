from fastapi import APIRouter, Depends
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.alert_threshold import AlertThresholdUpdate, AlertThresholdResponse
from app.services import AlertThresholdService
from app.core.dependencies import get_current_user


router = APIRouter(
    tags=["Alert Thresholds"],
    dependencies=[Depends(get_current_user)]
)

@router.get("/", response_model=list[AlertThresholdResponse])
@inject
def list_alert_thresholds(
    service: AlertThresholdService = Depends(Provide[Container.alert_threshold_service]),
):
    return service.get_all()

@router.get("/{alert_threshold_id}", response_model=AlertThresholdResponse)
@inject
def get_alert_threshold(
    alert_threshold_id: int,
    service: AlertThresholdService = Depends(Provide[Container.alert_threshold_service]),
):
    return service.get_by_id(alert_threshold_id)

@router.put("/{alert_threshold_id}", response_model=AlertThresholdResponse)
@inject
def update_alert_threshold(
    alert_threshold_id: int, 
    payload: AlertThresholdUpdate,
    service: AlertThresholdService = Depends(Provide[Container.alert_threshold_service]),
):
    return service.update(alert_threshold_id, payload)