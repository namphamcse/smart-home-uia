import type { AutomationRule, AutomationRuleCreate, AutomationRuleUpdate } from '../types/automation';
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

export const automationAPI = {
  async getAll(): Promise<AutomationRule[]> {
    try {
      const response = await fetch(`${API_URL}/automation-rules`, {
        headers: await buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch automation rules');
      return await response.json();
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      return [];
    }
  },

  async getById(id: number): Promise<AutomationRule | null> {
    try {
      const response = await fetch(`${API_URL}/automation-rules/${id}`, {
        headers: await buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to fetch automation rule');
      return await response.json();
    } catch (error) {
      console.error('Error fetching automation rule:', error);
      return null;
    }
  },

  async create(rule: AutomationRuleCreate): Promise<AutomationRule | null> {
    try {
      const response = await fetch(`${API_URL}/automation-rules`, {
        method: 'POST',
        headers: await buildHeaders(true),
        body: JSON.stringify(rule),
      });
      if (!response.ok) throw new Error('Failed to create automation rule');
      return await response.json();
    } catch (error) {
      console.error('Error creating automation rule:', error);
      return null;
    }
  },

  async update(id: number, rule: AutomationRuleUpdate): Promise<AutomationRule | null> {
    try {
      const response = await fetch(`${API_URL}/automation-rules/${id}`, {
        method: 'PUT',
        headers: await buildHeaders(true),
        body: JSON.stringify(rule),
      });
      if (!response.ok) throw new Error('Failed to update automation rule');
      return await response.json();
    } catch (error) {
      console.error('Error updating automation rule:', error);
      return null;
    }
  },

  async delete(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/automation-rules/${id}`, {
        method: 'DELETE',
        headers: await buildHeaders(),
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      return false;
    }
  },
};
