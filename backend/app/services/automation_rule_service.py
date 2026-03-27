from app.schemas.automation_rule import AutomationRuleCreate, AutomationRuleUpdate
from app.repositories import AutomationRuleRepository
from app.core.exceptions import *

class AutomationRuleService:
    def __init__(self, repo: AutomationRuleRepository):
        self.repo = repo

    def get_by_id(self, automation_rule_id: int) -> dict:
        automation_rule = self.repo.get_by_id(automation_rule_id)
        if not automation_rule:
            raise AutomationRuleNotFoundException(automation_rule_id)
        return automation_rule

    def get_all(self) -> list:
        return self.repo.get_all()

    def create(self, payload: AutomationRuleCreate) -> dict:
        return self.repo.create(payload.model_dump())

    def update(self, automation_rule_id: int, payload: AutomationRuleUpdate) -> dict:
        self.get_by_id(automation_rule_id)
        return self.repo.update(automation_rule_id, payload.model_dump(exclude_unset=True))

    def delete(self, automation_rule_id: int) -> None:
        self.get_by_id(automation_rule_id)
        self.repo.delete(automation_rule_id)