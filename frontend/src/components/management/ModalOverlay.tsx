import type { Device, DeviceCreate, DeviceUpdate, DeviceType } from '../../types/device';
import { useNoti } from '../../services/NotiProvider';
import { managementAPI } from '../../services/managementAPI';
import type { SubmitEventHandler } from 'react';

export default function ModalOverlay({ overlayType, setOverlayType, onDeviceDeleted }:
  {
    overlayType: { type: string, device?: Device },
    setOverlayType: (type: { type: string, device?: Device }) => void,
    onDeviceDeleted?: (deviceId: number) => void
  }) {
  const { setNotification } = useNoti();

  const closeOverlay = () => {
    setOverlayType({ type: '', device: {} as Device });
  };

  const restartDevice = async () => {
    try {
      setNotification(`Restart command sent for ${overlayType.device?.device_name || 'device'}.`);
      closeOverlay();
    } catch (error) {
      console.error('Error restarting device:', error);
      setNotification('Failed to restart device. Please try again.');
    }
  };

  const addDevice: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.currentTarget);
      const pinNumberStr = String(form.get('pin_number') || '').trim();
      const pinNumber = parseInt(pinNumberStr);

      const payload: DeviceCreate = {
        device_name: String(form.get('device_name') || '').trim(),
        device_type: (form.get('device_type') || 'light') as DeviceType,
        pin_number: pinNumber,
        location: String(form.get('location') || '').trim(),
        status: String(form.get('status') || 'online'),
        is_active: String(form.get('is_active') || 'off') === 'on',
      };

      if (!payload.device_name || !pinNumberStr || isNaN(pinNumber) || !payload.location) {
        setNotification('Please fill all required fields.');
        return;
      }

      const newDevice = await managementAPI.create(payload);
      if (!newDevice) throw new Error('Failed to add device');
      setNotification('Device added successfully.');
      closeOverlay();
    } catch (error) {
      console.error('Error adding device:', error);
      setNotification('Failed to add device. Please try again.');
    }
  };

  const editDevice: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData(e.currentTarget);
      const pinNumberStr = String(form.get('pin_number') || '').trim();
      const pinNumber = parseInt(pinNumberStr);

      const payload: DeviceUpdate = {
        device_name: String(form.get('device_name') || '').trim(),
        device_type: (form.get('device_type') || 'light') as DeviceType,
        pin_number: pinNumber,
        device_mode: overlayType.device?.device_mode as DeviceType|| 'auto',
        location: String(form.get('location') || '').trim(),
        status: String(form.get('status') || 'online'),
        is_active: String(form.get('is_active') || 'off') === 'on',
      };
      console.log('Edit device payload:', payload);
      if (!payload.device_name || !pinNumberStr || isNaN(pinNumber) || !payload.location) {
        setNotification('Please fill all required fields.');
        return;
      }

      const updatedDevice = await managementAPI.update(overlayType.device?.device_id!, payload);
      console.log('Edit device response:', overlayType.device?.device_id);
      if (!updatedDevice) throw new Error('Failed to update device');
      setNotification('Device updated successfully.');
      closeOverlay();
    } catch (error) {
      console.error('Error updating device:', error);
      setNotification('Failed to update device. Please try again.');
    }
  };

  const deleteDevice = async () => {
    try {
      const deviceId = overlayType.device?.device_id;
      if (!deviceId) {
        setNotification('Device not found.');
        return;
      }

      const success = await managementAPI.delete(deviceId);
      if (success) {
        setNotification('Device deleted successfully.');
        onDeviceDeleted?.(deviceId);
        closeOverlay();
        return;
      }

      setNotification('Failed to delete device. Please try again.');
    } catch (error) {
      console.error('Error deleting device:', error);
      setNotification('Failed to delete device. Please try again.');
    }
  }

  const device = overlayType.device;

  return (
    <>
      {/* Restart Confirmation Overlay */}
      <div className={`confirm-overlay ${overlayType.type === 'restart' ? 'open' : ''}`} id="restart-overlay" onClick={closeOverlay}>
        <div className="confirm-box" onClick={e => e.stopPropagation()}>
          <div className="confirm-icon">
            <i className="fa-solid fa-rotate" style={{ color: 'var(--warning)' }}></i>
          </div>
          <div className="confirm-title">Restart Device?</div>
          <div className="confirm-sub" id="restart-sub">
            This will restart the selected device.
          </div>
          <div className="confirm-warning">
            <i className="fa-solid fa-triangle-exclamation"></i>
            The device will temporarily disconnect from the MQTT broker and may
            take up to 15 seconds to reconnect. Any active automation rules will
            be paused during restart.
          </div>
          <div className="confirm-btns">
            <button className="btn-confirm-ok restart-ok" id="btn-confirm-restart" onClick={restartDevice}>
              <i className="fa-solid fa-rotate"></i> Restart
            </button>
            <button onClick={closeOverlay} className="btn-confirm-cancel" id="btn-cancel-restart">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      <div className={`confirm-overlay ${overlayType.type === 'delete' ? 'open' : ''}`} id="delete-overlay" onClick={closeOverlay}>
        <div className="confirm-box" onClick={e => e.stopPropagation()}>
          <div className="confirm-icon">
            <i className="fa-solid fa-trash" style={{ color: 'var(--error)' }}></i>
          </div>
          <div className="confirm-title">Delete Device?</div>
          <div className="confirm-sub" id="delete-sub">
            This will permanently remove the device.
          </div>
          <div className="confirm-warning">
            <i className="fa-solid fa-triangle-exclamation"></i>
            All automation rules linked to this device will also be disabled. This
            action cannot be undone.
          </div>
          <div className="confirm-btns">
            <button className="btn-confirm-ok delete-ok" onClick={deleteDevice} id="btn-confirm-delete">
              <i className="fa-solid fa-trash"></i> Delete
            </button>
            <button onClick={closeOverlay} className="btn-confirm-cancel" id="btn-cancel-delete">
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Add Device Modal */}
      <div className={`modal-overlay ${overlayType.type === 'add' ? 'open' : ''}`} id="device-modal-overlay" onClick={closeOverlay}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <form onSubmit={addDevice}>
            <div className="modal-head">
              <div className="modal-head-icon">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div className="modal-title" id="device-modal-title">Add New Device</div>
              <button onClick={closeOverlay} className="modal-close" id="device-modal-close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Device Name</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-name"
                    name="device_name"
                    placeholder="e.g. Kitchen Light"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Device Type</label>
                  <select className="form-select" id="f-dev-type" name="device_type">
                    <option value="light">Light</option>
                    <option value="fan">Fan</option>
                    <option value="servo">Servo</option>
                    <option value="camera">Camera</option>
                    <option value="sensor">Sensor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Pin Number</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-gpio"
                    name="pin_number"
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-location"
                    name="location"
                    placeholder="e.g. Kitchen"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Connection Status</label>
                  <select className="form-select" id="f-dev-conn" name="status">
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Initial State</label>
                  <select className="form-select" id="f-dev-state" name="is_active">
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn-save" id="btn-save-device">
                <i className="fa-solid fa-floppy-disk"></i> Save Device
              </button>
              <button type="button" onClick={closeOverlay} className="btn-cancel" id="btn-cancel-device">Cancel</button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit Device Modal */}
      <div className={`modal-overlay ${overlayType.type === 'edit' ? 'open' : ''}`} id="device-modal-overlay" onClick={closeOverlay}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <form onSubmit={editDevice}>
            <div className="modal-head">
              <div className="modal-head-icon">
                <i className="fa-solid fa-microchip"></i>
              </div>
              <div className="modal-title" id="device-modal-title">Edit Device</div>
              <button onClick={closeOverlay} className="modal-close" id="device-modal-close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Device Name</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-name"
                    name="device_name"
                    placeholder="e.g. Kitchen Light"
                    defaultValue={device?.device_name || ''}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Device Type</label>
                  {
                    device?.device_type && (
                      <select className="form-select" id="f-dev-type" name="device_type" defaultValue={device?.device_type || 'light'}>
                        <option value="light">Light</option>
                        <option value="fan">Fan</option>
                        <option value="servo">Servo</option>
                        <option value="camera">Camera</option>
                        <option value="sensor">Sensor</option>
                        <option value="other">Other</option>
                      </select>
                    )
                  }
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Pin Number</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-gpio"
                    name="pin_number"
                    placeholder="e.g. GPIO18"
                    defaultValue={device?.pin_number || ''}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    id="f-dev-location"
                    name="location"
                    placeholder="e.g. Kitchen"
                    defaultValue={device?.location || ''}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Connection Status</label>
                  <select className="form-select" id="f-dev-conn" name="status" defaultValue={device?.status || 'online'}>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="error">Error</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="form-label">Initial State</label>
                  <select className="form-select" id="f-dev-state" name="is_active" defaultValue={device?.is_active ? 'on' : 'off'}>
                    <option value="on">ON</option>
                    <option value="off">OFF</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn-save" id="btn-save-device">
                <i className="fa-solid fa-floppy-disk"></i> Update Device
              </button>
              <button type="button" onClick={closeOverlay} className="btn-cancel" id="btn-cancel-device">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}