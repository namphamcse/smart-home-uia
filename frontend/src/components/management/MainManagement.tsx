import { useEffect, useState } from 'react';
import { useDevices } from '../../hooks/useDevices'
import './MainManagement.css'
import SummaryRow from './SummaryRow'
import DevicesManagement from './DevicesManagement';
import LogManagement from './LogManagement';
import ModalOverlay from './ModalOverlay';
import type { Device } from '../../types/device';
export default function MainManagement() {
  const devices = useDevices();
  const [managedDevices, setManagedDevices] = useState<Device[]>([]);
  const [activeTab, setActiveTab] = useState<string>('devices');
  const [overlayType, setOverlayType] = useState<{type: string, device?: Device}>({type: '', device: {} as Device});

  useEffect(() => {
    setManagedDevices(devices);
  }, [devices]);

  const handleDeviceDeleted = (deviceId: number) => {
    setManagedDevices(prev => prev.filter(device => device.device_id !== deviceId));
  };

  return (
    <div className="page-shell">

      <SummaryRow devices={managedDevices} />

      <div className="tab-nav">
        <button onClick={() => setActiveTab('devices')} className={activeTab === 'devices' ? 'tab-btn active' : 'tab-btn'} data-tab="devices">
          <i className="fa-solid fa-sliders"></i>
          Devices
          <span className="tab-badge" id="tab-badge-devices">{managedDevices.length}</span>
        </button>
        <button onClick={() => setActiveTab('syslog')} className={activeTab === 'syslog' ? 'tab-btn active' : 'tab-btn'} data-tab="syslog">
          <i className="fa-solid fa-terminal"></i>
          System Log
          <span className="tab-badge" id="tab-badge-log">0</span>
        </button>
      </div>

      <div className="tab-content">

        {activeTab === 'devices' && <DevicesManagement devices={managedDevices} setOverlayType={setOverlayType} />}
        {activeTab === 'syslog' && <LogManagement />}

      </div>
      <ModalOverlay overlayType={overlayType} setOverlayType={setOverlayType} onDeviceDeleted={handleDeviceDeleted} />
    </div>
  )
}