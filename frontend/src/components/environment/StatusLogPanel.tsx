import axios from "axios";
import { useEffect, useMemo, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL;

type SensorLog = {
  sensor_log_id: number;
  sensor_id: number;
  value: number;
  is_valid: boolean;
  recorded_at: string;
};

type Sensor = {
  sensor_id: number;
  device_id: number;
  sensor_type: string;
  unit: string;
  min_valid: number;
  max_valid: number;
};

export default function StatusLogPanel() {
  const [logs, setLogs] = useState<SensorLog[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [logsRes, sensorsRes] = await Promise.all([
          axios.get<SensorLog[]>(`${API_URL}/sensor-logs/`),
          axios.get<Sensor[]>(`${API_URL}/sensors/`),
        ]);

        setLogs(logsRes.data);
        setSensors(sensorsRes.data);
      } catch (error) {
        console.error("Failed to fetch status log data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sensorMap = useMemo(() => {
    return Object.fromEntries(
      sensors.map((sensor) => [sensor.sensor_id, sensor]),
    );
  }, [sensors]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDay = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();

    return isToday ? "Today" : date.toLocaleDateString();
  };

  const formatSensorType = (sensorType?: string) => {
    if (!sensorType) return "Unknown Sensor";

    return sensorType.charAt(0).toUpperCase() + sensorType.slice(1);
  };

  return (
    <div className="log-panel">
      <div className="sec-label" style={{ marginBottom: "8px" }}>
        Status Log
      </div>

      <div className="log-list">
        {loading ? (
          <div className="log-empty">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="log-empty">No logs yet.</div>
        ) : (
          logs.map((item, i) => {
            const sensor = sensorMap[item.sensor_id];
            const sensorType = formatSensorType(sensor?.sensor_type);
            const unit = sensor?.unit ?? "";

            return (
              <div
                key={item.sensor_log_id}
                className="log-item"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div
                  className={`log-dot ${item.is_valid ? "normal" : "warning"}`}
                />

                <div className="log-body">
                  <div className="log-msg">
                    {sensorType} recorded {item.value}
                    {unit}
                  </div>

                  <div className="log-time">
                    {formatDay(item.recorded_at)} · {formatTime(item.recorded_at)} ·{" "}
                    {sensorType.toUpperCase()}
                  </div>
                </div>

                <span
                  className={`log-tag ${item.is_valid ? "tag-normal" : "tag-warning"}`}
                >
                  {item.is_valid ? "valid" : "invalid"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}