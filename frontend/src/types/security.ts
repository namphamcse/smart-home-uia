import type { Alert } from "./alert";
import type { Device, DeviceUpdate } from "./device";

export interface Sensor {
  sensor_id: number;
  device_id: number;
  sensor_type: "temperature" | "humidity" | "motion" | "light";
  unit: string;
  min_valid: number;
  max_valid: number;
}

export interface SensorLog {
  sensor_log_id: number;
  sensor_id: number;
  value: number;
  is_valid: boolean;
  recorded_at: string;
}

export interface SecurityOverview {
  alerts: Alert[];
  devices: Device[];
  sensorLogs: SensorLog[];
  sensors: Sensor[];
}

export interface SecurityAlertCreate {
  device_id?: number | null;
  title: string;
  description: string;
  notification_type: "alert" | "intrusion" | "device" | "system" | "error";
  severity: "low" | "medium" | "high";
  is_read?: boolean;
}

export type SecurityDeviceUpdate = Partial<DeviceUpdate>;

export interface SecurityClip {
  id: string;
  createdAt: string;
  durationLabel: string;
  name: string;
  playable: boolean;
  sizeLabel: string;
  source: "backend" | "local";
  url?: string;
}
