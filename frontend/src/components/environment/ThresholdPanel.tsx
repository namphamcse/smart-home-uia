import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNoti } from "../../services/NotiProvider";
import { capitalizeFirst } from "../../utils/formatters";

type SensorType = "temperature" | "humidity" | "light";

type Sensor = {
  sensor_id: number;
  device_id: number;
  sensor_type: SensorType;
  unit: string;
  min_valid: number;
  max_valid: number;
};

type AlertThreshold = {
  alert_threshold_id: number;
  sensor_id: number;
  min_threshold: number;
  max_threshold: number;
  is_active: boolean;
};

type ThresholdWithSensor = AlertThreshold & {
  sensor: Sensor;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function ThresholdPanel() {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [thresholds, setThresholds] = useState<AlertThreshold[]>([]);
  const [selectedType, setSelectedType] = useState<SensorType>("temperature");
  const [loading, setLoading] = useState(false);

  const [minValue, setMinValue] = useState<number | "">("");
  const [maxValue, setMaxValue] = useState<number | "">("");
  const [isActive, setIsActive] = useState(false);

  const { setNotification } = useNoti();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [sensorsRes, thresholdsRes] = await Promise.all([
          axios.get<Sensor[]>(`${API_URL}/sensors/`),
          axios.get<AlertThreshold[]>(`${API_URL}/alert-thresholds/`),
        ]);

        setSensors(sensorsRes.data);
        setThresholds(thresholdsRes.data);
      } catch (error) {
        console.error("Failed to fetch threshold data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const thresholdItems: ThresholdWithSensor[] = useMemo(() => {
    return thresholds
      .map((threshold) => {
        const sensor = sensors.find((s) => s.sensor_id === threshold.sensor_id);
        if (!sensor) return null;

        return {
          ...threshold,
          sensor,
        };
      })
      .filter((item): item is ThresholdWithSensor => item !== null);
  }, [thresholds, sensors]);

  const selectedThreshold = useMemo(() => {
    return thresholdItems.find(
      (item) => item.sensor.sensor_type === selectedType,
    );
  }, [thresholdItems, selectedType]);

  // whenever selected tab changes, load its values into the form
  useEffect(() => {
    if (!selectedThreshold) {
      setMinValue("");
      setMaxValue("");
      setIsActive(false);
      return;
    }

    setMinValue(selectedThreshold.min_threshold);
    setMaxValue(selectedThreshold.max_threshold);
    setIsActive(selectedThreshold.is_active);
  }, [selectedThreshold]);

  const handleSave = async () => {
    if (!selectedThreshold) return;
    if (minValue === "" || maxValue === "") return;

    try {
      const payload = {
        min_threshold: Number(minValue),
        max_threshold: Number(maxValue),
        is_active: isActive,
      };

      const res = await axios.put<AlertThreshold>(
        `${API_URL}/alert-thresholds/${selectedThreshold.alert_threshold_id}`,
        payload,
        setNotification(
          `Thresholds saved for ${capitalizeFirst(selectedType)}`,
        ),
      );

      const updatedThreshold = res.data;

      setThresholds((prev) =>
        prev.map((item) =>
          item.alert_threshold_id === updatedThreshold.alert_threshold_id
            ? updatedThreshold
            : item,
        ),
      );

      console.log("Threshold updated");
    } catch (error) {
      console.error("Failed to update threshold:", error);
      setNotification("Failed to update threshold");
    }
  };

  return (
    <div className="threshold-panel">
      <div className="sec-label" style={{ marginBottom: "8px" }}>
        Alert Thresholds
      </div>

      <div className="thresh-sensor-row">
        <button
          className={`thresh-sensor-btn ${selectedType === "temperature" ? "active" : ""}`}
          onClick={() => setSelectedType("temperature")}
          type="button"
        >
          Temp
        </button>

        <button
          className={`thresh-sensor-btn ${selectedType === "humidity" ? "active" : ""}`}
          onClick={() => setSelectedType("humidity")}
          type="button"
        >
          Humid
        </button>

        <button
          className={`thresh-sensor-btn ${selectedType === "light" ? "active" : ""}`}
          onClick={() => setSelectedType("light")}
          type="button"
        >
          Light
        </button>
      </div>

      {!selectedThreshold ? (
        <div>No threshold found for this sensor.</div>
      ) : (
        <>
          <div className="thresh-inputs">
            <div className="thresh-field">
              <label htmlFor="thresh-min">Min Threshold</label>
              <input
                type="number"
                id="thresh-min"
                value={minValue}
                onChange={(e) =>
                  setMinValue(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                min={selectedThreshold.sensor.min_valid}
                max={selectedThreshold.sensor.max_valid}
              />
            </div>

            <div className="thresh-field">
              <label htmlFor="thresh-max">Max Threshold</label>
              <input
                type="number"
                id="thresh-max"
                value={maxValue}
                onChange={(e) =>
                  setMaxValue(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                min={selectedThreshold.sensor.min_valid}
                max={selectedThreshold.sensor.max_valid}
              />
            </div>
          </div>

          <div className="thresh-bottom-row">
            <label className="thresh-alert-toggle">
              <span className="mini-toggle">
                <input
                  type="checkbox"
                  id="thresh-alert-toggle"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <div className="mini-toggle-track"></div>
                <div className="mini-toggle-thumb"></div>
              </span>
              Alert Enabled
            </label>

            <button
              className="btn-save-thresh"
              id="btn-save-thresh"
              onClick={handleSave}
              type="button"
              disabled={loading}
            >
              <i className="fa-solid fa-floppy-disk"></i> Save
            </button>
          </div>
        </>
      )}
    </div>
  );
}
