// src/services/apiClient.ts
// API client dùng chung cho toàn bộ frontend

import { Device, DeviceLog } from "../types";

// Đọc base URL từ biến môi trường Vite
// - Dev:   VITE_API_BASE = http://10.200.2.29:5000
// - Prod:  VITE_API_BASE = ""  (deploy chung với backend)
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");

// ==== Kiểu trả về cho API getAuthMode (BodyCamera cũng dùng) ====
export type AuthModeResponse = {
  authMode: number;
  deviceName: string;
  isActive: boolean;
};

// ----- 1) BodyCamera & UI: Lấy AuthMode theo serialNo -----
async function getAuthModeBySerial(serialNo: string): Promise<AuthModeResponse> {
  const res = await fetch(`${API_BASE}/api/device/getAuthMode`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ serialNo }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getAuthMode error ${res.status}: ${text}`);
  }

  return res.json();
}

// ----- 2) Lấy danh sách toàn bộ device (cho DeviceList) -----
async function getAllDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/api/device`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getAllDevices error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Map từ DB → kiểu Device trên frontend
  return (json as any[]).map((d) => ({
    serialNo: d.serialNo,
    deviceName: d.deviceName,
    authMode: d.authMode,
    isActive: d.isActive,
    lastUpdated: d.updatedAt ?? d.createdAt ?? "",
  }));
}

// ----- 3) Lấy thông tin 1 device theo serialNo (cho DeviceEdit) -----
async function getDevice(serialNo: string): Promise<Device | undefined> {
  // Tạm thời: lấy toàn bộ rồi filter (số lượng thiết bị không nhiều nên OK)
  const list = await getAllDevices();
  return list.find((d) => d.serialNo === serialNo);
}

// ----- 4) Tạo mới device (từ màn DeviceEdit khi create) -----
async function createDevice(
  data: Omit<Device, "lastUpdated">
): Promise<Device> {
  const res = await fetch(`${API_BASE}/api/device`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      serialNo: data.serialNo,
      deviceName: data.deviceName,
      authMode: data.authMode,
      isActive: data.isActive,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`createDevice error ${res.status}: ${text}`);
  }

  const d = await res.json();

  return {
    serialNo: d.serialNo,
    deviceName: d.deviceName,
    authMode: d.authMode,
    isActive: d.isActive,
    lastUpdated: d.updatedAt ?? d.createdAt ?? "",
  };
}

// ----- 5) Update device (DeviceEdit – chế độ edit) -----
async function updateDevice(
  serialNo: string,
  data: Partial<Device>
): Promise<Device> {
  // body gửi lên phải đúng với model C# Device
  const payload = {
    serialNo,
    deviceName: data.deviceName,
    authMode: data.authMode,
    isActive: data.isActive,
  };

  const res = await fetch(
    `${API_BASE}/api/device/${encodeURIComponent(serialNo)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`updateDevice error ${res.status}: ${text}`);
  }

  const d = await res.json();

  return {
    serialNo: d.serialNo,
    deviceName: d.deviceName,
    authMode: d.authMode,
    isActive: d.isActive,
    lastUpdated: d.updatedAt ?? d.createdAt ?? "",
  };
}

// ----- 6) Xóa device (nếu backend có DELETE /api/device/{serialNo}) -----
async function deleteDevice(serialNo: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/device/${encodeURIComponent(serialNo)}`,
    {
      method: "DELETE",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`deleteDevice error ${res.status}: ${text}`);
  }
}

// ----- 7) Lấy log thay đổi thiết bị (DeviceLogs) -----
async function getLogs(serialNo: string): Promise<DeviceLog[]> {
  const res = await fetch(
    `${API_BASE}/api/device/logs/${encodeURIComponent(serialNo)}`,
    {
      method: "GET",
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getLogs error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Map từ DB DeviceLog (SerialNo, Action, CreatedAt, ...) → DeviceLog frontend
  return (json as any[]).map((log) => ({
    id: log.id ?? 0,
    serialNo: log.serialNo ?? "",
    changeType: log.action ?? "",
    changeDetails: log.action ?? "",
    timestamp: log.createdAt ?? "",
    adminUser: "system",
  }));
}

// ==== Export object api cho các page dùng y như mockBackend ====
export const api = {
  getAuthModeBySerial,
  getAllDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getLogs,
};

// Export hàm lẻ để import trực tiếp
export { getAllDevices, deleteDevice };
