import './notifications.css';
import type { Alert } from '../../types/alert';

type OverlayProps = {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
  deviceNames: Record<number, string>;
};

const typeLabels: Record<string, string> = {
  alert: 'Alert',
  intrusion: 'Intrusion',
  device: 'Device',
  system: 'System',
};

export default function Overlay({ alert, isOpen, onClose, deviceNames }: OverlayProps) {
  if (!alert) {
    return <div className="modal-overlay" />;
  }

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`}>
      <div className="modal">
        <div className="modal-head">
          <div className="modal-icon">
            <i className="fa-solid fa-bell"></i>
          </div>

          <div className="modal-title-col">
            <div className="modal-title">{alert.title || typeLabels[alert.notification_type]}</div>
            <span className="modal-badge">{typeLabels[alert.notification_type] ?? 'Notification'}</span>
          </div>

          <button className="modal-close" type="button" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-detail-grid">
            <div className="modal-detail-item">
              <div className="detail-label">Timestamp</div>
              <div className="detail-val">{new Date(alert.created_at).toLocaleString()}</div>
            </div>

            <div className="modal-detail-item">
              <div className="detail-label">Device</div>
              <div className="detail-val">{alert.device_id ? deviceNames[alert.device_id] ?? `Device ${alert.device_id}` : 'No linked device'}</div>
            </div>

            <div className="modal-detail-item">
              <div className="detail-label">Type</div>
              <div className="detail-val">{typeLabels[alert.notification_type] ?? alert.notification_type}</div>
            </div>

            <div className="modal-detail-item">
              <div className="detail-label">Severity</div>
              <div className="detail-val">{alert.severity}</div>
            </div>
          </div>

          <div className="modal-description">
            <div className="modal-desc-label">Full Description</div>
            <div className="modal-desc-text">{alert.description}</div>
          </div>
        </div>

        <div className="modal-footer">
          <a
            className="btn-nav-to"
            href={alert.device_id ? '/devices' : '#'}
            onClick={(event) => {
              if (!alert.device_id) event.preventDefault();
            }}
          >
            <i className="fa-solid fa-arrow-up-right-from-square"></i>
            <span>{alert.device_id ? 'Go to Device' : 'No device linked'}</span>
          </a>

          <button className="btn-modal-close" type="button" onClick={onClose}>
            Close
          </button>

          <div className="modal-read-status">
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i>
            Marked as read
          </div>
        </div>
      </div>
    </div>
  );
}

