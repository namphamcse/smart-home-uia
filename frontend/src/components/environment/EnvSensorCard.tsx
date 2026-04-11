import { envStatusValue } from "../../utils/formatters";
import "./environment.css";

type EnvSensorCardProps = {
  icon: string;
  label: string;
  value: number | string | undefined;
  unit: string;
  status: string;
  minValue: number | string | undefined;
  maxValue: number | string | undefined;
};

export default function EnvSensorCard({
  icon,
  label,
  value,
  unit,
  status,
  minValue,
  maxValue,
}: EnvSensorCardProps) {
  return (
    <div
      className={`scard temp-card ${status.toLowerCase()}-state active`}
      data-sensor="temp"
      id="scard-temp"
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
        <span className="scard-value" id="sc-temp-val">
          {value ?? "N/A"}
        </span>
        <span className="scard-unit">{value != null ? unit : ""}</span>
      </div>

      <div className="scard-minmax">
        <div className="minmax-chip min-chip">
          <i className="fa-solid fa-arrow-down" style={{ fontSize: "7px" }}></i>{" "}
          MIN <span id="sc-temp-min">{minValue ?? "N/A"}</span>
          {minValue != null ? unit : ""}
        </div>

        <span className="minmax-sep">/</span>

        <div className="minmax-chip max-chip">
          <i className="fa-solid fa-arrow-up" style={{ fontSize: "7px" }}></i>{" "}
          MAX <span id="sc-temp-max">{maxValue ?? "N/A"}</span>
          {maxValue != null ? unit : ""}
        </div>

        <span
          className={`scard-badge ${status.toLowerCase()}`}
          id="sc-temp-badge"
        >
          {envStatusValue(status)}
        </span>
      </div>
    </div>
  );
}
