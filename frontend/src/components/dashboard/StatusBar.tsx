import './StatusBar.css'
import { useDevices } from '../../hooks/useDevices';
export default function StatusBar() {
  const devices = useDevices();
  return (
    <footer className="status-bar">
      <div className="status-seg">
        <i
          className="fa-solid fa-microchip"
          style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }}
        ></i>
        <span className="status-label">Devices</span>
        <span className="status-val" id="devices-online-bar">{devices.filter(d => d.status === 'online').length}/{devices.length} Online</span>
      </div>
      <div className="status-seg">
        <div className="status-pill">
          <div className="status-led"></div>
          <i className="fa-solid fa-wifi" style={{ fontSize: '9px' }}></i>
          Yolo:Bit Connected
        </div>
      </div>
      <div className="status-seg">
        <span className="status-label">Protocol</span>
        <span className="status-val">MQTT v3.1.1</span>
      </div>
      <div className="status-seg">
        <i
          className="fa-solid fa-signal"
          style={{ color: 'var(--success)', fontSize: '10px' }}
        ></i>
        <span className="status-label">Ping</span>
        <span className="status-val">12 ms</span>
      </div>
      <div className="status-seg">
        <i
          className="fa-regular fa-clock"
          style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '10px' }}
        ></i>
        <span className="status-update-time" id="last-update"
        >Updated just now</span>
      </div>
    </footer>
  );
}