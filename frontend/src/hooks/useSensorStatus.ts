import { useEffect, useState } from 'react';
import { type Threshold } from '../types/alert';
const API_URL = import.meta.env.VITE_API_URL;

const THRESHOLDS_UPDATED_EVENT = 'thresholds-updated';

export function notifyThresholdsUpdated() {
  window.dispatchEvent(new Event(THRESHOLDS_UPDATED_EVENT));
}

export function useThreshold() {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const result = await fetch(`${API_URL}/alert-thresholds`);
        const data = await result.json();
        setThresholds(data);
      } catch (error) {
        console.error('Error fetching thresholds:', error);
      }
    };
    fetchThresholds();
    window.addEventListener(THRESHOLDS_UPDATED_EVENT, fetchThresholds);
    return () => window.removeEventListener(THRESHOLDS_UPDATED_EVENT, fetchThresholds);
  }, []);
  return thresholds;
}

export function getSensorStatus(thresholds: Threshold[], sensorId: number, value: number | undefined) {
  const sensorThreshold = thresholds.find(t => t.sensor_id === sensorId);
  if (!sensorThreshold || value == null || Number.isNaN(value) || !sensorThreshold.is_active) return 'NORMAL';

  if (value < sensorThreshold.min_threshold || value > sensorThreshold.max_threshold) {
    return 'ALERT';
  }

  return 'NORMAL';
}