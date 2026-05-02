import { envStatusValue } from "../../utils/formatters";
import "./environment.css";

type EnvSensorCardProps = {
  active?: boolean;
  icon: string;
  label: string;
  onClick?: () => void;
  sensorKey: "temp" | "hum" | "light";
  themeClass: string;
  value: number | string | undefined;
  unit: string;
  status: string;
  minValue: number | string | undefined;
  maxValue: number | string | undefined;
};

export default function EnvSensorCard({
  active = false,
  icon,
  label,
  onClick,
  sensorKey,
  themeClass,
  value,
  unit,
  status,
  minValue,
  maxValue,
}: EnvSensorCardProps) {
  return (
    <div
      className={`scard ${themeClass} ${status === "ALERT" ? "alert-state" : ""} ${status === "WARNING" ? "warn-state" : ""} ${active ? "active" : ""}`}
      data-sensor={sensorKey}
      onClick={onClick}
    >
      <div className="scard-top">
        <div className="scard-icon">
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
          <div className="scard-name">{label}</div>
        </div>
      </div>

      <div className="scard-value-row">
        <span className="scard-value">
          {value ?? "N/A"}
        </span>
        <span className="scard-unit">{value != null ? unit : ""}</span>
      </div>

      <div className="scard-minmax">
        <div className="minmax-chip min-chip">
          <i className="fa-solid fa-arrow-down" style={{ fontSize: "7px" }}></i>{" "}
          MIN <span>{minValue ?? "N/A"}</span>
          {minValue != null ? unit : ""}
        </div>

        <span className="minmax-sep">/</span>

        <div className="minmax-chip max-chip">
          <i className="fa-solid fa-arrow-up" style={{ fontSize: "7px" }}></i>{" "}
          MAX <span>{maxValue ?? "N/A"}</span>
          {maxValue != null ? unit : ""}
        </div>

        <span className={`scard-badge ${status.toLowerCase()}`}>
          {envStatusValue(status)}
        </span>
      </div>
    </div>
  );
}
