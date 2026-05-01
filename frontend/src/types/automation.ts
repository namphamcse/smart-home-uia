export type TriggerType = 'sensor' | 'schedule';
export type ConditionOperator = '>' | '<' | '==' | '>=' | '<=';
export type Action = 'turn_on' | 'turn_off' | 'set_color' | 'set_angle' | 'set_speed';

export interface AutomationRule {
  automation_rule_id: number;
  device_id: number;
  sensor_id: number | null;
  automation_rule_name: string;
  trigger_type: TriggerType;
  condition_operator: ConditionOperator;
  condition_value: number;
  schedule_time: string | null;
  repeat_days: string;
  action: Action;
  is_active: boolean;
}

export interface AutomationRuleCreate {
  device_id: number;
  sensor_id: number | null;
  automation_rule_name: string;
  trigger_type: TriggerType;
  condition_operator: ConditionOperator;
  condition_value: number;
  schedule_time: string | null;
  repeat_days: string;
  action: Action;
  is_active: boolean;
}

export interface AutomationRuleUpdate {
  device_id: number;
  sensor_id: number | null;
  automation_rule_name: string;
  trigger_type: TriggerType;
  condition_operator: ConditionOperator;
  condition_value: number;
  schedule_time: string | null;
  repeat_days: string;
  action: Action;
  is_active: boolean;
}
