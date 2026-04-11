import { Outlet, useLocation } from 'react-router-dom';
import HomeLayout from '../components/layout/HomeLayout';
import StatusBar from '../components/dashboard/StatusBar';

export default function Layout() {
  const location = useLocation();

  const getHeaderName = () => {
    return location.pathname.split('/')[1]?.toUpperCase() || 'Dashboard';
  }
  return (
    <HomeLayout headerName={getHeaderName()}>
      <Outlet />
      <StatusBar />
    </HomeLayout>
  );
}