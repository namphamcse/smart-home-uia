// Unfinished for now
import './MainDashboard.css'
import { Link } from 'react-router';
import { type LightData, type DHT20Data } from '../../types/device';
import { useWS } from '../../hooks/useWebSocket';
import { useAlerts } from '../../hooks/useAlert';
import { useDevices } from '../../hooks/useDevices';
import { getSensorStatus, useThreshold } from '../../hooks/useSensorStatus';
import DeviceItem from './DeviceItem';
import SensorCard from './LiveSensor';
import AlertItem from './AlertItem';
export default function MainDashboard() {
  const tempData = useWS<DHT20Data>('/5');
  const humidityData = useWS<DHT20Data>('/5');
  const lightData = useWS<LightData>('/3');
  const thresholds = useThreshold();
  const tempStatus = getSensorStatus(thresholds, 1, tempData?.temperature_c);
  const humStatus = getSensorStatus(thresholds, 2, humidityData?.humidity_pct);
  const lightStatus = getSensorStatus(thresholds, 3, lightData?.lux);
  const devices = useDevices();
  const alerts = useAlerts();
  return (
    <div className="main-content">
      <section>
        <div className="section-head">
          <div className="section-title">Live Sensors</div>
          <span className="live-dot">Live</span>
        </div>

        <div className="sensor-grid">
          <SensorCard
            icon="fa-temperature-half"
            label="Temperature"
            value={tempData?.temperature_c}
            unit="°C"
            status={tempStatus}
          />

          <SensorCard
            icon="fa-droplet"
            label="Humidity"
            value={humidityData?.humidity_pct}
            unit="%"
            status={humStatus}
          />

          <SensorCard
            icon="fa-sun"
            label="Light Level"
            value={lightData?.lux.toFixed(0)}
            unit="lux"
            status={lightStatus}
          />
        </div>
      </section>

      <div className="mid-row">
        <div className="device-panel">
          <div className="section-head">
            <div className="section-title">Device Status</div>
            <span className="section-meta" id="devices-online">{
              devices.filter(d => d.status === 'online').length}/{devices.length} Online
            </span>
          </div>

          <div className="device-list">
            {devices.slice(0, 6).map((device) => (
              <DeviceItem
                key={device.device_id}
                device={device}
              />
            ))}
          </div>
          <Link to="/devices" className="btn-view-all">
            <i
              className="fa-solid fa-list"
              style={{ marginRight: '5px', fontSize: '9px' }}
            ></i>
            View All Devices
          </Link>
        </div>

        <div className="notif-panel">
          <div className="section-head">
            <div className="section-title">Recent Alerts</div>
            <span className="section-meta">Last 24 hours</span>
          </div>

          <div className='notif-list'>
            {alerts.slice(0, 8).map((alert) => (
              <AlertItem
                key={alert.notification_id}
                type={alert.notification_type}
                msg={alert.description}
                time={alert.created_at}
              />
            ))}
          </div>

          <Link to="/notifications" className="btn-view-all">
            <i
              className="fa-solid fa-list"
              style={{ marginRight: '5px', fontSize: '9px' }}
            ></i>
            View All Notifications
          </Link>
        </div>
      </div>

      <section>
        <div className="section-head">
          <div className="section-title">Quick Actions</div>
          <span className="section-meta">Tap to toggle</span>
        </div>

        <div className="quick-actions-grid">
          <button className="qa-btn danger-qa" data-qa="all-lights-off">
            <div className="qa-icon-box">
              <i className="fa-solid fa-power-off"></i>
            </div>
            <span className="qa-label">All Lights Off</span>
            <span className="qa-state">INSTANT</span>
          </button>

          <button className="qa-btn" data-qa="lock-door">
            <div className="qa-icon-box"><i className="fa-solid fa-lock"></i></div>
            <span className="qa-label">Lock Front Door</span>
            <span className="qa-state">UNLOCKED</span>
          </button>

          <button className="qa-btn active-qa" data-qa="auto-mode">
            <div className="qa-icon-box"><i className="fa-solid fa-gears"></i></div>
            <span className="qa-label">Auto Mode</span>
            <span className="qa-state on">ON</span>
          </button>

          <button className="qa-btn" data-qa="night-mode">
            <div className="qa-icon-box"><i className="fa-solid fa-moon"></i></div>
            <span className="qa-label">Night Mode</span>
            <span className="qa-state">OFF</span>
          </button>

          <button className="qa-btn" data-qa="eco-mode">
            <div className="qa-icon-box"><i className="fa-solid fa-leaf"></i></div>
            <span className="qa-label">Eco Mode</span>
            <span className="qa-state">OFF</span>
          </button>
        </div>
      </section>
    </div>
  )
}