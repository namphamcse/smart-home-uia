import type { DeviceControlHistory } from "../types/device";

export const formatTime = (time: string): string => {
  return new Date(time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const COLOR_LABELS: Record<string, string> = {
  "#FFFFFF": "White",
  "#FFF3CD": "Warm White",
  "#FACC15": "Yellow",
  "#2563EB": "Blue",
  "#EF4444": "Red",
  "#34D399": "Green",
};

export const formatAction = (deviceHistory: DeviceControlHistory): string => {
  switch (deviceHistory.action) {
    case "turn_on":
      return "Power ON";

    case "turn_off":
      return "Power OFF";

    case "set_speed":
      return `Speed set to ${capitalizeFirst(deviceHistory.value)}`;

    case "set_angle":
      return `Door ${deviceHistory.value === "90" ? "opened" : "closed"} (${deviceHistory.value}°)`;

    case "set_color": {
      const hex = deviceHistory.value.toUpperCase();
      const colorName = COLOR_LABELS[hex] ?? "Custom";
      return `Color → ${colorName} (${hex})`;
    }

    default:
      return "";
  }
};


export const capitalizeFirst = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export const envStatusValue = (value: string) : string => {
  if (value === "NORMAL")
    return "OK"
  if (value === "WARNING")
    return "WARN"
  return value
}