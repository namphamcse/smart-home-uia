export default function LogManagement() {
  return (
    <div className="tab-panel" id="tab-syslog">
      <div className="toolbar">
        <div className="search-wrap">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            className="search-input"
            id="log-search"
            placeholder="Search log…"
          />
        </div>

        <div className="tb-sep"></div>

        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '9px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            color: 'var(--muted)'
          }}
        >Event:</span>
        <button className="filter-btn active" data-ltype="all">All</button>
        <button className="filter-btn" data-ltype="connection">
          Connection
        </button>
        <button className="filter-btn" data-ltype="error">Error</button>
        <button className="filter-btn" data-ltype="command">Command</button>
        <button className="filter-btn" data-ltype="restart">Restart</button>

        <div className="tb-sep"></div>

        <select className="log-select" id="log-device-filter">
          <option value="all">All Devices</option>
        </select>

        <input
          type="date"
          className="date-input"
          id="log-date-from"
          title="From date"
        />
        <span
          style={{
            fontFamily: 'var(--font-head)',
            fontSize: '10px',
            fontWeight: 700,
            color: 'var(--muted)'
          }}
        >—</span>
        <input
          type="date"
          className="date-input"
          id="log-date-to"
          title="To date"
        />

        <div className="tb-spacer"></div>

        <button className="btn-secondary" id="btn-export-log">
          <i className="fa-solid fa-file-csv"></i> Export CSV
        </button>
      </div>

      <div className="table-wrap">
        <table id="log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>Device</th>
              <th>User</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody id="log-tbody"></tbody>
        </table>
      </div>
    </div>
  )
}