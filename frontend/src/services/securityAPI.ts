import { supabase } from "./supabase";
import type { Alert } from "../types/alert";
import type { Device } from "../types/device";
import type {
  SecurityAlertCreate,
  SecurityDeviceUpdate,
  SecurityOverview,
  Sensor,
  SensorLog,
} from "../types/security";

const API_URL = import.meta.env.VITE_API_URL;

async function buildHeaders(includeJson = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = includeJson
    ? { "Content-Type": "application/json" }
    : {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function fetchCollection<T>(path: string): Promise<T[]> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: await buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${path}`);
    }

    return (await response.json()) as T[];
  } catch (error) {
    console.error(`Error fetching ${path}:`, error);
    return [];
  }
}

export const securityAPI = {
  async getOverview(): Promise<SecurityOverview> {
    const [alerts, devices, sensorLogs, sensors] = await Promise.all([
      fetchCollection<Alert>("/notifications"),
      fetchCollection<Device>("/devices"),
      fetchCollection<SensorLog>("/sensor_logs"),
      fetchCollection<Sensor>("/sensors"),
    ]);

    return {
      alerts,
      devices,
      sensorLogs,
      sensors,
    };
  },

  async updateDevice(deviceId: number, payload: SecurityDeviceUpdate): Promise<Device | null> {
    try {
      const response = await fetch(`${API_URL}/devices/${deviceId}`, {
        method: "PUT",
        headers: await buildHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to update device");
      }

      return (await response.json()) as Device;
    } catch (error) {
      console.error("Error updating security device:", error);
      return null;
    }
  },

  async markAlertRead(notificationId: number, isRead = true): Promise<Alert | null> {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
        method: "PUT",
        headers: await buildHeaders(true),
        body: JSON.stringify({ is_read: isRead }),
      });

      if (!response.ok) {
        throw new Error("Failed to update alert");
      }

      return (await response.json()) as Alert;
    } catch (error) {
      console.error("Error updating alert:", error);
      return null;
    }
  },

  async createAlert(payload: SecurityAlertCreate): Promise<Alert | null> {
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: "POST",
        headers: await buildHeaders(true),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      return (await response.json()) as Alert;
    } catch (error) {
      console.error("Error creating security alert:", error);
      return null;
    }
  },
};
