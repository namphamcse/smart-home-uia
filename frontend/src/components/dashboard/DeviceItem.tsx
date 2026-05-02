import './DeviceItem.css'
import { useEffect, useState } from 'react';
import { useNoti } from '../../services/NotiProvider';
import type { Device } from '../../types/device';
const API_URL = import.meta.env.VITE_API_URL;

export default function DeviceItem({ device }: { device: Device }) {
  const { setNotification } = useNoti();
  const [isDeviceOn, setIsDeviceOn] = useState(device.is_active);

  useEffect(() => {
    setIsDeviceOn(device.is_active);
  }, [device.is_active]);

  const icon = {
    'light': 'fa-lightbulb',
    'fan': 'fa-fan',
    'ac': 'fa-snowflake',
    'door': 'fa-door-closed',
    'camera': 'fa-video',
    'sensor': 'fa-microchip',
    'servo': 'fa-door-closed',
    'other': 'fa-cubes',
  }[device.device_type];
  const onToggle = async () => {
    try {
      const response = await fetch(`${API_URL}/devices/${device.device_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...device, is_active: !isDeviceOn }),
      });
      if (!response.ok) {
        throw new Error('Failed to update device status');
      }
    } catch (error) {
      console.error('Error toggling device:', error);
      setNotification('Failed to toggle device');
    }
    setIsDeviceOn((prev) => !prev);
    setNotification('Device toggled successfully');
    return;
  }
  return (
    <div className={`device-item ${isDeviceOn ? 'on' : ''}`}>
      <div className="device-icon-box">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <div className="device-info">
        <div className="device-name">
          {device.device_name}
          <span className={`device-badge ${isDeviceOn ? 'on-badge' : 'off-badge'}`}>
            {isDeviceOn ? 'On' : 'Off'}
          </span>
        </div>
        <div className="device-sub">{device.location}</div>
      </div>
      <label className="toggle">
        <input
          type="checkbox"
          checked={isDeviceOn}
          onChange={onToggle}
          className="device-toggle"
        />
        <div className="toggle-track"></div>
        <div className="toggle-thumb"></div>
      </label>
    </div>
  );
};