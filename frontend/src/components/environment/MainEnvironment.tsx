import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { getSensorStatus, useThreshold } from "../../hooks/useSensorStatus";
import type { DHT20Data, LightData } from "../../types/device";
import "./environment.css";
import EnvSensorCard from "./EnvSensorCard";
import HistoryChartPanel, {
  type EnvironmentSensorInfo,
  type HistoryPoint,
  type SensorKey,
} from "./HistoryChartPanel";
import ThresholdPanel from "./ThresholdPanel";
import StatusLogPanel from "./StatusLogPanel";

const API_URL = import.meta.env.VITE_API_URL;

type SensorRecord = {
  sensor_id: number;
  device_id: number;
  sensor_type: "temperature" | "humidity" | "motion" | "light";
  unit: string;
  min_valid: number;
  max_valid: number;
};

type SensorLogRecord = {
  sensor_log_id: number;
  sensor_id: number;
  value: number;
  is_valid: boolean;
  recorded_at: string;
};

const SENSOR_ID_FALLBACK: Record<SensorKey, number> = {
  temp: 2,
  hum: 3,
  light: 1,
};

const SENSOR_TYPE_TO_KEY: Partial<Record<SensorRecord["sensor_type"], SensorKey>> = {
  temperature: "temp",
  humidity: "hum",
  light: "light",
};

function normalizeTimestamp(timestamp?: number) {
  if (!timestamp) {
    return Date.now();
  }

  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
}

function isSameDay(timestamp: number, now: Date) {
  const date = new Date(timestamp);
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function MainEnvironment({
  tempData,
  humidityData,
  lightData,
}: {
  tempData: DHT20Data | null;
  humidityData: DHT20Data | null;
  lightData: LightData | null;
}) {
  const thresholds = useThreshold();
  const [activeSensor, setActiveSensor] = useState<SensorKey>("temp");
  const [sensors, setSensors] = useState<SensorRecord[]>([]);
  const [historyByKey, setHistoryByKey] = useState<Record<SensorKey, HistoryPoint[]>>({
    temp: [],
    hum: [],
    light: [],
  });
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const lastLiveTimestampRef = useRef<Record<SensorKey, number>>({
    temp: 0,
    hum: 0,
    light: 0,
  });

  const sensorsByKey = useMemo(
    () =>
      sensors.reduce(
        (acc, sensor) => {
          const key = SENSOR_TYPE_TO_KEY[sensor.sensor_type];
          if (key) {
            acc[key] = sensor;
          }
          return acc;
        },
        {} as Partial<Record<SensorKey, SensorRecord>>,
      ),
    [sensors],
  );

  const sensorInfoByKey = useMemo<Record<SensorKey, EnvironmentSensorInfo>>(
    () => ({
      temp: {
        key: "temp",
        label: "Temperature",
        unit: sensorsByKey.temp?.unit || "°C",
        color: "#EF4444",
        sensorId: sensorsByKey.temp?.sensor_id ?? SENSOR_ID_FALLBACK.temp,
      },
      hum: {
        key: "hum",
        label: "Humidity",
        unit: sensorsByKey.hum?.unit || "%",
        color: "#2563EB",
        sensorId: sensorsByKey.hum?.sensor_id ?? SENSOR_ID_FALLBACK.hum,
      },
      light: {
        key: "light",
        label: "Light level",
        unit: sensorsByKey.light?.unit || "lux",
        color: "#F97316",
        sensorId: sensorsByKey.light?.sensor_id ?? SENSOR_ID_FALLBACK.light,
      },
    }),
    [sensorsByKey],
  );

  const tempStatus = getSensorStatus(
    thresholds,
    sensorInfoByKey.temp.sensorId ?? SENSOR_ID_FALLBACK.temp,
    tempData?.temperature_c,
  );
  const humStatus = getSensorStatus(
    thresholds,
    sensorInfoByKey.hum.sensorId ?? SENSOR_ID_FALLBACK.hum,
    humidityData?.humidity_pct,
  );
  const lightStatus = getSensorStatus(
    thresholds,
    sensorInfoByKey.light.sensorId ?? SENSOR_ID_FALLBACK.light,
    lightData?.lux,
  );

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true);

        const [sensorRes, logRes] = await Promise.all([
          axios.get<SensorRecord[]>(`${API_URL}/sensors/`),
          axios.get<SensorLogRecord[]>(`${API_URL}/sensor-logs/`),
        ]);

        if (!isMounted) {
          return;
        }

        const nextSensors = sensorRes.data;
        const sensorIdToKey = Object.fromEntries(
          nextSensors
            .map((sensor) => {
              const key = SENSOR_TYPE_TO_KEY[sensor.sensor_type];
              return key ? [sensor.sensor_id, key] : null;
            })
            .filter((entry): entry is [number, SensorKey] => entry !== null),
        );

        const nextHistory: Record<SensorKey, HistoryPoint[]> = {
          temp: [],
          hum: [],
          light: [],
        };

        logRes.data.forEach((log) => {
          const key = sensorIdToKey[log.sensor_id];
          if (!key) {
            return;
          }

          nextHistory[key].push({
            t: new Date(log.recorded_at).getTime(),
            v: log.value,
          });
        });

        (Object.keys(nextHistory) as SensorKey[]).forEach((key) => {
          nextHistory[key].sort((a, b) => a.t - b.t);
        });

        setSensors(nextSensors);
        setHistoryByKey(nextHistory);
        setHistoryError(null);
      } catch (error) {
        console.error("Failed to fetch chart history:", error);
        if (isMounted) {
          setHistoryError("Failed to load sensor history");
        }
      } finally {
        if (isMounted) {
          setHistoryLoading(false);
        }
      }
    };

    void fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const updates: Array<{ key: SensorKey; value: number | undefined; timestamp?: number }> = [
      {
        key: "temp",
        value: tempData?.temperature_c,
        timestamp: tempData?.timestamp,
      },
      {
        key: "hum",
        value: humidityData?.humidity_pct,
        timestamp: humidityData?.timestamp,
      },
      {
        key: "light",
        value: lightData?.lux,
        timestamp: lightData?.timestamp,
      },
    ];

    const nextEntries: Partial<Record<SensorKey, HistoryPoint>> = {};

    updates.forEach((update) => {
      if (update.value == null || Number.isNaN(update.value)) {
        return;
      }

      const normalized = normalizeTimestamp(update.timestamp);
      if (normalized <= lastLiveTimestampRef.current[update.key]) {
        return;
      }

      lastLiveTimestampRef.current[update.key] = normalized;
      nextEntries[update.key] = {
        t: normalized,
        v: update.value,
      };
    });

    if (Object.keys(nextEntries).length === 0) {
      return;
    }

    setHistoryByKey((current) => {
      const next = { ...current };

      (Object.keys(nextEntries) as SensorKey[]).forEach((key) => {
        const point = nextEntries[key];
        if (!point) {
          return;
        }

        const existing = current[key];
        const lastPoint = existing[existing.length - 1];

        if (lastPoint?.t === point.t) {
          next[key] = [...existing.slice(0, -1), point];
          return;
        }

        next[key] = [...existing, point].slice(-500);
      });

      return next;
    });
  }, [
    humidityData?.humidity_pct,
    humidityData?.timestamp,
    lightData?.lux,
    lightData?.timestamp,
    tempData?.temperature_c,
    tempData?.timestamp,
  ]);

  const sensorStats = useMemo(() => {
    const now = new Date();

    return (Object.keys(historyByKey) as SensorKey[]).reduce(
      (acc, key) => {
        const points = historyByKey[key];
        const dayPoints = points.filter((point) => isSameDay(point.t, now));
        const relevant = dayPoints.length > 0 ? dayPoints : points;

        acc[key] = {
          min:
            relevant.length > 0
              ? Math.min(...relevant.map((point) => point.v))
              : undefined,
          max:
            relevant.length > 0
              ? Math.max(...relevant.map((point) => point.v))
              : undefined,
        };
        return acc;
      },
      {} as Record<SensorKey, { min?: number; max?: number }>,
    );
  }, [historyByKey]);

  return (
    <div className="env-content">
      <div className="sensor-cards-row">
        <EnvSensorCard
          active={activeSensor === "temp"}
          icon="fa-temperature-half"
          label="Temperature"
          minValue={sensorStats.temp.min}
          maxValue={sensorStats.temp.max}
          onClick={() => setActiveSensor("temp")}
          sensorKey="temp"
          status={tempStatus}
          themeClass="temp-card"
          unit="°C"
          value={tempData?.temperature_c}
        />

        <EnvSensorCard
          active={activeSensor === "hum"}
          icon="fa-droplet"
          label="Humidity"
          minValue={sensorStats.hum.min}
          maxValue={sensorStats.hum.max}
          onClick={() => setActiveSensor("hum")}
          sensorKey="hum"
          status={humStatus}
          themeClass="hum-card"
          unit="%"
          value={humidityData?.humidity_pct}
        />

        <EnvSensorCard
          active={activeSensor === "light"}
          icon="fa-sun"
          label="Light level"
          minValue={sensorStats.light.min?.toFixed(0)}
          maxValue={sensorStats.light.max?.toFixed(0)}
          onClick={() => setActiveSensor("light")}
          sensorKey="light"
          status={lightStatus}
          themeClass="light-card"
          unit="lux"
          value={lightData?.lux?.toFixed(0)}
        />
      </div>

      <div className="bottom-section">
        <HistoryChartPanel
          activeSensor={activeSensor}
          historyByKey={historyByKey}
          historyError={historyError}
          historyLoading={historyLoading}
          onSelectSensor={setActiveSensor}
          sensorInfoByKey={sensorInfoByKey}
          thresholds={thresholds}
        />

        <div className="right-col">
          <ThresholdPanel />
          <StatusLogPanel />
        </div>
      </div>
    </div>
  );
}
