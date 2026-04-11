import type { Device, DeviceCreate, DeviceUpdate } from '../types/device';
import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL;

async function buildHeaders(includeJson = false): Promise<Record<string, string>> {
  const headers: Record<string, string> = includeJson ? { 'Content-Type': 'application/json' } : {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export const managementAPI = {
  async getAll(): Promise<Device[]> {
    try {
      const response = await fetch(`${API_URL}/devices`, {
        headers: await buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch devices');
      return await response.json();
    } catch (error) {
      console.error('Error fetching devices:', error);
      return [];
    }
  },

  async getById(id: number): Promise<Device | null> {
    try {
      const response = await fetch(`${API_URL}/devices/${id}`, {
        headers: await buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch device');
      return await response.json();
    } catch (error) {
      console.error('Error fetching device:', error);
      return null;
    }
  },

  async create(device: DeviceCreate): Promise<Device | null> {
    try {
            console.log('Update response:', JSON.stringify(device));

      const response = await fetch(`${API_URL}/devices`, {
        method: 'POST',
        headers: await buildHeaders(true),
        body: JSON.stringify(device),
      });
      if (!response.ok) throw new Error('Failed to create device');
      return await response.json();
    } catch (error) {
      console.error('Error creating device:', error);
      return null;
    }
  },

  async update(id: number, device: DeviceUpdate): Promise<Device | null> {
    try {
      const response = await fetch(`${API_URL}/devices/${id}`, {
        method: 'PUT',
        headers: await buildHeaders(true),
        body: JSON.stringify(device),
      });
      if (!response.ok) throw new Error('Failed to update device');
      return await response.json();
    } catch (error) {
      console.error('Error updating device:', error);
      return null;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/devices/${id}`, {
        method: 'DELETE',
        headers: await buildHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting device:', error);
      return false;
    }
  },
};