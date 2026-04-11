import type { AutomationRule } from '../../types/automation';
import './SummaryRow.css'
export default function SummaryRow({ rules }: { rules: AutomationRule[] }) {
  return (
    <div className="summary-bar">
      <div className="sb-seg seg-total">
        <div className="sb-icon"><i className="fa-solid fa-list-check"></i></div>
        <div>
          <div className="sb-label">Total Rules</div>
          <div className="sb-val" id="sb-total">{rules.length}</div>
        </div>
      </div>
      <div className="sb-seg seg-active">
        <div className="sb-icon"><i className="fa-solid fa-circle-play"></i></div>
        <div>
          <div className="sb-label">Active</div>
          <div className="sb-val" id="sb-active">{rules.filter(r => r.is_active).length}</div>
        </div>
      </div>
      <div className="sb-seg seg-sensor">
        <div className="sb-icon"><i className="fa-solid fa-microchip"></i></div>
        <div>
          <div className="sb-label">Sensor Rules</div>
          <div className="sb-val" id="sb-sensor">{rules.filter(r => r.trigger_type === 'sensor').length}</div>
        </div>
      </div>
      <div className="sb-seg seg-sched">
        <div className="sb-icon"><i className="fa-solid fa-clock"></i></div>
        <div>
          <div className="sb-label">Schedule Rules</div>
          <div className="sb-val" id="sb-sched">{rules.filter(r => r.trigger_type === 'schedule').length}</div>
        </div>
      </div>
      <div className="sb-seg seg-exec">
        <div className="sb-icon"><i className="fa-solid fa-bolt"></i></div>
        <div>
          <div className="sb-label">Executions Today</div>
          <div className="sb-val" id="sb-exec">0</div>
        </div>
      </div>
    </div>
  )
}