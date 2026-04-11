import MainEnvironment from "../components/environment/MainEnvironment";
import OverviewBar from "../components/environment/OverviewBar";
import HomeLayout from "../components/layout/HomeLayout";
import { useWS } from "../hooks/useWebSocket";
import type { DHT20Data, LightData } from "../types/device";

export default function Environment () {
    const tempData = useWS<DHT20Data>('/5');
    const humidityData = useWS<DHT20Data>('/5');
    const lightData = useWS<LightData>('/3');
    
    return (
        <HomeLayout headerName="Environment" sub="— Sensor Monitoring">
            <OverviewBar tempData={tempData} humidityData={humidityData} lightData={lightData}/>
            <MainEnvironment tempData={tempData} humidityData={humidityData} lightData={lightData}/>
        </HomeLayout>
    );
}