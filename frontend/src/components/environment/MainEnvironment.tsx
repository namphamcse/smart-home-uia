import { useEffect, useState } from "react";
import { getSensorStatus, useThreshold } from "../../hooks/useSensorStatus";
import type { DHT20Data, LightData } from "../../types/device";
import "./environment.css";
import EnvSensorCard from "./EnvSensorCard";
import ThresholdPanel from "./ThresholdPanel";
import StatusLogPanel from "./StatusLogPanel";

export default function MainDevices({
  tempData,
  humidityData,
  lightData,
}: {
  tempData: DHT20Data | null;
  humidityData: DHT20Data | null;
  lightData: LightData | null;
}) {
  const thresholds = useThreshold();
  const tempStatus = getSensorStatus(thresholds, 2, tempData?.temperature_c);
  const humStatus = getSensorStatus(thresholds, 3, humidityData?.humidity_pct);
  const lightStatus = getSensorStatus(thresholds, 1, lightData?.lux);
  
  const [tempMin, setTempMin] = useState<number | undefined>(undefined);
  const [tempMax, setTempMax] = useState<number | undefined>(undefined);

  const [humMin, setHumMin] = useState<number | undefined>(undefined);
  const [humMax, setHumMax] = useState<number | undefined>(undefined);

  const [lightMin, setLightMin] = useState<number | undefined>(undefined);
  const [lightMax, setLightMax] = useState<number | undefined>(undefined);

  useEffect(() => {
    const value = tempData?.temperature_c;
    if (value == null) return;

    setTempMin((prev) => (prev === undefined ? value : Math.min(prev, value)));
    setTempMax((prev) => (prev === undefined ? value : Math.max(prev, value)));
  }, [tempData]);

  useEffect(() => {
    const value = humidityData?.humidity_pct;
    if (value == null) return;

    setHumMin((prev) => (prev === undefined ? value : Math.min(prev, value)));
    setHumMax((prev) => (prev === undefined ? value : Math.max(prev, value)));
  }, [humidityData]);

  useEffect(() => {
    const value = lightData?.lux;
    if (value == null) return;

    setLightMin((prev) => (prev === undefined ? value : Math.min(prev, value)));
    setLightMax((prev) => (prev === undefined ? value : Math.max(prev, value)));
  }, [lightData]);
  return (
    <div className="env-content">
      <div className="sensor-cards-row">
        <EnvSensorCard
          icon="fa-temperature-half"
          label="Temperature"
          value={tempData?.temperature_c}
          unit="°C"
          status={tempStatus}
          minValue={tempMin}
          maxValue={tempMax}
        />

        <EnvSensorCard
          icon="fa-droplet"
          label="Humidity"
          value={humidityData?.humidity_pct}
          unit="%"
          status={humStatus}
          minValue={humMin}
          maxValue={humMax}
        />

        <EnvSensorCard
          icon="fa-sun"
          label="Light level"
          value={lightData?.lux?.toFixed(0)}
          unit="lux"
          status={lightStatus}
          minValue={lightMin?.toFixed(0)}
          maxValue={lightMax?.toFixed(0)}
        />
      </div>

      <div className="bottom-section">
        {/* 4. Historical Chart */}
        <div className="chart-panel">
          <div className="chart-controls">
            <div className="chart-sensor-tabs">
              <button className="cs-tab temp-tab active" data-sensor="temp">
                Temp
              </button>
              <button className="cs-tab hum-tab" data-sensor="hum">
                Humidity
              </button>
              <button className="cs-tab light-tab" data-sensor="light">
                Light
              </button>
            </div>

            <div className="time-tabs">
              <button className="t-tab active" data-range="1h">
                1H
              </button>
              <button className="t-tab" data-range="6h">
                6H
              </button>
              <button className="t-tab" data-range="24h">
                24H
              </button>
              <button className="t-tab" data-range="7d">
                7D
              </button>
            </div>

            <button className="btn-export" id="btn-export-csv">
              <i className="fa-solid fa-file-csv"></i> CSV
            </button>
            <button
              className="btn-export"
              id="btn-export-pdf"
              style={{ borderColor: "var(--border)" }}
            >
              <i className="fa-solid fa-file-pdf"></i> PDF
            </button>
          </div>

          <div className="chart-canvas-wrap">
            <canvas id="sensor-chart"></canvas>
          </div>

          <div className="chart-legend">
            <div className="legend-item">
              <div
                className="legend-line data-line"
                id="legend-data-line"
              ></div>
              <span id="legend-sensor-name">Temperature (°C)</span>
            </div>
            <div className="legend-item">
              <div className="legend-line warn-line"></div>
              <span>Warning threshold</span>
            </div>
            <div className="legend-item">
              <div className="legend-line alert-line"></div>
              <span>Alert threshold</span>
            </div>
          </div>
        </div>

        <div className="right-col">
          <ThresholdPanel />

          <StatusLogPanel />
        </div>
      </div>
    </div>
  );
}
