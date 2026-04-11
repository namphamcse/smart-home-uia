import { useEffect, useState } from 'react';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import './MainAutomation.css'
import SummaryRow from './SummaryRow'
import AutomationRuleList from './AutomationRuleList';
import ModalOverlay from './ModalOverlay';
import type { AutomationRule, AutomationRuleCreate, AutomationRuleUpdate } from '../../types/automation';
export default function MainAutomation() {
  const rules = useAutomationRules();
  const [displayedRules, setDisplayedRules] = useState(rules.rules);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all'); // 'all', 'sensor', 'schedule'
  const [filterStatus, setFilterStatus] = useState<string>('all'); // 'all', 'active', 'inactive'
  const [overlayType, setOverlayType] = useState<{ type: string, rule?: AutomationRule }>({ type: '', rule: undefined });

  const handleSaveRule = async (payload: AutomationRuleCreate | AutomationRuleUpdate) => {
    if (overlayType.rule?.automation_rule_id) {
      const updatedRule = await rules.updateRule(overlayType.rule.automation_rule_id, payload as AutomationRuleUpdate);
      if (!updatedRule) {
        throw new Error('Failed to update automation rule');
      }
      return;
    }

    const createdRule = await rules.createRule(payload as AutomationRuleCreate);
    if (!createdRule) {
      throw new Error('Failed to create automation rule');
    }
  };

  const handleDeleteRule = async () => {
    if (!overlayType.rule?.automation_rule_id) {
      throw new Error('Missing automation rule id');
    }

    const success = await rules.deleteRule(overlayType.rule.automation_rule_id);
    if (!success) {
      throw new Error('Failed to delete automation rule');
    }
  };

  useEffect(() => {
    if (filterType === 'all' && filterStatus === 'all' && searchTerm.trim() === '') {
      setDisplayedRules(rules.rules);
      return;
    }
    let filtered = rules.rules;
    if (filterType !== 'all') {
      filtered = filtered.filter(r => r.trigger_type === filterType);
    }
    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.is_active === (filterStatus === 'active'));
    }
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(r => r.automation_rule_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setDisplayedRules(filtered);

  }, [filterType, filterStatus, searchTerm, rules]);
  return (
    <div className="page-shell">
      <SummaryRow rules={rules.rules} />
      <div className="filter-bar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="search-input"
            id="search-input"
            placeholder="Search rules…"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-sep"></div>

        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--muted)'
          }}
        >Type:</span>
        <button onClick={() => setFilterType('all')} className={`filter-btn ${filterType === 'all' ? 'active' : ''}`} data-type="all">
          <i className="fa-solid fa-border-all"></i> All
        </button>
        <button onClick={() => setFilterType('sensor')} className={`filter-btn ${filterType === 'sensor' ? 'active' : ''}`} data-type="sensor">
          <i className="fa-solid fa-microchip"></i> Sensor
        </button>
        <button onClick={() => setFilterType('schedule')} className={`filter-btn ${filterType === 'schedule' ? 'active' : ''}`} data-type="schedule">
          <i className="fa-solid fa-clock"></i> Schedule
        </button>

        <div className="filter-sep"></div>

        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--muted)'
          }}
        >Status:</span>
        <button onClick={() => {filterStatus === 'active' ? setFilterStatus('all') : setFilterStatus('active')}} className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`} data-status="active">
          <i className="fa-solid fa-circle-play"></i> Active
        </button>
        <button onClick={() => {filterStatus === 'inactive' ? setFilterStatus('all') : setFilterStatus('inactive')}} className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`} data-status="inactive">
          <i className="fa-solid fa-circle-pause"></i> Inactive
        </button>

        <div className="filter-spacer"></div>

        <button className="btn-create-rule" id="btn-create-rule" onClick={() => setOverlayType({ type: 'edit' })}>
          <i className="fa-solid fa-plus"></i> New Rule
        </button>
      </div>

      <div className="auto-layout">
        <div className="rules-col">
          <div className="rules-head">
            <div className="rules-title">Automation Rules</div>
            <span className="rules-count" id="rules-count">{rules.rules.length} rules</span>
          </div>
          <div className="rules-list" id="rules-list">
            {displayedRules.map((r) => (
              <AutomationRuleList key={r.automation_rule_id} rule={r} setOverlayType={setOverlayType} />
            ))}
          </div>
          <div className="rules-empty" id="rules-empty">
            <i className="fa-solid fa-gears"></i>
            <p>No rules match your filter</p>
          </div>
        </div>

        <div className="log-col">
          <div className="log-head">
            <div className="log-title">Execution Log</div>
            <div className="log-filters">
              <select className="log-filter-select" id="log-rule-filter">
                <option value="all">All Rules</option>
              </select>
              <button className="log-filter-btn active" data-result="all">
                All
              </button>
              <button className="log-filter-btn" data-result="ok">OK</button>
              <button className="log-filter-btn" data-result="err">Fail</button>
            </div>
          </div>
          <div className="log-list" id="log-list">
            {/* <LogList></LogList> */}
          </div>
        </div>
      </div>
      <ModalOverlay
        overlayType={overlayType}
        setOverlayType={setOverlayType}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
      />
    </div>
  );
}