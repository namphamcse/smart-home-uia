import { useState, useEffect } from 'react';
import type { AutomationRule, AutomationRuleCreate, AutomationRuleUpdate } from '../types/automation';
import { automationAPI } from '../services/automationAPI';

export function useAutomationRules() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    setLoading(true);
    const data = await automationAPI.getAll();
    setRules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const createRule = async (rule: AutomationRuleCreate) => {
    const newRule = await automationAPI.create(rule);
    if (newRule) {
      setRules([...rules, newRule]);
      return newRule;
    }
    return null;
  };

  const updateRule = async (id: number, updates: AutomationRuleUpdate) => {
    const updatedRule = await automationAPI.update(id, updates);
    if (updatedRule) {
      setRules(rules.map(r => r.automation_rule_id === id ? updatedRule : r));
      return updatedRule;
    }
    return null;
  };

  const deleteRule = async (id: number) => {
    const success = await automationAPI.delete(id);
    if (success) {
      setRules(rules.filter(r => r.automation_rule_id !== id));
    }
    return success;
  };

  return {
    rules,
    loading,
    createRule,
    updateRule,
    deleteRule,
    refetch: fetchRules,
  };
}
