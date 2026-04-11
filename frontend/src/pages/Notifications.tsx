import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import MainNotifications from "../components/notifications/MainNotifications";
import NotiFilterBar from "../components/notifications/NotiFilterBar";
import Overlay from "../components/notifications/Overlay";
import { useDevices } from "../hooks/useDevices";
import type { Alert } from "../types/alert";
import { useNoti } from "../services/NotiProvider";

const API_URL = import.meta.env.VITE_API_URL;
const PAGE_SIZE = 10;

type NotificationType = "all" | "alert" | "intrusion" | "device" | "system";
type ReadFilter = "all" | "read" | "unread";

export default function Notifications() {
  const devices = useDevices();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [typeFilter, setTypeFilter] = useState<NotificationType>("all");
  const [readFilter, setReadFilter] = useState<ReadFilter>("all");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const deviceNames = useMemo(
    () => Object.fromEntries(devices.map((device) => [device.device_id, device.device_name])),
    [devices]
  );

  const fetchAlerts = async () => {
    try {
      const response = await axios.get<Alert[]>(`${API_URL}/notifications`);
      setAlerts(response.data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    void fetchAlerts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [typeFilter, readFilter]);

  const filterCounts = useMemo(
    () => ({
      all: alerts.length,
      alert: alerts.filter((alert) => alert.notification_type === "alert").length,
      intrusion: alerts.filter((alert) => alert.notification_type === "intrusion").length,
      device: alerts.filter((alert) => alert.notification_type === "device").length,
      system: alerts.filter((alert) => alert.notification_type === "system").length,
    }),
    [alerts]
  );

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const matchesType = typeFilter === "all" || alert.notification_type === typeFilter;
      const matchesRead =
        readFilter === "all" ||
        (readFilter === "read" && alert.is_read) ||
        (readFilter === "unread" && !alert.is_read);
      return matchesType && matchesRead;
    });
  }, [alerts, readFilter, typeFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredAlerts.length / PAGE_SIZE));
  const currentAlerts = filteredAlerts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const allVisibleSelected = currentAlerts.length > 0 && currentAlerts.every((alert) => selectedIds.includes(alert.notification_id));
  const bulkActive = selectedIds.length > 0;
  const { setNotification } = useNoti();
  const updateAlertLocally = (updated: Alert) => {
    setAlerts((prev) => prev.map((alert) => (alert.notification_id === updated.notification_id ? updated : alert)));
  };

  const markAsRead = async (alertId: number) => {
    const alert = alerts.find((item) => item.notification_id === alertId);
    if (!alert || alert.is_read) return;

    setIsSaving(true);
    try {
      const response = await axios.put<Alert>(`${API_URL}/notifications/${alertId}`, { is_read: true });
      updateAlertLocally(response.data);
      setNotification("Marked as read")
    } catch (error) {
      setNotification("Failed to mark notification as read")
      console.error("Failed to mark notification as read:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteNotifications = async (ids: number[]) => {
    if (!ids.length) return;
    setIsSaving(true);
    try {
      await Promise.all(ids.map((id) => axios.delete(`${API_URL}/notifications/${id}`)));
      setAlerts((prev) => prev.filter((alert) => !ids.includes(alert.notification_id)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } catch (error) {
      console.error("Failed to delete notifications:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSelect = (notificationId: number) => {
    setSelectedIds((prev) =>
      prev.includes(notificationId) ? prev.filter((id) => id !== notificationId) : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentAlerts.some((alert) => alert.notification_id === id)));
      return;
    }
    setSelectedIds((prev) => [...new Set([...prev, ...currentAlerts.map((alert) => alert.notification_id)])]);
  };

  const handleMarkSelectedRead = async () => {
    const unreadSelection = selectedIds.filter((id) => alerts.some((alert) => alert.notification_id === id && !alert.is_read));
    if (!unreadSelection.length) return;

    setIsSaving(true);
    try {
      await Promise.all(unreadSelection.map((id) => axios.put(`${API_URL}/notifications/${id}`, { is_read: true })));
      setAlerts((prev) => prev.map((alert) => (selectedIds.includes(alert.notification_id) ? { ...alert, is_read: true } : alert)));
      setSelectedIds([]);
    } catch (error) {
      console.error("Failed to mark selected notifications as read:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSelected = async () => {
    await deleteNotifications(selectedIds);
  };

  const handleOpenModal = async (alert: Alert) => {
    setActiveAlert(alert);
    if (!alert.is_read) {
      await markAsRead(alert.notification_id);
    }
  };

  const handleCloseModal = () => {
    setActiveAlert(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const pageSummary = useMemo(() => {
    const total = filteredAlerts.length;
    if (!total) return "Showing 0 of 0";
    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, total);
    return `Showing ${start}–${end} of ${total}`;
  }, [currentPage, filteredAlerts.length]);

  return (
    <>
      <NotiFilterBar
        activeType={typeFilter}
        activeRead={readFilter}
        counts={filterCounts}
        onTypeChange={setTypeFilter}
        onReadChange={setReadFilter}
      />
      <MainNotifications
        alerts={currentAlerts}
        selectedIds={selectedIds}
        allVisibleSelected={allVisibleSelected}
        bulkActive={bulkActive}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        onMarkSelectedRead={handleMarkSelectedRead}
        onDeleteSelected={handleDeleteSelected}
        onOpenModal={handleOpenModal}
        onMarkRead={markAsRead}
        currentPage={currentPage}
        pageCount={pageCount}
        onPageChange={handlePageChange}
        onPrevPage={() => handlePageChange(Math.max(1, currentPage - 1))}
        onNextPage={() => handlePageChange(Math.min(pageCount, currentPage + 1))}
        onLoadMore={() => handlePageChange(Math.min(pageCount, currentPage + 1))}
        pageSummary={pageSummary}
        isSaving={isSaving}
        deviceNames={deviceNames}
      />
      <Overlay alert={activeAlert} isOpen={Boolean(activeAlert)} onClose={handleCloseModal} deviceNames={deviceNames} />
    </>
  );
}
