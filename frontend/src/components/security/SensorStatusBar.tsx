interface SensorStatusBarProps {
  cameraLedTone: "online" | "offline" | "warning";
  cameraValue: string;
  irLedTone: "online" | "offline" | "warning";
  irValue: string;
  lastUpdatedLabel: string;
  motionValue: string;
  mqttLedTone: "online" | "offline" | "warning";
  mqttValue: string;
  storageValue: string;
}

export default function SensorStatusBar({
  cameraLedTone,
  cameraValue,
  irLedTone,
  irValue,
  lastUpdatedLabel,
  motionValue,
  mqttLedTone,
  mqttValue,
  storageValue,
}: SensorStatusBarProps) {
  return (
    <div className="sensor-status-bar">
      <div className="ssb-seg">
        <div className={`ssb-led ${cameraLedTone}`}></div>
        <span className="ssb-label">Webcam</span>
        <span className="ssb-val">{cameraValue}</span>
      </div>

      <div className="ssb-seg">
        <div className={`ssb-led ${irLedTone}`}></div>
        <span className="ssb-label">IR Sensor</span>
        <span className="ssb-val">{irValue}</span>
      </div>

      <div className="ssb-seg">
        <div className={`ssb-led ${mqttLedTone}`}></div>
        <span className="ssb-label">MQTT</span>
        <span className="ssb-val">{mqttValue}</span>
      </div>

      <div className="ssb-seg">
        <span className="ssb-label">Motion</span>
        <span className="ssb-val">{motionValue}</span>
      </div>

      <div className="ssb-seg">
        <span className="ssb-label">Storage</span>
        <span className="ssb-val">{storageValue}</span>
      </div>

      <div className="ssb-seg">
        <span className="ssb-update">{lastUpdatedLabel}</span>
      </div>
    </div>
  );
}
