import type { SecurityClip } from "../../types/security";

export type SecurityMotionTone = "watching" | "detecting" | "disabled";

export interface SecurityAlertView {
  id: number;
  message: string;
  resolved: boolean;
  sourceKind: "camera" | "ir";
  sourceLabel: string;
  timeLabel: string;
}

interface RightColProps {
  alerts: SecurityAlertView[];
  clips: SecurityClip[];
  lastEventLabel: string;
  loading: boolean;
  motionLabel: string;
  motionStatusLabel: string;
  motionSub: string;
  motionTone: SecurityMotionTone;
  onPlayClip: (clipId: string) => void;
  onResolveAlert: (alertId: number) => void;
  resolvingAlertId: number | null;
  triggerCount: number;
  unresolvedCount: number;
}

function getMotionIconClass(tone: SecurityMotionTone) {
  if (tone === "detecting") {
    return "fa-solid fa-person-running";
  }

  if (tone === "watching") {
    return "fa-solid fa-eye";
  }

  return "fa-solid fa-eye-slash";
}

export default function RightCol({
  alerts,
  clips,
  lastEventLabel,
  loading,
  motionLabel,
  motionStatusLabel,
  motionSub,
  motionTone,
  onPlayClip,
  onResolveAlert,
  resolvingAlertId,
  triggerCount,
  unresolvedCount,
}: RightColProps) {
  return (
    <div className="right-col">
      <div className="right-panel-wrap">
        <div className="motion-card">
          <div className="mc-row">
            <div className={`mc-icon ${motionTone}`}>
              <i className={getMotionIconClass(motionTone)}></i>
            </div>

            <div>
              <div className="mc-label">{motionLabel}</div>
              <div className="mc-sub">{motionSub}</div>
            </div>

            <div className={`mc-status ${motionTone}`}>{motionStatusLabel}</div>
          </div>

          <div className="mc-stats">
            <div className="mc-stat">
              <span className="mc-stat-label">Today's Triggers</span>
              <span className="mc-stat-val">{triggerCount}</span>
            </div>

            <div className="mc-stat">
              <span className="mc-stat-label">Last Event</span>
              <span className="mc-stat-val">{lastEventLabel}</span>
            </div>
          </div>
        </div>

        <div className="alert-panel">
          <div className="panel-head">
            <div className="panel-title panel-title-between">
              <span>Intrusion Alerts</span>

              <span
                className={`panel-badge ${unresolvedCount > 0 ? "panel-badge-danger" : "panel-badge-safe"}`}
              >
                {unresolvedCount > 0 ? `${unresolvedCount} NEW` : "ALL CLEAR"}
              </span>
            </div>
          </div>

          <div className="alert-list">
            {!loading && alerts.length === 0 && (
              <div className="security-empty-state">
                No security alerts yet. New intrusion events will show up here.
              </div>
            )}

            {alerts.map((alert, index) => (
              <div
                className={`alert-item ${alert.resolved ? "alert-item-resolved" : ""}`}
                key={alert.id}
                style={{ animationDelay: `${index * 0.04}s` }}
              >
                <div className={`alert-dot ${alert.resolved ? "handled" : "new"}`}></div>
                <div className="alert-body">
                  <div className="alert-msg">{alert.message}</div>
                  <div className="alert-meta">
                    <span className="alert-time">{alert.timeLabel}</span>
                    <span
                      className={`alert-source ${alert.sourceKind === "camera" ? "src-camera" : "src-ir"}`}
                    >
                      {alert.sourceLabel}
                    </span>
                  </div>
                </div>
                <button
                  className={`btn-resolve ${alert.resolved ? "resolved" : ""}`}
                  disabled={alert.resolved || resolvingAlertId === alert.id}
                  onClick={() => onResolveAlert(alert.id)}
                >
                  {alert.resolved
                    ? "Done"
                    : resolvingAlertId === alert.id
                      ? "Saving..."
                      : "Resolve"}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="video-panel">
          <div className="panel-head">
            <div className="panel-title">Recorded Clips</div>
          </div>

          <div className="video-list">
            {!loading && clips.length === 0 && (
              <div className="security-empty-state">
                Start a recording or wait for motion events to build the clip list.
              </div>
            )}

            {clips.map((clip, index) => (
              <div
                className={`video-item ${clip.source === "backend" ? "video-item-backend" : ""}`}
                key={clip.id}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="video-thumb">
                  <i className={`fa-solid ${clip.playable ? "fa-film" : "fa-wave-square"}`}></i>
                </div>

                <div className="video-meta">
                  <div className="video-name">{clip.name}</div>
                  <div className="video-info">
                    {new Date(clip.createdAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    | {clip.durationLabel} | {clip.sizeLabel}
                  </div>
                </div>

                <div className="video-actions">
                  <button
                    className="vid-btn play-btn"
                    disabled={!clip.playable}
                    onClick={() => onPlayClip(clip.id)}
                    title={clip.playable ? "Play" : "No playable file"}
                  >
                    <i className="fa-solid fa-play"></i>
                  </button>

                  {clip.playable && clip.url ? (
                    <a className="vid-btn" href={clip.url} download={clip.name} title="Download">
                      <i className="fa-solid fa-download"></i>
                    </a>
                  ) : (
                    <button className="vid-btn" disabled title="No downloadable file">
                      <i className="fa-solid fa-download"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
