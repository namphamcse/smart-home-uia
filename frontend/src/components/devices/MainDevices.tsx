import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type {
  Device,
  DeviceControlHistory,
  DeviceModeEnum,
} from "../../types/device";
import "./Devices.css";
import axios from "axios";
import {
  deviceTypeToIconClass,
  type FilterType,
} from "../../constants/deviceFilters";
import { useNoti } from "../../services/NotiProvider";
import HistoryPanel from "./HistoryPanel";
import CardControl from "./CardControl";
import { createDeviceControlHistory } from "../../api/deviceControls";
const API_URL = import.meta.env.VITE_API_URL;

export default function MainDevices({
  devices,
  setDevices,
  selectedFilter,
}: {
  devices: Device[];
  setDevices: Dispatch<SetStateAction<Device[]>>;
  selectedFilter: FilterType;
}) {
  const [ctrlHistory, setCtrlHistory] = useState<DeviceControlHistory[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const selectedDevice =
    devices.find((d) => d.device_id === selectedCardId) ?? null;
  useEffect(() => {
    async function getCtrlHistory() {
      try {
        const response = await axios.get<DeviceControlHistory[]>(
          `${API_URL}/device-controls`,
        );
        setCtrlHistory(response.data);
      } catch (error) {
        console.error("Failed to get control history:", error);
      }
    }
    getCtrlHistory();
  }, [ctrlHistory]);

  useEffect(() => {
    if (devices.length > 0 && selectedCardId === null) {
      setSelectedCardId(devices[0].device_id);
    }
  }, [devices, selectedCardId]);

  const { setNotification } = useNoti();
  const truncate = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  const handleToggle = async (
    deviceId: number,
    name: string,
    isPowerButton: boolean = false,
  ) => {
    const targetDevice = devices.find((d) => d.device_id === deviceId);
    if (!targetDevice) return;

    const optimisticDevice = isPowerButton
      ? {
          ...targetDevice,
          is_active: !targetDevice.is_active,
        }
      : {
          ...targetDevice,
          device_mode: (targetDevice.device_mode === "auto"
            ? "manual"
            : "auto") as DeviceModeEnum,
        };

    setDevices((prev) =>
      prev.map((device) =>
        device.device_id === deviceId ? optimisticDevice : device,
      ),
    );
    const successMessage = isPowerButton
      ? `${name} turned ${optimisticDevice.is_active ? "ON" : "OFF"}`
      : `${name}: Auto Mode ${optimisticDevice.device_mode === "auto" ? "ON" : "OFF"}`;
    setNotification(successMessage);
    try {
      const deviceResponse = await axios.put<Device>(
        `${API_URL}/devices/${deviceId}`,
        optimisticDevice,
      );
      const updatedDevice = deviceResponse.data;
      if (isPowerButton) {
        const action = optimisticDevice.is_active ? "turn_on" : "turn_off";
        const updatedHistory = await createDeviceControlHistory(deviceId, action, null)
        setCtrlHistory((prev) => [...prev, updatedHistory]);
      }
      setDevices((prev) =>
        prev.map((device) =>
          device.device_id === deviceId ? updatedDevice : device,
        ),
      );
    } catch (error) {
      console.error("Failed to update device:", error);

      setDevices((prev) =>
        prev.map((device) =>
          device.device_id === deviceId ? targetDevice : device,
        ),
      );
      setNotification(`Failed to update ${name}`);
    }
  };

  const handleCardSelect = (device_id: number) => {
    setSelectedCardId(device_id);
  };

  return (
    <div className="devices-layout">
      <div className="device-grid-wrap">
        <div className="grid-head">
          <div className="grid-title">
            {selectedFilter.toUpperCase()} Devices
          </div>
        </div>
        <div className="device-grid" id="device-grid">
          {devices.map((d) => {
            const isOffline = d.status === "offline";
            const isAuto = d.device_mode === "auto";
            return (
              <div
                className={`dev-card ${d.is_active ? "is-on" : ""} ${d.device_id === selectedCardId ? "selected" : ""}`}
                key={d.device_id}
                onClick={() => handleCardSelect(d.device_id)}
              >
                <div className="card-head">
                  <div className="card-icon">
                    <i
                      className={`fa-solid ${deviceTypeToIconClass[d.device_type]}`}
                    ></i>
                  </div>
                  <div className="card-meta">
                    <div className="card-name">
                      {truncate(d.device_name, 20)}
                    </div>
                    <div className="card-room">
                      <i
                        className="fa-solid fa-location-dot"
                        style={{ fontSize: "8px", color: "var(--muted)" }}
                      ></i>
                      {d.location}
                    </div>
                  </div>
                  <span className={`card-status ${isAuto ? "auto" : d.status}`}>{isAuto ? "auto" : d.status}</span>
                </div>

                {/**/}
                <CardControl device={d} setCtrlHistory={setCtrlHistory}/>

                <div className="card-toggle-row">
                  <span className="card-toggle-label">Power</span>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      className="dev-power-toggle"
                      checked={d.is_active}
                      onChange={() =>
                        handleToggle(d.device_id, d.device_name, true)
                      }
                      disabled={isOffline || isAuto}
                    />
                    <div className="toggle-track"></div>
                    <div className="toggle-thumb"></div>
                  </label>
                </div>

                <div className="auto-toggle-row">
                  <span className="auto-toggle-label">
                    <i className="fa-solid fa-gears"></i> Auto Mode
                  </span>
                  <label className="auto-toggle">
                    <input
                      type="checkbox"
                      className="dev-auto-toggle"
                      checked={d.device_mode === "auto"}
                      onChange={() => handleToggle(d.device_id, d.device_name)}
                      disabled={isOffline}
                    />
                    <div className="auto-toggle-track"></div>
                    <div className="auto-toggle-thumb"></div>
                  </label>
                </div>
                {isAuto && <div className="auto-label">Auto</div>}
              </div>
            );
          })}
        </div>
      </div>

      <HistoryPanel device={selectedDevice} ctrlHistory={ctrlHistory} />
    </div>
  );
}
