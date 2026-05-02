import { useEffect, useState } from 'react';
import { useDevices } from '../../hooks/useDevices';
import type { Action, AutomationRule, AutomationRuleCreate, AutomationRuleUpdate, ConditionOperator, TriggerType } from '../../types/automation';
import { useNoti } from '../../services/NotiProvider';
type OverlayState = { type: string, rule?: AutomationRule };

type RuleFormState = {
  device_id: number;
  sensor_id: number | null;
  automation_rule_name: string;
  trigger_type: TriggerType;
  condition_operator: ConditionOperator;
  condition_value: number;
  schedule_time: string;
  repeat_days: string;
  action: Action;
  is_active: boolean;
};

const SENSOR_OPTIONS = [
  { id: 2, label: 'Temperature (C)' },
  { id: 3, label: 'Humidity (%)' },
  { id: 4, label: 'Light Level (lux)' },
];

const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function timeToIso(timeStr: string) {
  const [hh, mm] = (timeStr || '00:00').split(':').map(Number);
  const d = new Date();
  const yyyy = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hhStr = String(hh).padStart(2, '0');
  const mmStr = String(mm).padStart(2, '0');
  return `${yyyy}-${M}-${dd}T${hhStr}:${mmStr}:00`;
}

function isoToTime(iso?: string | null) {
  if (!iso) return '23:00';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const DEFAULT_RULE: RuleFormState = {
  device_id: 0,
  sensor_id: SENSOR_OPTIONS[0].id,
  automation_rule_name: '',
  trigger_type: 'sensor',
  condition_operator: '>',
  condition_value: 0,
  schedule_time: '23:00',
  repeat_days: 'Mon,Tue,Wed,Thu,Fri',
  action: 'turn_on',
  is_active: true,
};

function toRuleForm(rule?: AutomationRule, fallbackDeviceId = 0): RuleFormState {
  if (!rule) {
    return {
      ...DEFAULT_RULE,
      device_id: fallbackDeviceId,
    };
  }

  return {
    device_id: rule.device_id ?? fallbackDeviceId,
    sensor_id: rule.sensor_id ?? SENSOR_OPTIONS[0].id,
    automation_rule_name: rule.automation_rule_name ?? '',
    trigger_type: rule.trigger_type ?? 'sensor',
    condition_operator: rule.condition_operator ?? '>',
    condition_value: rule.condition_value ?? 0,
    schedule_time: rule.schedule_time ? isoToTime(String(rule.schedule_time)) : '23:00',
    repeat_days: rule.repeat_days ?? 'Mon,Tue,Wed,Thu,Fri',
    action: rule.action ?? 'turn_on',
    is_active: rule.is_active ?? true,
  };
}

export default function ModalOverlay({
  overlayType,
  setOverlayType,
  onSaveRule,
  onDeleteRule,
}: {
  overlayType: OverlayState,
  setOverlayType: (overlayType: OverlayState) => void,
  onSaveRule: (payload: AutomationRuleCreate | AutomationRuleUpdate) => Promise<void>,
  onDeleteRule: () => Promise<void>,
}) {
  const devices = useDevices();
  const [form, setForm] = useState<RuleFormState>(DEFAULT_RULE);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeOverlay = () => {
    setOverlayType({ type: '', rule: undefined });
  };
  const { setNotification } = useNoti();
  useEffect(() => {
    if (overlayType.type !== 'edit') return;

    const nextForm = toRuleForm(overlayType.rule, devices[0]?.device_id ?? 0);
    setForm(nextForm);
    setSelectedDays(
      (nextForm.repeat_days || '')
        .split(',')
        .map((day) => day.trim())
        .filter(Boolean)
    );
  }, [overlayType, devices]);

  useEffect(() => {
    if (form.device_id || devices.length === 0) return;
    setForm((prev) => ({ ...prev, device_id: devices[0].device_id }));
  }, [devices, form.device_id]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSaveRule = async () => {
    if (!form.automation_rule_name.trim()) {
      setNotification('Rule name is required.');
      return;
    }
    if (!form.device_id) {
      setNotification('Target device is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: AutomationRuleCreate | AutomationRuleUpdate = {
        device_id: Number(form.device_id),
        sensor_id: form.trigger_type === 'sensor' ? Number(form.sensor_id) : null,
        automation_rule_name: form.automation_rule_name.trim(),
        trigger_type: form.trigger_type,
        condition_operator: form.trigger_type === 'sensor' ? form.condition_operator : '>',
        condition_value: form.trigger_type === 'sensor' ? Number(form.condition_value) : 0,
        schedule_time: form.trigger_type === 'schedule' ? timeToIso(form.schedule_time) : null,
        repeat_days: form.trigger_type === 'schedule' ? selectedDays.join(',') : '',
        action: form.action,
        is_active: form.is_active,
      };
      console.log('Saving rule with payload:', payload);

      await onSaveRule(payload);
      setNotification(overlayType.rule ? 'Rule updated successfully.' : 'Rule created successfully.');
      closeOverlay();
    } catch (error) {
      console.error('Error saving automation rule:', error);
      setNotification('Failed to save rule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteRule();
      setNotification('Rule deleted successfully.');
      closeOverlay();
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      setNotification('Failed to delete rule. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`modal-overlay ${overlayType?.type === 'edit' ? 'open' : ''}`} id="modal-overlay" onClick={closeOverlay}>
        <div className="modal" id="rule-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <div className="modal-head-icon"><i className="fa-solid fa-gears"></i></div>
            <div className="modal-head-title" id="modal-title">{overlayType?.rule?.automation_rule_name || 'Create New Rule'}</div>
            <button onClick={closeOverlay} className="modal-close" id="modal-close">
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="form-row single">
              <div className="form-field">
                <label className="form-label">Rule Name</label>
                <input
                  type="text"
                  className="form-input"
                  id="f-name"
                  placeholder="e.g. Auto Fan When Hot"
                  value={form.automation_rule_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, automation_rule_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-row single">
              <div className="form-field">
                <label className="form-label">Trigger Type</label>
                <div className="trigger-types">
                  <button
                    type="button"
                    className={`trigger-type-btn ${form.trigger_type === 'sensor' ? 'active' : ''}`}
                    data-trigger="sensor"
                    onClick={() => setForm((prev) => ({ ...prev, trigger_type: 'sensor' }))}
                  >
                    <i className="fa-solid fa-microchip"></i> Sensor Based
                  </button>
                  <button
                    type="button"
                    className={`trigger-type-btn ${form.trigger_type === 'schedule' ? 'active' : ''}`}
                    data-trigger="schedule"
                    onClick={() => setForm((prev) => ({ ...prev, trigger_type: 'schedule' }))}
                  >
                    <i className="fa-solid fa-clock"></i> Schedule
                  </button>
                </div>
              </div>
            </div>

            <div className={`trigger-section ${form.trigger_type === 'sensor' ? 'active' : ''}`} id="section-sensor">
              <div className="form-row single">
                <div
                  className="form-label"
                  style={{
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-microchip" style={{ fontSize: '10px' }}></i>
                  Sensor Condition
                </div>
              </div>
              <div className="form-row triple">
                <div className="form-field">
                  <label className="form-label">Sensor</label>
                  <select
                    className="form-select"
                    id="f-sensor"
                    value={form.sensor_id ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, sensor_id: Number(e.target.value) }))}
                  >
                    {SENSOR_OPTIONS.map((sensor) => (
                      <option key={sensor.id} value={sensor.id}>{sensor.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Operator</label>
                  <select
                    className="form-select"
                    id="f-operator"
                    value={form.condition_operator}
                    onChange={(e) => setForm((prev) => ({ ...prev, condition_operator: e.target.value as ConditionOperator }))}
                  >
                    <option value=">">&gt; Greater than</option>
                    <option value="<">&lt; Less than</option>
                    <option value=">=">&gt;= At least</option>
                    <option value="<=">&lt;= At most</option>
                    <option value="==">== Equal to</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Threshold Value</label>
                  <input
                    type="number"
                    className="form-input"
                    id="f-threshold"
                    placeholder="e.g. 35"
                    value={Number.isNaN(form.condition_value) ? 0 : form.condition_value}
                    onChange={(e) => setForm((prev) => ({ ...prev, condition_value: Number(e.target.value || 0) }))}
                  />
                </div>
              </div>
            </div>

            <div className={`trigger-section ${form.trigger_type === 'schedule' ? 'active' : ''}`} id="section-schedule">
              <div className="form-row single">
                <div
                  className="form-label"
                  style={{
                    color: 'var(--purple)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                  <i className="fa-solid fa-clock" style={{ fontSize: '10px' }}></i>
                  Schedule Settings
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Time</label>
                  <input
                    type="time"
                    className="form-input"
                    id="f-time"
                    value={form.schedule_time}
                    onChange={(e) => setForm((prev) => ({ ...prev, schedule_time: e.target.value }))}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Repeat Days</label>
                  <div className="day-picker">
                    {DAY_OPTIONS.map((day) => (
                      <div
                        key={day}
                        className={`day-cb ${selectedDays.includes(day) ? 'checked' : ''}`}
                        data-day={day}
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="form-divider"></div>
            <div className="form-row single">
              <div
                className="form-label"
                style={{
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                <i className="fa-solid fa-bolt" style={{ fontSize: '10px' }}></i> Action
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Target Device</label>
                <select
                  className="form-select"
                  id="f-device"
                  value={form.device_id}
                  onChange={(e) => setForm((prev) => ({ ...prev, device_id: Number(e.target.value) }))}
                >
                  {devices.map((d) => (
                    <option key={d.device_id} value={d.device_id}>{d.device_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Action</label>
                <select
                  className="form-select"
                  id="f-action"
                  value={form.action}
                  onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value as Action }))}
                >
                  <option value="turn_on">Turn ON</option>
                  <option value="turn_off">Turn OFF</option>
                  <option value="set_angle">Set Angle</option>
                  <option value="set_speed">Set Speed</option>
                  <option value="set_color">Set Color</option>
                </select>
              </div>
            </div>

            <div className="form-row single">
              <div className="form-field">
                <label className="form-label" htmlFor="f-active">Active</label>
                <input
                  id="f-active"
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-save" id="btn-save-rule" onClick={handleSaveRule} disabled={isSubmitting}>
              <i className="fa-solid fa-floppy-disk"></i> Save Rule
            </button>
            <button onClick={closeOverlay} className="btn-cancel" id="btn-cancel-modal" disabled={isSubmitting}>Cancel</button>
          </div>
        </div>
      </div>

      <div className={`confirm-overlay ${overlayType?.type === 'delete' ? 'open' : ''}`} id="confirm-overlay" onClick={closeOverlay}>
        <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-icon"><i className="fa-solid fa-trash"></i></div>
          <div className="confirm-title">Delete Rule?</div>
          <div className="confirm-sub" id="confirm-sub">
            This rule will be permanently removed.
          </div>
          <div className="confirm-btns">
            <button className="btn-confirm-del" id="btn-confirm-del" onClick={handleDeleteRule} disabled={isSubmitting}>Delete</button>
            <button className="btn-confirm-cancel" id="btn-confirm-cancel" onClick={closeOverlay} disabled={isSubmitting}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}