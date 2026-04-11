import './DevicesManagement.css';
import { useEffect, useState } from 'react';
import type { Device } from '../../types/device';
export default function DevicesManagement({ devices, setOverlayType }: { devices: Device[]; setOverlayType: (overlayType: {type: string, device?: Device}) => void }) {
  const [displayedDevices, setDisplayedDevices] = useState<Device[]>(devices);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'light', 'fan', 'door', 'ac', 'camera', 'sensor'
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'online', 'offline', 'error'
  const icon = {
    light: 'fa-lightbulb',
    fan: 'fa-fan',
    sensor: 'fa-microchip',
    camera: 'fa-video',
    servo: 'fa-door-closed',
  } as const;


  useEffect(() => {
    if (filterType === 'all' && filterStatus === 'all' && searchTerm.trim() === '') {
      setDisplayedDevices(devices);
      return;
    }
    let filtered = devices;
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.device_type === filterType);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(d => d.status === filterStatus);
    }
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(d => d.device_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setDisplayedDevices(filtered);

  }, [filterType, filterStatus, searchTerm, devices]);
  return (
    <div className="tab-panel active" id="tab-devices">
      <div className="toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="search-input"
            id="dev-search"
            placeholder="Search devices…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tb-sep"></div>

        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--muted)'
          }}
        >Type:</span>
        <button onClick={() => setFilterType('all')} className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} data-dtype="all">All</button>
        <button onClick={() => setFilterType('light')} className={`filter-btn ${filterType === 'light' ? 'active' : ''}`} data-dtype="light">
          <i className="fa-solid fa-lightbulb"></i> Light
        </button>
        <button onClick={() => setFilterType('fan')} className={`filter-btn ${filterType === 'fan' ? 'active' : ''}`} data-dtype="fan">
          <i className="fa-solid fa-fan"></i> Fan
        </button>
        <button onClick={() => setFilterType('servo')} className={`filter-btn ${filterType === 'servo' ? 'active' : ''}`} data-dtype="servo">
          <i className="fa-solid fa-door-closed"></i> Servo
        </button>
        <button onClick={() => setFilterType('camera')} className={`filter-btn ${filterType === 'camera' ? 'active' : ''}`} data-dtype="camera">
          <i className="fa-solid fa-video"></i> Camera
        </button>
        <button onClick={() => setFilterType('sensor')} className={`filter-btn ${filterType === 'sensor' ? 'active' : ''}`} data-dtype="sensor">
          <i className="fa-solid fa-microchip"></i> Sensor
        </button>

        <div className="tb-sep"></div>

        <button
          onClick={() => { filterStatus === 'online' ? setFilterStatus('all') : setFilterStatus('online') }}
          className={`filter-btn f-online ${filterStatus === 'online' ? 'active' : ''}`}
          data-dstatus="online">
          <i
            className="fa-solid fa-circle"
            style={{
              fontSize: '7px',
              color: 'var(--success)'
            }}
          ></i>
          Online
        </button>
        <button
          onClick={() => { filterStatus === 'offline' ? setFilterStatus('all') : setFilterStatus('offline') }}
          className={`filter-btn f-offline ${filterStatus === 'offline' ? 'active' : ''}`}
          data-dstatus="offline">
          <i
            className="fa-solid fa-circle"
            style={{
              fontSize: '7px',
              color: 'var(--muted)'
            }}
          ></i>
          Offline
        </button>
        <button
          onClick={() => { filterStatus === 'error' ? setFilterStatus('all') : setFilterStatus('error') }}
          className={`filter-btn f-error ${filterStatus === 'error' ? 'active' : ''}`}
          data-dstatus="error">
          <i
            className="fa-solid fa-circle"
            style={{
              fontSize: '7px',
              color: 'var(--error)'
            }}
          ></i>
          Error
        </button>

        <div className="tb-spacer"></div>

        <button onClick={() => setOverlayType({ type: 'add' })} className="btn-primary" id="btn-add-device">
          <i className="fa-solid fa-plus"></i> Add Device
        </button>
      </div>

      <div className="table-wrap">
        <table id="device-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Device Name</th>
              <th>Type</th>
              <th>Pin Number</th>
              <th>Location</th>
              <th>Connection</th>
              <th>State</th>
              <th>Last Seen</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody id="device-tbody">
            {displayedDevices.map((d, index) => (
              <tr key={d.device_id}>
                <td style={{ fontFamily: 'var(--font-head)', fontSize: '10px', fontWeight: 700, color: 'var(--muted)' }}>{index + 1}</td>
                <td>
                  <div className={`td-name type-${d.device_type}`}>
                    <div className="device-icon-sm">
                      <i className={`fa-solid ${icon[d.device_type as keyof typeof icon] ?? 'fa-cubes'}`}></i>
                    </div>
                    {d.device_name}
                  </div>
                </td>
                <td><span className={`td-badge badge-${d.device_type}`}>{d.device_type.toUpperCase()}</span></td>
                <td><span className="gpio-code">{d.pin_number}</span></td>
                <td style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>{d.location}</td>
                <td><div className={`conn-dot ${d.status.toLowerCase()}`}></div><span className={`td-badge badge-${d.status.toLowerCase()}`}>{d.status}</span></td>
                <td><span className={`td-badge badge-${d.is_active ? 'on' : 'off'}`}>{d.is_active ? 'ON' : 'OFF'}</span></td>
                <td style={{ fontSize: '10px', color: 'var(--muted)' }}>Just now</td>
                <td>
                  <div className="tbl-actions" style={{ justifyContent: 'center' }}>
                    <button onClick={() => setOverlayType({ type: 'edit', device: d })} className="tbl-btn edit-dev" data-id="1" title="Edit"><i className="fa-solid fa-pen"></i></button>
                    <button onClick={() => setOverlayType({ type: 'restart', device: d})} className="tbl-btn restart" data-id="1" title="Restart"><i className="fa-solid fa-rotate"></i></button>
                    <button onClick={() => setOverlayType({ type: 'delete', device: d })} className="tbl-btn del" data-id="1" title="Delete"><i className="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>

            ))}

          </tbody>
        </table>
      </div>
    </div>
  )
}