import './notifications.css';

type NotificationType = 'all' | 'alert' | 'intrusion' | 'device' | 'system';
type ReadFilter = 'all' | 'read' | 'unread';

interface FilterCounts {
  all: number;
  alert: number;
  intrusion: number;
  device: number;
  system: number;
}

interface NotiFilterBarProps {
  activeType: NotificationType;
  activeRead: ReadFilter;
  counts: FilterCounts;
  onTypeChange: (type: NotificationType) => void;
  onReadChange: (read: ReadFilter) => void;
}

export default function NotiFilterBar({ activeType, activeRead, counts, onTypeChange, onReadChange }: NotiFilterBarProps) {
  return (
    <div className="filter-bar">
      <span className="filter-label">Type:</span>
      <button
        type="button"
        className={`filter-btn ${activeType === 'all' ? 'active' : ''}`}
        onClick={() => onTypeChange('all')}
      >
        <i className="fa-solid fa-border-all"></i> All
        <span className="filter-count">{counts.all}</span>
      </button>
      <button
        type="button"
        className={`filter-btn type-alert ${activeType === 'alert' ? 'active' : ''}`}
        onClick={() => onTypeChange('alert')}
      >
        <i className="fa-solid fa-triangle-exclamation"></i> Alert
        <span className="filter-count">{counts.alert}</span>
      </button>
      <button
        type="button"
        className={`filter-btn type-intrusion ${activeType === 'intrusion' ? 'active' : ''}`}
        onClick={() => onTypeChange('intrusion')}
      >
        <i className="fa-solid fa-user-secret"></i> Intrusion
        <span className="filter-count">{counts.intrusion}</span>
      </button>
      <button
        type="button"
        className={`filter-btn type-device ${activeType === 'device' ? 'active' : ''}`}
        onClick={() => onTypeChange('device')}
      >
        <i className="fa-solid fa-sliders"></i> Device
        <span className="filter-count">{counts.device}</span>
      </button>
      <button
        type="button"
        className={`filter-btn type-system ${activeType === 'system' ? 'active' : ''}`}
        onClick={() => onTypeChange('system')}
      >
        <i className="fa-solid fa-gear"></i> System
        <span className="filter-count">{counts.system}</span>
      </button>

      <div className="filter-sep"></div>

      <div className="read-tabs">
        <button
          type="button"
          className={`read-tab ${activeRead === 'all' ? 'active' : ''}`}
          onClick={() => onReadChange('all')}
        >
          All
        </button>
        <button
          type="button"
          className={`read-tab ${activeRead === 'unread' ? 'active' : ''}`}
          onClick={() => onReadChange('unread')}
        >
          Unread
        </button>
        <button
          type="button"
          className={`read-tab ${activeRead === 'read' ? 'active' : ''}`}
          onClick={() => onReadChange('read')}
        >
          Read
        </button>
      </div>

      <div className="filter-spacer"></div>
    </div>
  );
}

