import { getSensorStatus, useThreshold } from "../../hooks/useSensorStatus";
import type { DHT20Data, LightData } from "../../types/device";
import { envStatusValue } from "../../utils/formatters";
import "./environment.css";

export default function OverviewBar({
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
  return (
    <div className="overview-bar">
      <div className="ov-seg temp-seg">
        <div className="ov-icon">
          <i className="fa-solid fa-temperature-half"></i>
        </div>
        <span className="ov-label">Temp</span>
        <span className="ov-val" id="ov-temp">
          {tempData?.temperature_c ?? "N/A"}
        </span>
        <span className="ov-unit">°C</span>
        <span className={`ov-status ${tempStatus.toLowerCase()} ${tempStatus === "ALERT" ? "ov-blink" : ""}`} id="ov-temp-status">
          {envStatusValue(tempStatus)}
        </span>
        <div className="update-dot"></div>
      </div>

      <div className="ov-seg hum-seg">
        <div className="ov-icon">
          <i className="fa-solid fa-droplet"></i>
        </div>
        <span className="ov-label">Humidity</span>
        <span className="ov-val" id="ov-hum">
          {humidityData?.humidity_pct ?? "N/A"}
        </span>
        <span className="ov-unit">%</span>
        <span className={`ov-status ${humStatus.toLowerCase()} ${humStatus === "ALERT" ? "ov-blink" : ""}`} id="ov-hum-status">
          {envStatusValue(humStatus)}
        </span>
        <div className="update-dot"></div>
      </div>

      <div className="ov-seg light-seg">
        <div className="ov-icon">
          <i className="fa-solid fa-sun"></i>
        </div>
        <span className="ov-label">Light</span>
        <span className="ov-val" id="ov-light">
          {lightData?.lux?.toFixed(0) ?? "N/A"}
        </span>
        <span className="ov-unit">lux</span>
        <span className={`ov-status ${lightStatus.toLowerCase()} ${lightStatus === "ALERT" ? "ov-blink" : ""}`} id="ov-light-status">
          {envStatusValue(lightStatus)}
        </span>
        <div className="update-dot"></div>
      </div>
    </div>
  );
}
