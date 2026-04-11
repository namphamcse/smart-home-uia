import { useEffect, useState } from "react";
import FilterBar from "../components/devices/FilterBar";
import MainDevices from "../components/devices/MainDevices";
import HomeLayout from "../components/layout/HomeLayout";
import type {Device} from "../types/device";
import axios from "axios";
import type { FilterType } from "../constants/deviceFilters";
const API_URL = import.meta.env.VITE_API_URL;

export default function Devices() {  
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("all");
  const filteredDevices = selectedFilter == "all" ? devices : devices.filter((d) => d.device_type == selectedFilter)
  
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${API_URL}/devices`);        
        setDevices(response.data.filter((d : Device) => d.device_type !== "sensor"));
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchDevices();
  }, []);
  
  return (
    <HomeLayout headerName="Devices" sub="— Control & Manage">
      <FilterBar devices={devices} selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} />
      <MainDevices devices={filteredDevices} setDevices={setDevices} selectedFilter={selectedFilter}/>
    </HomeLayout>
  );
}
