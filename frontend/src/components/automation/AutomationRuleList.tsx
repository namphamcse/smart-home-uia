import './AutomationRuleList.css'
import { useEffect, useState } from 'react';
import type { AutomationRule } from '../../types/automation';
import { useNoti } from '../../services/NotiProvider';
const API_URL = import.meta.env.VITE_API_URL;
export default function AutomationRuleList({ rule, setOverlayType }: { rule: AutomationRule, setOverlayType: (overlayType: { type: string, rule?: AutomationRule }) => void }) {
  const { setNotification } = useNoti();
  const [isActive, setIsActive] = useState(rule.is_active);

  useEffect(() => {
    setIsActive(rule.is_active);
  }, [rule.is_active]);

  const handleDummyToggle = async () => {
    try {
      const response = await fetch(`${API_URL}/automation-rules/${rule.automation_rule_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...rule, is_active: !isActive }),
      });
      if (!response.ok) {
        throw new Error('Failed to update automation rule status');
      }
      setNotification('Automation rule toggled successfully');
      setIsActive((prev) => !prev);
    } catch (error) {
      console.error('Error toggling automation rule:', error);
      setNotification('Failed to toggle automation rule');
    }
  };

  return (
    <div className={`rule-card ${isActive ? '' : 'inactive'}`} data-id="1" data-type={rule.trigger_type} style={{ animationDelay: '0s' }}>
      <div className="rule-head">
        <div className="rule-type-icon"><i className={`fa-solid fa-${rule.trigger_type === 'schedule' ? 'clock' : 'microchip'}`}></i></div>
        <div className="rule-meta">
          <div className="rule-name">{rule.automation_rule_name}</div>
          <span className={`rule-type-badge badge-${rule.trigger_type.toLowerCase()}`}>
            {rule.trigger_type}
          </span>
        </div>
        <label className="rule-toggle" title="Disable rule">
          <input type="checkbox" className="rule-toggle-input" data-id="1" checked={isActive} onChange={handleDummyToggle} />
          <div className="rule-toggle-track"></div>
          <div className="rule-toggle-thumb"></div>
        </label>
      </div>

      <div className="rule-condition">
        <span className="cond-part">{rule.condition_value ? rule.condition_value : 'No condition set'}</span>
        <div className="cond-arrow"><i className="fa-solid fa-arrow-right"></i></div>
        <span className="cond-action">{rule.action ? rule.action : 'No action set'}</span>
      </div>

      <div className="rule-footer">
        <span className="rule-last-run">
          <i className="fa-regular fa-clock" style={{ fontSize: '9px' }}></i>
          {rule.schedule_time ? new Date(rule.schedule_time).toLocaleString() : 'Not scheduled'}
        </span>
        <div className="rule-actions">
          <button className="rule-act-btn edit-btn" data-id="1" title="Edit" onClick={() => setOverlayType({ type: 'edit', rule })}>
            <i className="fa-solid fa-pen"></i>
          </button>
          <button className="rule-act-btn del" data-id="1" title="Delete" onClick={() => setOverlayType({ type: 'delete', rule })}>
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  )
}