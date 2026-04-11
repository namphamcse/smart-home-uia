import { sourceBg, sourceClass, sourceIcon } from "../../constants/historySource";
import type { Device, DeviceControlHistory } from "../../types/device";
import { formatAction, formatTime } from "../../utils/formatters";
import "./Devices.css";

export default function HistoryPanel({
  device,
  ctrlHistory,
}: {
  device: Device | null;
  ctrlHistory: DeviceControlHistory[];
}) {
  const deviceHistory = ctrlHistory.filter(
    (d) => d.device_id === device?.device_id,
  );
  return (
    <div className="history-panel">
      <div className="history-head">
        <div className="history-title">Control History</div>
        <div className="history-device-name" id="history-device-name">
          {device?.device_name}
        </div>
        <div className="history-device-sub" id="history-device-sub">
          {device?.location}
        </div>
      </div>

      <div className="history-list" id="history-list">
        {deviceHistory.length > 0 ? (
          deviceHistory.map((d, i) => (
            <div
              key={d.device_control_id}
              className="history-item"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <div
                className={`history-icon ${sourceClass[d.source]}`}
              >
                <i className={sourceIcon[d.source]}></i>
              </div>
              <div className="history-body">
                <div className="history-action">{formatAction(d)}</div>
                <div className="history-meta">
                  <span className="history-time">{formatTime(d.executed_at)}</span>
                  <span className={`history-source ${sourceBg[d.source]}`}>
                    {d.source}
                  </span>
                </div>
              </div>
              <span className="history-result result-ok"> OK </span>
            </div>
          ))
        ) : (
          <div className="history-empty">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <p>No history yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
