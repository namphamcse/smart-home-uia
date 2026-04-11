import './SummaryRow.css'
import type { Device } from '../../types/device'
export default function SummaryRow({devices}: {devices: Device[]}) {

  return (
    <div className="summary-row">
      <div className="sum-card card-users">
        <div className="sum-icon"><i className="fa-solid fa-users"></i></div>
        <div className="sum-meta">
          <div className="sum-label">Total Users</div>
          <div className="sum-val" id="sum-users">3</div>
          <div className="sum-sub">1 admin · 2 users</div>
        </div>
      </div>
      <div className="sum-card card-online">
        <div className="sum-icon"><i className="fa-solid fa-circle-check"></i></div>
        <div className="sum-meta">
          <div className="sum-label">Devices Online</div>
          <div className="sum-val" id="sum-online">{devices.filter(d => d.status === 'online').length}</div>
          <div className="sum-sub">
            of <span id="sum-total-dev">{devices.length}</span> total
          </div>
        </div>
      </div>
      <div className="sum-card card-offline">
        <div className="sum-icon"><i className="fa-solid fa-circle-xmark"></i></div>
        <div className="sum-meta">
          <div className="sum-label">Offline / Error</div>
          <div className="sum-val" id="sum-offline">{devices.filter(d => d.status === 'offline' || d.status === 'error').length}</div>
          <div className="sum-sub">requires attention</div>
        </div>
      </div>
      <div className="sum-card card-errors">
        <div className="sum-icon">
          <i className="fa-solid fa-triangle-exclamation"></i>
        </div>
        <div className="sum-meta">
          <div className="sum-label">Errors (24 h)</div>
          <div className="sum-val" id="sum-errors">4</div>
          <div className="sum-sub">2 critical</div>
        </div>
      </div>
      <div className="sum-card card-uptime">
        <div className="sum-icon"><i className="fa-solid fa-server"></i></div>
        <div className="sum-meta">
          <div className="sum-label">System Uptime</div>
          <div className="sum-val">99.3%</div>
          <div className="sum-sub">last 7 days</div>
        </div>
      </div>
    </div>
  )
}