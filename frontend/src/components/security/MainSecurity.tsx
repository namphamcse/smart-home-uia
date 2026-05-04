import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { Alert } from "../../types/alert";
import type { Device } from "../../types/device";
import type {
  SecurityClip,
  SecurityOverview,
  Sensor,
  SensorLog,
} from "../../types/security";
import { securityAPI } from "../../services/securityAPI";
import "./security.css";
import LeftCol from "./LeftCol";
import RightCol, {
  type SecurityAlertView,
  type SecurityMotionTone,
} from "./RightCol";
import SensorStatusBar from "./SensorStatusBar";

const EMPTY_OVERVIEW: SecurityOverview = {
  alerts: [],
  devices: [],
  sensorLogs: [],
  sensors: [],
};

type ToastTone = "success" | "error" | "info" | "warning";

function formatHudTimestamp(date: Date) {
  return date.toLocaleString([], {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatShortTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatClipFileStamp(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    "_",
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
}

function isSameCalendarDay(value: string, today: Date) {
  const date = new Date(value);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function getMotionEventLogs(logs: SensorLog[], motionSensor: Sensor | null) {
  if (!motionSensor) {
    return [];
  }

  return logs
    .filter(
      (log) =>
        log.sensor_id === motionSensor.sensor_id && log.is_valid && log.value > 0,
    )
    .sort(
      (a, b) =>
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime(),
    );
}

function updateDevicesLocally(
  current: SecurityOverview,
  deviceId: number,
  updater: (device: Device) => Device,
) {
  return {
    ...current,
    devices: current.devices.map((device) =>
      device.device_id === deviceId ? updater(device) : device,
    ),
  };
}

function useLatestRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export default function MainSecurity() {
  const streamPanelRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recorderMimeTypeRef = useRef("video/webm");
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const motionFrameRef = useRef<number | null>(null);
  const motionResetRef = useRef<number | null>(null);
  const lastMotionCheckRef = useRef(0);
  const lastBackendMotionAlertRef = useRef(0);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const localClipUrlsRef = useRef<string[]>([]);
  const recordSecondsRef = useRef(0);
  const stoppedRecordingSecondsRef = useRef(0);
  const toastTimerRef = useRef<number | null>(null);
  const cameraWsRef = useRef<WebSocket | null>(null);
  const frameIntervalRef = useRef<number | null>(null);

  const [overview, setOverview] = useState<SecurityOverview>(EMPTY_OVERVIEW);
  const [now, setNow] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [snapshotFlash, setSnapshotFlash] = useState(false);
  const [motionFlash, setMotionFlash] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [localClips, setLocalClips] = useState<SecurityClip[]>([]);
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null);
  const [storageLabel, setStorageLabel] = useState("Checking...");
  const [toast, setToast] = useState<{
    message: string;
    tone: ToastTone;
    visible: boolean;
  }>({
    message: "",
    tone: "info",
    visible: false,
  });

  const cameraDevice = useMemo(
    () =>
      overview.devices
        .filter((device) => device.device_type === "camera")
        .sort((a, b) => Number(b.is_active) - Number(a.is_active))[0] ?? null,
    [overview.devices],
  );

  const motionSensor = useMemo(
    () => overview.sensors.find((sensor) => sensor.sensor_type === "motion") ?? null,
    [overview.sensors],
  );

  const motionLogs = useMemo(
    () => getMotionEventLogs(overview.sensorLogs, motionSensor),
    [motionSensor, overview.sensorLogs],
  );

  const securityAlerts = useMemo<Alert[]>(() => [], []);

  const unresolvedCount = useMemo(
    () => securityAlerts.filter((alert) => !alert.is_read).length,
    [securityAlerts],
  );

  const todayTriggerCount = useMemo(
    () => motionLogs.filter((log) => isSameCalendarDay(log.recorded_at, now)).length,
    [motionLogs, now],
  );

  const lastMotionEvent = motionLogs[0] ?? null;
  const lastMotionLabel = lastMotionEvent
    ? formatShortTime(lastMotionEvent.recorded_at)
    : "--:--";
  const lastMotionSub = lastMotionEvent
    ? `Last triggered: ${formatShortDateTime(lastMotionEvent.recorded_at)}`
    : "Waiting for the next motion event";

  const motionTone: SecurityMotionTone = !motionSensor
    ? "disabled"
    : motionDetected
      ? "detecting"
      : motionEnabled
        ? "watching"
        : "disabled";

  const motionCardLabel = !motionSensor
    ? "IR Sensor: Offline"
    : motionDetected
      ? "IR Sensor: Motion!"
      : motionEnabled
        ? "IR Sensor: Watching"
        : "IR Sensor: Standby";

  const motionCardStatusLabel = !motionSensor
    ? "Offline"
    : motionDetected
      ? "Detecting"
      : motionEnabled
        ? "Watching"
        : "Standby";

  const alertViews = useMemo<SecurityAlertView[]>(() => [], []);

  const backendClips = useMemo<SecurityClip[]>(
    () =>
      motionLogs.slice(0, 6).map((log) => ({
        id: `log-${log.sensor_log_id}`,
        createdAt: log.recorded_at,
        durationLabel: "Motion event",
        name: `motion_event_${formatClipFileStamp(log.recorded_at)}.webm`,
        playable: false,
        sizeLabel: "No file",
        source: "backend",
      })),
    [motionLogs],
  );

  const clipList = useMemo(
    () =>
      [...localClips, ...backendClips]
        .sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10),
    [backendClips, localClips],
  );

  const cameraStatusText = recording
    ? "Recording clip"
    : motionDetected
      ? "Motion detected"
      : cameraActive
        ? "Camera active"
        : loading
          ? "Syncing sensors"
          : "Standby";

  const mqttTone = syncError ? "warning" : "online";
  const mqttValue = syncError ? "Sync delayed" : "Connected";
  const lastUpdatedLabel = lastSyncedAt
    ? (() => {
        const seconds = Math.max(
          0,
          Math.floor((now.getTime() - lastSyncedAt) / 1000),
        );

        if (seconds < 5) {
          return "Updated just now";
        }

        if (seconds < 60) {
          return `Updated ${seconds}s ago`;
        }

        return `Updated ${Math.floor(seconds / 60)}m ago`;
      })()
    : "Waiting for sync";

  const showToast = useEffectEvent((message: string, tone: ToastTone) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast({
      message,
      tone,
      visible: true,
    });

    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => ({ ...current, visible: false }));
    }, 2800);
  });

  const resizeCanvas = useEffectEvent(() => {
    const canvas = canvasRef.current;
    const panel = streamPanelRef.current;

    if (!canvas || !panel) {
      return;
    }

    canvas.width = panel.clientWidth;
    canvas.height = panel.clientHeight;
  });

  const stopCameraStream = useEffectEvent(() => {
    if (frameIntervalRef.current) {
      window.clearInterval(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
    cameraWsRef.current?.close();
    cameraWsRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }

    setCameraActive(false);
    setCameraBusy(false);
  });

  const stopRecordingInternal = useEffectEvent(() => {
    stoppedRecordingSecondsRef.current = recordSecondsRef.current;

    if (recordingTimerRef.current) {
      window.clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
    setRecordSeconds(0);
    recordSecondsRef.current = 0;
  });

  const disableMotion = useEffectEvent(() => {
    if (motionFrameRef.current) {
      window.cancelAnimationFrame(motionFrameRef.current);
      motionFrameRef.current = null;
    }

    if (motionResetRef.current) {
      window.clearTimeout(motionResetRef.current);
      motionResetRef.current = null;
    }

    previousFrameRef.current = null;
    lastMotionCheckRef.current = 0;
    setMotionEnabled(false);
    setMotionDetected(false);

    const context = canvasRef.current?.getContext("2d");
    if (context && canvasRef.current) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  });

  const refreshOverview = useEffectEvent(async (withSpinner = false) => {
    if (withSpinner) {
      setLoading(true);
    }

    const data = await securityAPI.getOverview();

    setOverview(data);
    setLastSyncedAt(Date.now());
    setSyncError(null);
    setLoading(false);
  });

  const latestCameraDevice = useLatestRef(cameraDevice);
  const latestMotionSensor = useLatestRef(motionSensor);
  const latestOverview = useLatestRef(overview);

  const syncCameraDeviceState = useEffectEvent(async (isActive: boolean) => {
    const device = latestCameraDevice.current;
    if (!device) {
      return;
    }

    const updated = await securityAPI.updateDevice(device.device_id, {
      is_active: isActive,
      status: isActive ? "online" : "offline",
    });

    if (!updated) {
      showToast("Camera state changed locally, but backend sync failed", "warning");
      return;
    }

    setOverview((current) =>
      updateDevicesLocally(current, device.device_id, () => updated),
    );
  });

  const createMotionAlert = useEffectEvent(async () => {
    const nowMs = Date.now();

    if (nowMs - lastBackendMotionAlertRef.current < 15000) {
      return;
    }

    lastBackendMotionAlertRef.current = nowMs;

    const deviceId =
      latestCameraDevice.current?.device_id ??
      latestMotionSensor.current?.device_id ??
      null;
    const location =
      latestCameraDevice.current?.location ??
      latestOverview.current.devices.find(
        (device) => device.device_id === latestMotionSensor.current?.device_id,
      )?.location ??
      "security zone";

    const created = await securityAPI.createAlert({
      device_id: deviceId,
      title: "Motion detected",
      description: `Motion detected near ${location}`,
      notification_type: "intrusion",
      severity: "high",
      is_read: false,
    });

    if (created) {
      setOverview((current) => ({
        ...current,
        alerts: [created, ...current.alerts],
      }));
    }
  });

  const clearMotionVisuals = useEffectEvent(() => {
    setMotionDetected(false);
  });

  const triggerMotion = useEffectEvent(async () => {
    setMotionDetected(true);
    setMotionFlash(true);
    window.setTimeout(() => setMotionFlash(false), 400);

    if (motionResetRef.current) {
      window.clearTimeout(motionResetRef.current);
    }

    motionResetRef.current = window.setTimeout(() => {
      clearMotionVisuals();
    }, 3000);

    await createMotionAlert();

    if (!recording) {
      const started = await startRecording(true);
      if (started) {
        showToast("Motion detected and recording started", "error");
      }
    } else {
      showToast("Motion detected", "error");
    }
  });

  const renderMotionOverlay = useEffectEvent((score: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);

    if (score < 5) {
      return;
    }

    const width = Math.min((score / 60) * 120, 120);
    const alpha = Math.min(score / 60, 1);

    context.fillStyle = `rgba(239, 68, 68, ${alpha * 0.9})`;
    context.fillRect(12, canvas.height - 28, width, 6);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 1;
    context.strokeRect(12, canvas.height - 28, 120, 6);
    context.fillStyle = "rgba(255,255,255,.7)";
    context.font = "700 10px Space Grotesk";
    context.fillText("MOTION", 14, canvas.height - 34);
  });

  const motionLoop = useEffectEvent(async (timestamp: number) => {
    if (!motionEnabled || !cameraActive) {
      return;
    }

    const video = videoRef.current;

    if (!video || video.readyState < 2) {
      motionFrameRef.current = window.requestAnimationFrame(motionLoop);
      return;
    }

    if (timestamp - lastMotionCheckRef.current < 100) {
      motionFrameRef.current = window.requestAnimationFrame(motionLoop);
      return;
    }

    lastMotionCheckRef.current = timestamp;

    const analysisCanvas = document.createElement("canvas");
    analysisCanvas.width = 160;
    analysisCanvas.height = 90;
    const analysisContext = analysisCanvas.getContext("2d");

    if (!analysisContext) {
      motionFrameRef.current = window.requestAnimationFrame(motionLoop);
      return;
    }

    analysisContext.drawImage(video, 0, 0, 160, 90);
    const currentFrame = analysisContext.getImageData(0, 0, 160, 90);

    if (previousFrameRef.current) {
      let diff = 0;
      for (let index = 0; index < currentFrame.data.length; index += 4) {
        diff +=
          Math.abs(currentFrame.data[index] - previousFrameRef.current[index]) +
          Math.abs(
            currentFrame.data[index + 1] - previousFrameRef.current[index + 1],
          ) +
          Math.abs(
            currentFrame.data[index + 2] - previousFrameRef.current[index + 2],
          );
      }

      const score = diff / (160 * 90 * 3);
      renderMotionOverlay(score);

      if (score > 18 && !motionDetected) {
        await triggerMotion();
      }
    }

    previousFrameRef.current = currentFrame.data.slice();
    motionFrameRef.current = window.requestAnimationFrame(motionLoop);
  });

  async function startRecording(silent = false) {
    if (recording || !streamRef.current) {
      return false;
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";

      recorderMimeTypeRef.current = mimeType;
      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(streamRef.current, { mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorderMimeTypeRef.current,
        });

        if (!blob.size) {
          return;
        }

        const createdAt = new Date().toISOString();
        const clipUrl = URL.createObjectURL(blob);
        localClipUrlsRef.current.push(clipUrl);

        setLocalClips((current) => [
          {
            id: `local-${Date.now()}`,
            createdAt,
            durationLabel: formatDuration(stoppedRecordingSecondsRef.current),
            name: `clip_${formatClipFileStamp(createdAt)}.webm`,
            playable: true,
            sizeLabel: formatBytes(blob.size),
            source: "local",
            url: clipUrl,
          },
          ...current,
        ]);

        showToast(
          `Recording saved (${formatDuration(stoppedRecordingSecondsRef.current)})`,
          "success",
        );
      };

      recorder.start(200);
      setRecording(true);
      setRecordSeconds(0);
      recordSecondsRef.current = 0;
      stoppedRecordingSecondsRef.current = 0;

      recordingTimerRef.current = window.setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(recordSecondsRef.current);
      }, 1000);

      if (!silent) {
        showToast("Recording started", "success");
      }

      return true;
    } catch (error) {
      console.error("Recording error:", error);
      showToast("Recording is not supported in this browser", "error");
      return false;
    }
  }

  const startCamera = useEffectEvent(async () => {
    if (cameraActive || cameraBusy) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not available in this browser");
      showToast("Camera access is not available in this browser", "error");
      return;
    }

    setCameraBusy(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraBusy(false);
      resizeCanvas();

      const ws = new WebSocket(`${import.meta.env.VITE_WS_URL}/camera`);
      cameraWsRef.current = ws;

      frameIntervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        if (!video || ws.readyState !== WebSocket.OPEN) return;

        const capture = document.createElement("canvas");
        capture.width = video.videoWidth || 640;
        capture.height = video.videoHeight || 480;
        const ctx = capture.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        capture.toBlob(
          (blob) => {
            if (blob && ws.readyState === WebSocket.OPEN) {
              blob.arrayBuffer().then((buf) => ws.send(buf));
            }
          },
          "image/jpeg",
          0.6,
        );
      }, 100);

      await syncCameraDeviceState(true);
      showToast("Camera started", "success");
    } catch (error) {
      console.error("Camera error:", error);
      stopCameraStream();
      setCameraError("Camera access denied or unavailable");
      showToast("Camera access denied or unavailable", "error");
    }
  });

  const stopCamera = useEffectEvent(async () => {
    disableMotion();

    if (recording) {
      stopRecordingInternal();
    }

    stopCameraStream();
    await syncCameraDeviceState(false);
    showToast("Camera stopped", "info");
  });

  const toggleCamera = useEffectEvent(async () => {
    if (cameraActive) {
      await stopCamera();
      return;
    }

    await startCamera();
  });

  const toggleMotion = useEffectEvent(() => {
    if (!cameraActive) {
      showToast("Enable the camera before motion detection", "warning");
      return;
    }

    if (motionEnabled) {
      disableMotion();
      showToast("Motion detection disabled", "info");
      return;
    }

    setMotionEnabled(true);
    previousFrameRef.current = null;
    motionFrameRef.current = window.requestAnimationFrame(motionLoop);
    showToast("Motion detection enabled", "success");
  });

  const toggleRecording = useEffectEvent(async () => {
    if (!cameraActive) {
      showToast("Enable the camera before recording", "warning");
      return;
    }

    if (recording) {
      stopRecordingInternal();
      showToast("Recording stopped", "info");
      return;
    }

    await startRecording();
  });

  const takeSnapshot = useEffectEvent(async () => {
    const video = videoRef.current;

    if (!cameraActive || !video) {
      showToast("Enable the camera before taking a snapshot", "warning");
      return;
    }

    const snapshotCanvas = document.createElement("canvas");
    snapshotCanvas.width = video.videoWidth || 640;
    snapshotCanvas.height = video.videoHeight || 480;
    const context = snapshotCanvas.getContext("2d");

    if (!context) {
      showToast("Snapshot failed", "error");
      return;
    }

    context.drawImage(video, 0, 0);
    setSnapshotFlash(true);
    window.setTimeout(() => setSnapshotFlash(false), 150);

    snapshotCanvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast("Snapshot failed", "error");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `snapshot_${formatClipFileStamp(new Date().toISOString())}.jpg`;
        link.click();
        URL.revokeObjectURL(url);
        showToast("Snapshot saved", "success");
      },
      "image/jpeg",
      0.92,
    );
  });

  const toggleFullscreen = useEffectEvent(async () => {
    const panel = streamPanelRef.current;

    if (!panel) {
      return;
    }

    if (!document.fullscreenElement) {
      await panel.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  });

  const resolveAlert = useEffectEvent(async (notificationId: number) => {
    const targetAlert = overview.alerts.find(
      (alert) => alert.notification_id === notificationId,
    );

    if (!targetAlert || targetAlert.is_read) {
      return;
    }

    setResolvingAlertId(notificationId);
    const updated = await securityAPI.markAlertRead(notificationId, true);
    setResolvingAlertId(null);

    if (!updated) {
      showToast("Failed to resolve alert", "error");
      return;
    }

    setOverview((current) => ({
      ...current,
      alerts: current.alerts.map((alert) =>
        alert.notification_id === notificationId ? updated : alert,
      ),
    }));
    showToast("Alert resolved", "success");
  });

  const playClip = useEffectEvent((clipId: string) => {
    const clip = clipList.find((item) => item.id === clipId);

    if (!clip?.playable || !clip.url) {
      showToast("This backend event does not have a playable file", "warning");
      return;
    }

    const player = window.open(clip.url, "_blank");

    if (!player) {
      showToast("Popup blocked while opening the clip", "warning");
    }
  });

  useEffect(() => {
    void refreshOverview(true);

    const syncTimer = window.setInterval(() => {
      void refreshOverview();
    }, 15000);

    const clockTimer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(syncTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  useEffect(() => {
    const updateStorageEstimate = async () => {
      if (!navigator.storage?.estimate) {
        setStorageLabel("Browser managed");
        return;
      }

      try {
        const estimate = await navigator.storage.estimate();

        if (!estimate.quota || estimate.usage == null) {
          setStorageLabel("Unavailable");
          return;
        }

        const freeBytes = Math.max(estimate.quota - estimate.usage, 0);
        setStorageLabel(`${(freeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB free`);
      } catch (error) {
        console.error("Storage estimate error:", error);
        setStorageLabel("Unavailable");
      }
    };

    void updateStorageEstimate();
  }, []);

  useEffect(() => {
    const handleResize = () => resizeCanvas();
    const handleFullscreenChange = () => {
      setFullscreenActive(Boolean(document.fullscreenElement));
      resizeCanvas();
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!motionEnabled || !cameraActive) {
      const context = canvasRef.current?.getContext("2d");
      if (context && canvasRef.current) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  }, [cameraActive, motionEnabled]);

  useEffect(() => {
    return () => {
      disableMotion();
      stopCameraStream();

      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }

      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      if (frameIntervalRef.current) {
        window.clearInterval(frameIntervalRef.current);
      }

      cameraWsRef.current?.close();
      localClipUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const cameraStatusValue = cameraActive
    ? "720p Active"
    : cameraDevice?.is_active
      ? "Armed"
      : "Disconnected";

  const irStatusValue = motionSensor
    ? lastMotionEvent
      ? `Last event ${formatShortTime(lastMotionEvent.recorded_at)}`
      : "Online"
    : "Offline";

  return (
    <>
      <div className="sec-layout">
        <LeftCol
          cameraActive={cameraActive}
          cameraBusy={cameraBusy}
          cameraError={cameraError}
          fullscreenActive={fullscreenActive}
          hudTimestamp={formatHudTimestamp(now)}
          motionEnabled={motionEnabled}
          motionFlash={motionFlash}
          onEnableCamera={startCamera}
          onSnapshot={takeSnapshot}
          onToggleCamera={toggleCamera}
          onToggleFullscreen={toggleFullscreen}
          onToggleMotion={toggleMotion}
          onToggleRecording={toggleRecording}
          recordTimerLabel={formatDuration(recordSeconds)}
          recording={recording}
          snapshotFlash={snapshotFlash}
          statusText={cameraStatusText}
          streamPanelRef={streamPanelRef}
          videoRef={videoRef}
          canvasRef={canvasRef}
        />
        <RightCol
          alerts={alertViews}
          clips={clipList}
          loading={loading}
          motionLabel={motionCardLabel}
          motionStatusLabel={motionCardStatusLabel}
          motionSub={lastMotionSub}
          motionTone={motionTone}
          onPlayClip={playClip}
          onResolveAlert={resolveAlert}
          resolvingAlertId={resolvingAlertId}
          triggerCount={todayTriggerCount}
          unresolvedCount={unresolvedCount}
          lastEventLabel={lastMotionLabel}
        />
        <SensorStatusBar
          cameraLedTone={cameraActive ? "online" : cameraDevice?.is_active ? "warning" : "offline"}
          cameraValue={cameraStatusValue}
          irLedTone={motionSensor ? "online" : "offline"}
          irValue={irStatusValue}
          lastUpdatedLabel={lastUpdatedLabel}
          motionValue={motionEnabled ? "Detection ON" : "Detection OFF"}
          mqttLedTone={mqttTone}
          mqttValue={mqttValue}
          storageValue={storageLabel}
        />
      </div>

      <div className={`sec-toast ${toast.tone} ${toast.visible ? "show" : ""}`}>
        <i
          className={
            toast.tone === "error"
              ? "fa-solid fa-triangle-exclamation"
              : toast.tone === "warning"
                ? "fa-solid fa-circle-exclamation"
                : toast.tone === "info"
                  ? "fa-solid fa-circle-info"
                  : "fa-solid fa-circle-check"
          }
        ></i>
        <span>{toast.message}</span>
      </div>
    </>
  );
}
