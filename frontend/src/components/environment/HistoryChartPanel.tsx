import { useEffect, useMemo, useRef, useState } from "react";
import { useNoti } from "../../services/NotiProvider";
import type { Threshold } from "../../types/alert";

export type SensorKey = "temp" | "hum" | "light";
type RangeKey = "1h" | "6h" | "24h" | "7d";

export interface HistoryPoint {
  t: number;
  v: number;
}

export interface EnvironmentSensorInfo {
  key: SensorKey;
  label: string;
  unit: string;
  color: string;
  sensorId: number | null;
}

interface HistoryChartPanelProps {
  activeSensor: SensorKey;
  historyByKey: Record<SensorKey, HistoryPoint[]>;
  historyError: string | null;
  historyLoading: boolean;
  onSelectSensor: (sensor: SensorKey) => void;
  sensorInfoByKey: Record<SensorKey, EnvironmentSensorInfo>;
  thresholds: Threshold[];
}

const RANGE_MS: Record<RangeKey, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

const RANGE_LABELS: Record<RangeKey, string> = {
  "1h": "1H",
  "6h": "6H",
  "24h": "24H",
  "7d": "7D",
};

const SENSOR_TAB_LABELS: Record<SensorKey, string> = {
  temp: "Temp",
  hum: "Humidity",
  light: "Light",
};

function formatNumber(value: number, sensorKey: SensorKey) {
  return sensorKey === "light" ? Math.round(value).toString() : value.toFixed(1);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HistoryChartPanel({
  activeSensor,
  historyByKey,
  historyError,
  historyLoading,
  onSelectSensor,
  sensorInfoByKey,
  thresholds,
}: HistoryChartPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [activeRange, setActiveRange] = useState<RangeKey>("1h");
  const { setNotification } = useNoti();

  const sensorInfo = sensorInfoByKey[activeSensor];
  const historyPoints = historyByKey[activeSensor];
  const threshold =
    thresholds.find((item) => item.sensor_id === sensorInfo.sensorId) ?? null;

  const filteredData = useMemo(() => {
    const cutoff = Date.now() - RANGE_MS[activeRange];
    const data = historyPoints.filter((point) => point.t >= cutoff);

    if (data.length >= 2) {
      return data;
    }

    return historyPoints.slice(-Math.max(2, historyPoints.length));
  }, [activeRange, historyPoints]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;

    if (!canvas || !wrap) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const render = () => {
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      if (historyLoading && filteredData.length < 2) {
        context.fillStyle = "#666666";
        context.font = "600 13px Inter";
        context.textAlign = "center";
        context.fillText("Loading chart data...", width / 2, height / 2);
        return;
      }

      if (historyError && filteredData.length < 2) {
        context.fillStyle = "#ef4444";
        context.font = "600 13px Inter";
        context.textAlign = "center";
        context.fillText(historyError, width / 2, height / 2);
        return;
      }

      if (filteredData.length < 2) {
        context.fillStyle = "#666666";
        context.font = "600 13px Inter";
        context.textAlign = "center";
        context.fillText("Collecting sensor history...", width / 2, height / 2);
        return;
      }

      const padding = { top: 16, right: 18, bottom: 30, left: 50 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const times = filteredData.map((point) => point.t);
      const values = filteredData.map((point) => point.v);
      const alertMin = threshold?.is_active ? threshold.min_threshold : null;
      const alertMax = threshold?.is_active ? threshold.max_threshold : null;
      const warningLow =
        alertMin != null && alertMax != null
          ? alertMin + (alertMax - alertMin) * 0.15
          : null;
      const warningHigh =
        alertMin != null && alertMax != null
          ? alertMax - (alertMax - alertMin) * 0.15
          : null;

      const scaleValues = [
        ...values,
        ...(alertMin != null ? [alertMin] : []),
        ...(alertMax != null ? [alertMax] : []),
        ...(warningLow != null ? [warningLow] : []),
        ...(warningHigh != null ? [warningHigh] : []),
      ];

      let yMin = Math.min(...scaleValues);
      let yMax = Math.max(...scaleValues);
      if (yMin === yMax) {
        yMin -= 1;
        yMax += 1;
      }

      const yPadding = (yMax - yMin) * 0.15;
      yMin -= yPadding;
      yMax += yPadding;

      const xMin = Math.min(...times);
      const xMax = Math.max(...times);
      const xRange = Math.max(xMax - xMin, 1);
      const yRange = Math.max(yMax - yMin, 1);
      const tx = (time: number) => padding.left + ((time - xMin) / xRange) * plotWidth;
      const ty = (value: number) =>
        padding.top + (1 - (value - yMin) / yRange) * plotHeight;

      context.strokeStyle = "#e5e5e0";
      context.lineWidth = 1;
      context.textAlign = "right";
      context.font = "600 10px Inter";
      context.fillStyle = "#666666";
      for (let index = 0; index <= 5; index += 1) {
        const y = padding.top + (plotHeight / 5) * index;
        const value = yMax - (yRange / 5) * index;
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(padding.left + plotWidth, y);
        context.stroke();
        context.fillText(formatNumber(value, activeSensor), padding.left - 6, y + 3);
      }

      context.textAlign = "center";
      for (let index = 0; index <= 5; index += 1) {
        const time = xMin + (xRange / 5) * index;
        const x = padding.left + (plotWidth / 5) * index;
        const labelDate = new Date(time);
        const label =
          activeRange === "7d"
            ? labelDate.toLocaleDateString([], { month: "short", day: "numeric" })
            : labelDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
        context.fillStyle = "#666666";
        context.fillText(label, x, height - 10);
      }

      const drawThresholdLine = (
        value: number,
        strokeStyle: string,
        label: string,
        labelAlign: CanvasTextAlign,
      ) => {
        const y = ty(value);
        context.save();
        context.strokeStyle = strokeStyle;
        context.lineWidth = 1.5;
        context.setLineDash([6, 4]);
        context.beginPath();
        context.moveTo(padding.left, y);
        context.lineTo(padding.left + plotWidth, y);
        context.stroke();
        context.fillStyle = strokeStyle;
        context.font = "700 9px Space Grotesk";
        context.textAlign = labelAlign;
        context.fillText(
          label,
          labelAlign === "left" ? padding.left + 4 : padding.left + plotWidth - 4,
          y - 4,
        );
        context.restore();
      };

      if (warningLow != null && warningHigh != null) {
        drawThresholdLine(warningLow, "#f97316", `WARN ${formatNumber(warningLow, activeSensor)}`, "left");
        drawThresholdLine(warningHigh, "#f97316", `WARN ${formatNumber(warningHigh, activeSensor)}`, "right");
      }

      if (alertMin != null && alertMax != null) {
        drawThresholdLine(alertMin, "#ef4444", `ALERT ${formatNumber(alertMin, activeSensor)}`, "left");
        drawThresholdLine(alertMax, "#ef4444", `ALERT ${formatNumber(alertMax, activeSensor)}`, "right");
      }

      const gradient = context.createLinearGradient(0, padding.top, 0, padding.top + plotHeight);
      gradient.addColorStop(0, `${sensorInfo.color}33`);
      gradient.addColorStop(1, `${sensorInfo.color}00`);

      context.beginPath();
      filteredData.forEach((point, index) => {
        const x = tx(point.t);
        const y = ty(point.v);
        if (index === 0) {
          context.moveTo(x, y);
          return;
        }
        context.lineTo(x, y);
      });
      context.lineTo(tx(filteredData[filteredData.length - 1].t), padding.top + plotHeight);
      context.lineTo(tx(filteredData[0].t), padding.top + plotHeight);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();

      context.save();
      context.strokeStyle = sensorInfo.color;
      context.lineWidth = 2.5;
      context.lineJoin = "round";
      context.shadowColor = `${sensorInfo.color}55`;
      context.shadowBlur = 4;
      context.beginPath();
      filteredData.forEach((point, index) => {
        const x = tx(point.t);
        const y = ty(point.v);
        if (index === 0) {
          context.moveTo(x, y);
          return;
        }
        context.lineTo(x, y);
      });
      context.stroke();
      context.restore();

      const lastPoint = filteredData[filteredData.length - 1];
      const lastX = tx(lastPoint.t);
      const lastY = ty(lastPoint.v);
      context.beginPath();
      context.arc(lastX, lastY, 5, 0, Math.PI * 2);
      context.fillStyle = "#ffffff";
      context.strokeStyle = sensorInfo.color;
      context.lineWidth = 2.5;
      context.fill();
      context.stroke();

      context.fillStyle = sensorInfo.color;
      context.font = "700 11px Space Grotesk";
      context.textAlign = "center";
      context.fillText(
        `${formatNumber(lastPoint.v, activeSensor)} ${sensorInfo.unit}`,
        lastX,
        lastY - 12,
      );

      context.strokeStyle = "#000000";
      context.lineWidth = 1.5;
      context.setLineDash([]);
      context.strokeRect(padding.left, padding.top, plotWidth, plotHeight);
    };

    render();

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(wrap);
    return () => resizeObserver.disconnect();
  }, [
    activeRange,
    activeSensor,
    filteredData,
    historyError,
    historyLoading,
    sensorInfo.color,
    sensorInfo.unit,
    threshold,
  ]);

  const handleExportCsv = () => {
    if (filteredData.length === 0) {
      setNotification("No chart data to export");
      return;
    }

    const rows = [
      ["timestamp", "sensor", "value", "unit"].join(","),
      ...filteredData.map((point) =>
        [
          new Date(point.t).toISOString(),
          sensorInfo.label,
          formatNumber(point.v, activeSensor),
          sensorInfo.unit,
        ].join(","),
      ),
    ];

    downloadBlob(
      new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
      `${activeSensor}_${activeRange}_${Date.now()}.csv`,
    );
    setNotification(`Exported ${filteredData.length} chart points to CSV`);
  };

  const handleExportPdf = () => {
    const canvas = canvasRef.current;

    if (!canvas) {
      setNotification("Chart is not ready yet");
      return;
    }

    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      setNotification("Popup blocked while preparing the PDF view");
      return;
    }

    const image = canvas.toDataURL("image/png");
    popup.document.write(`
      <html>
        <head>
          <title>${sensorInfo.label} Chart</title>
          <style>
            body { font-family: Inter, sans-serif; margin: 24px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 8px; }
            p { margin: 0 0 18px; color: #4b5563; }
            img { width: 100%; border: 3px solid #000; box-shadow: 4px 4px 0 #000; }
          </style>
        </head>
        <body>
          <h1>${sensorInfo.label} History</h1>
          <p>Range: ${RANGE_LABELS[activeRange]} | Exported at ${new Date().toLocaleString()}</p>
          <img src="${image}" alt="${sensorInfo.label} chart" />
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
    setNotification("Opened a printable PDF view for the chart");
  };

  return (
    <div className="chart-panel">
      <div className="chart-controls">
        <div className="chart-sensor-tabs">
          {(["temp", "hum", "light"] as SensorKey[]).map((sensorKey) => (
            <button
              key={sensorKey}
              className={`cs-tab ${sensorKey}-tab ${activeSensor === sensorKey ? "active" : ""}`}
              onClick={() => onSelectSensor(sensorKey)}
              type="button"
            >
              {SENSOR_TAB_LABELS[sensorKey]}
            </button>
          ))}
        </div>

        <div className="time-tabs">
          {(Object.keys(RANGE_LABELS) as RangeKey[]).map((range) => (
            <button
              key={range}
              className={`t-tab ${activeRange === range ? "active" : ""}`}
              onClick={() => setActiveRange(range)}
              type="button"
            >
              {RANGE_LABELS[range]}
            </button>
          ))}
        </div>

        <button className="btn-export" onClick={handleExportCsv} type="button">
          <i className="fa-solid fa-file-csv"></i> CSV
        </button>
        <button
          className="btn-export"
          onClick={handleExportPdf}
          style={{ borderColor: "var(--border)" }}
          type="button"
        >
          <i className="fa-solid fa-file-pdf"></i> PDF
        </button>
      </div>

      <div className="chart-canvas-wrap" ref={wrapRef}>
        <canvas id="sensor-chart" ref={canvasRef}></canvas>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <div className="legend-line data-line" style={{ background: sensorInfo.color }}></div>
          <span>
            {sensorInfo.label} ({sensorInfo.unit})
          </span>
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
  );
}
