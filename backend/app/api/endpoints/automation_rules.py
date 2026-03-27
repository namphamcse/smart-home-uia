from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from app.core.container import Container
from app.schemas.automation_rule import *
from app.services import AutomationRuleService
from app.core.dependencies import get_current_user


router = APIRouter(
    tags=["AutomationRules"],
    dependencies=[Depends(get_current_user)]
)


@router.get("/", response_model=list[AutomationRuleResponse])
@inject
def list_automation_rules(
    service: AutomationRuleService = Depends(Provide[Container.automation_rule_service]),
):
    return service.get_all()


@router.get("/{automation_rule_id}", response_model=AutomationRuleResponse)
@inject
def get_automation_rule(
    automation_rule_id: int,
    service: AutomationRuleService = Depends(Provide[Container.automation_rule_service]),
):
    return service.get_by_id(automation_rule_id)


@router.post("/", response_model=AutomationRuleResponse, status_code=status.HTTP_201_CREATED)
@inject
def create_automation_rule(
    payload: AutomationRuleCreate,
    service: AutomationRuleService = Depends(Provide[Container.automation_rule_service]),
):
    return service.create(payload)


@router.put("/{automation_rule_id}", response_model=AutomationRuleResponse)
@inject
def update_automation_rule(
    automation_rule_id: int,
    payload: AutomationRuleUpdate,
    service: AutomationRuleService = Depends(Provide[Container.automation_rule_service]),
):
    return service.update(automation_rule_id, payload)


@router.delete("/{automation_rule_id}", status_code=status.HTTP_204_NO_CONTENT)
@inject
def delete_automation_rule(
    automation_rule_id: int,
    service: AutomationRuleService = Depends(Provide[Container.automation_rule_service]),
):
    service.delete(automation_rule_id)