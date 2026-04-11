import { filterItems, type FilterType } from "../../constants/deviceFilters";
import type { Device } from "../../types/device";
import { capitalizeFirst } from "../../utils/formatters";


export type FilterBarProps = {
  devices: Device[];
  selectedFilter: FilterType;
  setSelectedFilter: React.Dispatch<React.SetStateAction<FilterType>>;
};

export default function FilterBar({
  devices,
  selectedFilter,
  setSelectedFilter,
}: FilterBarProps) {
  const getCount = (filter: FilterType) => {
    if (filter === "all") return devices.length;
    return devices.filter((d) => d.device_type === filter).length;
  };

  const onlineCount = devices.filter((d) => d.is_active).length;
  const offlineCount = devices.filter((d) => !d.is_active).length;

  return (
    <div className="filter-bar">
      <span className="filter-label">Filter:</span>

      {filterItems.map((item) => (
        <button
          key={item.value}
          className={`filter-btn ${selectedFilter === item.value ? "active" : ""}`}
          onClick={() => setSelectedFilter(item.value)}
        >
          <i className={`fa-solid ${item.iconClass}`}></i>{" "}
          {capitalizeFirst(item.value)}
          <span className="filter-count">{getCount(item.value)}</span>
        </button>
      ))}

      <div className="filter-spacer"></div>

      <div className="devices-summary">
        <div className="summary-pill online">
          <i className="fa-solid fa-circle-dot" style={{ fontSize: "8px" }}></i>{" "}
          {onlineCount} Online
        </div>

        <div className="summary-pill offline">
          <i className="fa-solid fa-circle" style={{ fontSize: "8px" }}></i>{" "}
          {offlineCount} Offline
        </div>
      </div>
    </div>
  );
}
