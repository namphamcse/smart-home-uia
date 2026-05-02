import type { RefObject } from "react";

interface LeftColProps {
  cameraActive: boolean;
  cameraBusy: boolean;
  cameraError: string | null;
  fullscreenActive: boolean;
  hudTimestamp: string;
  motionEnabled: boolean;
  motionFlash: boolean;
  onEnableCamera: () => void;
  onSnapshot: () => void;
  onToggleCamera: () => void;
  onToggleFullscreen: () => void;
  onToggleMotion: () => void;
  onToggleRecording: () => void;
  recordTimerLabel: string;
  recording: boolean;
  snapshotFlash: boolean;
  statusText: string;
  streamPanelRef: RefObject<HTMLDivElement | null>;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export default function LeftCol({
  cameraActive,
  cameraBusy,
  cameraError,
  fullscreenActive,
  hudTimestamp,
  motionEnabled,
  motionFlash,
  onEnableCamera,
  onSnapshot,
  onToggleCamera,
  onToggleFullscreen,
  onToggleMotion,
  onToggleRecording,
  recordTimerLabel,
  recording,
  snapshotFlash,
  statusText,
  streamPanelRef,
  videoRef,
  canvasRef,
}: LeftColProps) {
  return (
    <div className="left-col">
      <div className="stream-panel" ref={streamPanelRef}>
        <video id="cam-video" ref={videoRef} autoPlay muted playsInline></video>

        <canvas id="cam-canvas" ref={canvasRef}></canvas>

        {!cameraActive && (
          <div className="cam-placeholder">
            <i className="fa-solid fa-camera-slash"></i>
            <p>{cameraError ?? "Camera feed unavailable"}</p>
            <button className="btn-allow" onClick={onEnableCamera} disabled={cameraBusy}>
              <i className="fa-solid fa-video"></i>
              {cameraBusy ? "Starting..." : "Enable Camera"}
            </button>
          </div>
        )}

        <div className="cam-hud">
          <div className="cam-hud-top">
            <div className={`live-badge ${cameraActive ? "" : "offline"}`}>
              <div className="live-dot"></div>
              <span>{cameraActive ? "LIVE" : "OFFLINE"}</span>
            </div>

            <div className="hud-ts">{hudTimestamp}</div>
          </div>

          <div className="cam-hud-bot">
            <div className={`rec-badge ${recording ? "active" : ""}`}>
              <div className="rec-dot"></div>
              REC
            </div>

            <div className="hud-btn-group">
              <button
                className="hud-btn"
                onClick={onSnapshot}
                title="Snapshot"
                disabled={!cameraActive}
              >
                <i className="fa-solid fa-camera"></i>
              </button>

              <button
                className="hud-btn"
                onClick={onToggleFullscreen}
                title="Fullscreen"
              >
                <i
                  className={`fa-solid ${fullscreenActive ? "fa-compress" : "fa-expand"}`}
                ></i>
              </button>
            </div>
          </div>
        </div>

        <div className="scan-corner sc-tl"></div>
        <div className="scan-corner sc-tr"></div>
        <div className="scan-corner sc-bl"></div>
        <div className="scan-corner sc-br"></div>

        <div className={`motion-flash ${motionFlash ? "active" : ""}`}></div>
        <div className={`snapshot-flash ${snapshotFlash ? "snap" : ""}`}></div>
      </div>

      <div className="cam-ctrl-bar">
        <button className={`ctrl-btn ${cameraActive ? "active" : ""}`} onClick={onToggleCamera}>
          <i className={`fa-solid ${cameraActive ? "fa-video" : "fa-video-slash"}`}></i>
          <span>{cameraActive ? "Camera On" : cameraBusy ? "Starting..." : "Camera Off"}</span>
        </button>

        <button
          className={`ctrl-btn ${motionEnabled ? "active" : ""}`}
          onClick={onToggleMotion}
          disabled={!cameraActive}
        >
          <i className="fa-solid fa-person-running"></i>
          <span>{motionEnabled ? "Motion: ON" : "Motion Detect"}</span>
        </button>

        <button
          className={`ctrl-btn ${recording ? "record" : ""}`}
          onClick={onToggleRecording}
          disabled={!cameraActive}
        >
          <i
            className={`fa-solid fa-circle ${recording ? "rec-pulse" : ""}`}
            style={{
              fontSize: "9px",
              color: "var(--error)",
            }}
          ></i>
          <span>{recording ? "Stop Rec" : "Start Rec"}</span>
        </button>

        <div className="ctrl-spacer"></div>

        <div className={`ctrl-timer ${recording ? "active" : ""}`}>{recordTimerLabel}</div>

        <div className="ctrl-status-text">{statusText}</div>
      </div>
    </div>
  );
}
