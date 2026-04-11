import type { DeviceType } from "../types/device";

export type FilterType = "all" | DeviceType;


export const filterItems: {
  value: FilterType;
  iconClass: string;
}[] = [
  { value: "all", iconClass: "fa-border-all" },
  { value: "light", iconClass: "fa-lightbulb" },
  { value: "fan", iconClass: "fa-fan" },
  { value: "camera", iconClass: "fa-video" },
  { value: "servo", iconClass: "fa-door-closed" },
  { value: "other", iconClass: "fa-plug" },
];

export const deviceTypeToIconClass: Record<FilterType, string> = {
  all: "fa-border-all",
  light: "fa-lightbulb",
  fan: "fa-fan",
  sensor: "fa-microchip",
  camera: "fa-video",
  servo: "fa-door-closed",
  other: "fa-plug",
};