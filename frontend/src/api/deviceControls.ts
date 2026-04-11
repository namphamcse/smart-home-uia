import axios from "axios";
import type { DeviceControlHistory } from "../types/device";

const API_URL = import.meta.env.VITE_API_URL;


export async function createDeviceControlHistory(
  deviceId: number,
  action: string,
  value: string | null,
) {
  const response = await axios.post<DeviceControlHistory>(
    `${API_URL}/device-controls`,
    {
      device_id: deviceId,
      action,
      value,
      source: "app",
    },
  );

  return response.data;
}