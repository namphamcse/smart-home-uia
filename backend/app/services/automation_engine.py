from datetime import datetime
from app.core.enums import TriggerTypeEnum
from app.repositories import AutomationRuleRepository
from app.core.scheduler import Scheduler
from app.mqtt.client import MQTTGateway
from app.services.device_service import DeviceService
from app.services.notification_service import NotificationService
from app.core.enums import *
from app.schemas.notification import NotificationCreate
from app.schemas.device import DeviceUpdate

class AutomationEngine:
    def __init__(self, repo: AutomationRuleRepository, device: DeviceService, notification: NotificationService, scheduler: Scheduler, mqtt: MQTTGateway):
        self.repo = repo
        self.device = device
        self.scheduler = scheduler
        self.mqtt = mqtt
        self.notification = notification

    def register_rule(self, rule: dict):
        if not rule.get("is_active"):
            return

        if rule["trigger_type"] == TriggerTypeEnum.SCHEDULE:
            self._schedule_rule(rule)

    def unregister_rule(self, rule_id: int):
        job_id = f"{rule_id}"
        self.scheduler.remove_job(job_id)

    def load_all(self):
        rules = self.repo.get_all()
        for rule in rules:
            self.register_rule(rule)

    def _schedule_rule(self, rule: dict):
        job_id = f"{rule['automation_rule_id']}"

        schedule_time = rule.get("schedule_time")

        self.scheduler.add_job(
            job_id=job_id,
            func=self.execute_rule,
            run_time=schedule_time,
            args=[rule["automation_rule_id"]],
        )

        self.device.update(rule["device_id"], DeviceUpdate(device_mode=DeviceModeEnum.AUTO))

    def sensor_rule(self, sensor_id: int, value: float):
        rules = self.repo.get_by_sensor_id(sensor_id)

        for rule in rules:
            if not rule.get("is_active"):
                continue

            condition_met = False
            if rule["condition_operator"] == ConditionOperatorEnum.GT:
                condition_met = value > rule["condition_value"]
            elif rule["condition_operator"] == ConditionOperatorEnum.LT:
                condition_met = value < rule["condition_value"]
            elif rule["condition_operator"] == ConditionOperatorEnum.EQ:
                condition_met = value == rule["condition_value"]
            elif rule["condition_operator"] == ConditionOperatorEnum.GE:
                condition_met = value >= rule["condition_value"]
            elif rule["condition_operator"] == ConditionOperatorEnum.LE:
                condition_met = value <= rule["condition_value"]

            if condition_met:
                self.execute_rule(rule["automation_rule_id"])
            
    def execute_rule(self, rule_id: int):
        rule = self.repo.get_by_id(rule_id)

        if not rule or not rule["is_active"]:
            return
        
        device = self.device.get_by_id(rule["device_id"])

        self.mqtt.send_command({device["device_name"]: 1 if rule["action"] == ActionEnum.TURN_ON else 0})

        self.notification.create(NotificationCreate(
            title=f"Automation Triggered: {rule['automation_rule_name']}",
            description=(
                f"The automation rule '{rule['automation_rule_name']}' was triggered and "
                f"executed the action: {rule['action']} on device '{device['device_name']}'."
            ),
            notification_type=NotificationTypeEnum.SYSTEM,
            severity=SeverityEnum.MEDIUM
        ))

        if not rule.get("repeat_days"):
            self.repo.update(rule_id, {"is_active": False})
