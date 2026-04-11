import type {
  Device,
  DeviceControlHistory,
} from "../../types/device";
import { createDeviceControlHistory } from "../../api/deviceControls";
import { useState, type Dispatch, type SetStateAction, useRef } from "react";
import { useNoti } from "../../services/NotiProvider";
import { capitalizeFirst } from "../../utils/formatters";

export default function CardControl({
  device,
  setCtrlHistory,
}: {
  device: Device;
  setCtrlHistory: Dispatch<SetStateAction<DeviceControlHistory[]>>;
}) {
  // const tempData = useWS<DHT20Data>('/5');
  // console.log(tempData);

  let control = null;
  switch (device.device_type) {
    case "fan":
      control = <FanControl device={device} setCtrlHistory={setCtrlHistory} />;
      break;
    case "light":
      control = (
        <LightControl device={device} setCtrlHistory={setCtrlHistory} />
      );
      break;
    case "camera":
      control = (
        <CameraControl />
      );
      break;
    case "servo":
      control = (
        <ServoControl device={device} setCtrlHistory={setCtrlHistory} />
      );
      break;
    default:
      control = null;
  }
  return <div className="card-controls">{control}</div>;
}

function FanControl({
  device,
  setCtrlHistory,
}: {
  device: Device;
  setCtrlHistory: Dispatch<SetStateAction<DeviceControlHistory[]>>;
}) {
  const [speed, setSpeed] = useState<string>("medium");
  const { setNotification } = useNoti();
  const handleSetSpeed = async (value: string) => {
    setSpeed(value);
    setNotification(`${device.device_name}: speed → ${capitalizeFirst(value)}`);
    try {
      const updatedHistory = await createDeviceControlHistory(
        device.device_id,
        "set_speed",
        value,
      );

      setCtrlHistory((prev) => [...prev, updatedHistory]);
    } catch (error) {
      console.error("Failed to create device control history:", error);
    }
  };
  return (
    <div className="fan-row">
      <button
        className={`fan-speed-btn ${speed === "low" ? "active" : ""}`}
        onClick={() => {
          handleSetSpeed("low");
        }}
      >
        Low
      </button>
      <button
        className={`fan-speed-btn ${speed === "medium" ? "active" : ""}`}
        onClick={() => {
          handleSetSpeed("medium");
        }}
      >
        Med
      </button>
      <button
        className={`fan-speed-btn ${speed === "high" ? "active" : ""}`}
        onClick={() => {
          handleSetSpeed("high");
        }}
      >
        High
      </button>
      <div className="fan-temp" id="d3-temp">
        27.4<span>°C</span>
      </div>
    </div>
  );
}

function LightControl({
  device,
  setCtrlHistory,
}: {
  device: Device;
  setCtrlHistory: Dispatch<SetStateAction<DeviceControlHistory[]>>;
}) {
  const [selectedColor, setSelectedColor] = useState<string>("#FFFFFF");
  const lastSubmittedCustomColorRef = useRef<string>("#FFFFFF");
  const { setNotification } = useNoti();

  const presetColors = [
    { value: "#FFFFFF", title: "White" },
    { value: "#FFF3CD", title: "Warm White" },
    { value: "#FACC15", title: "Yellow" },
    { value: "#2563EB", title: "Blue" },
    { value: "#EF4444", title: "Red" },
    { value: "#34D399", title: "Green" },
  ];

  const handleColorChange = async (
    nextColor: string,
    options?: { title?: string; isCustom?: boolean },
  ) => {
    const normalizedColor = nextColor.toUpperCase();

    if (options?.isCustom) {
      if (normalizedColor === lastSubmittedCustomColorRef.current) return;
      lastSubmittedCustomColorRef.current = normalizedColor;
    }

    setSelectedColor(normalizedColor);

    if (options?.isCustom) {
      setNotification(`${device.device_name}: custom color applied`);
    } else {
      setNotification(
        `${device.device_name}: color set to ${options?.title ?? normalizedColor}`,
      );
    }

    try {
      const updatedHistory = await createDeviceControlHistory(
        device.device_id,
        "set_color",
        normalizedColor,
      );

      setCtrlHistory((prev) => [...prev, updatedHistory]);
    } catch (error) {
      console.error("Failed to create device control history:", error);
    }
  };

  return (
    <div className="color-row">
      <span className="color-label">Color</span>

      <div className="color-swatch-row">
        {presetColors.map((color) => (
          <div
            key={color.value}
            className={`color-swatch ${
              selectedColor.toUpperCase() === color.value ? "active" : ""
            }`}
            style={{ background: color.value }}
            data-color={color.value}
            title={color.title}
            onClick={() =>
              handleColorChange(color.value, { title: color.title })
            }
          />
        ))}

        <input
          type="color"
          className="color-picker-input"
          title="Custom color"
          value={selectedColor}
          onInput={(e) =>
            setSelectedColor((e.target as HTMLInputElement).value.toUpperCase())
          }
          onChange={(e) =>
            handleColorChange(
              (e.target as HTMLInputElement).value.toUpperCase(),
              {
                isCustom: true,
              },
            )
          }
        />
      </div>

      <div
        className="color-preview"
        id="d1-color-preview"
        style={{ background: selectedColor }}
      />
    </div>
  );
}

function CameraControl() {
  return (
    <div className="cam-row">
      <span className={`cam-badge ${"live"}`}>Live</span>
      <span className="cam-res">1080p · 30fps</span>
    </div>
  );
}

function ServoControl({
  device,
  setCtrlHistory,
}: {
  device: Device;
  setCtrlHistory: Dispatch<SetStateAction<DeviceControlHistory[]>>;
}) {
  const [servoWidth, setServoWidth] = useState<string>("0%");
  const angle = servoWidth === "0%" ? "0" : "90";
  const { setNotification } = useNoti();
  const handleDoorAction = async (action: string) => {
    const nextAngle = action === "closed" ? "0" : "90";
    setNotification(`${device.device_name} ${action.toUpperCase()}`);
    setServoWidth(action === "closed" ? "0%" : "50%");
    try {
      const updatedHistory = await createDeviceControlHistory(
        device.device_id,
        "set_angle",
        nextAngle,
      );

      setCtrlHistory((prev) => [...prev, updatedHistory]);
    } catch (error) {
      console.error("Failed to create device control history:", error);
    }
  };
  return (
    <>
      <div className="door-btn-row">
        <button
          className="door-btn open-btn"
          onClick={() => handleDoorAction("opened")}
        >
          <i className="fa-solid fa-lock-open"></i> Open
        </button>
        <button
          className="door-btn close-btn"
          onClick={() => handleDoorAction("closed")}
        >
          <i className="fa-solid fa-lock"></i> Close
        </button>
      </div>
      <div className="servo-row">
        <span className="servo-label">Servo</span>
        <div className="servo-bar-wrap">
          <div
            className="servo-bar-fill"
            id="d4-servo-fill"
            style={{ width: servoWidth }}
          ></div>
        </div>
        <span className="servo-val" id="d4-servo-val">
          {angle}°
        </span>
      </div>
    </>
  );
}
