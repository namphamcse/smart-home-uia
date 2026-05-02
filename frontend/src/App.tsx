import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./services/AuthProvider";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Automation from './pages/Automation';
import Management from './pages/Management';
import ProtectedRoute from "./services/ProtectedRoute";
import NotiProvider from "./services/NotiProvider";
import ToastNoti from "./components/ui/ToastNoti";
import Register from "./pages/Register";
import Devices from "./pages/Devices";
import Environment from "./pages/Environment";
import Notifications from "./pages/Notifications";
import Layout from './pages/Layout';
import Security from "./pages/Security";
export default function App() {
  return (
    <BrowserRouter>
      <NotiProvider>
        <ToastNoti /> {/* Global notification component */}
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />}/>
            {/* Protected */}
            <Route element={<ProtectedRoute />}>
<<<<<<< HEAD
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              {/*Placeholder for future routes */}
              <Route path="/devices" element={<Devices />} />
              <Route path="/environment" element={<Environment />} />
              <Route path="/security" element={<Security />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/automation" element={<Dashboard />} />
              <Route path="/management" element={<Dashboard />} />
=======
>>>>>>> upstream/main
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="devices" element={<Devices />} />
                <Route path="environment" element={<Environment />} />
                <Route path="security" element={<Dashboard />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="automation" element={<Automation />} />
                <Route path="management" element={<Management />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </NotiProvider>
    </BrowserRouter>
  );
}
