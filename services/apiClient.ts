// src/services/apiClient.ts
// API client dùng chung cho toàn bộ frontend

import { Device, DeviceLog, AdminUser } from "../types";

// Đọc base URL từ biến môi trường Vite
// - Dev:   VITE_API_BASE = http://10.200.2.29:5000
// - Prod:  VITE_API_BASE = ""  (deploy chung với backend)
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const CURRENT_USER_KEY = "currentUser";

type CurrentUser = { username: string; role: string };

function saveCurrentUser(user: CurrentUser | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

function getCurrentUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentUser;
  } catch {
    return null;
  }
}

// ===== Auth =====
async function login(username: string, password: string): Promise<CurrentUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Login failed");
  }

  const data = (await res.json()) as { username: string; role: string };
  const user = { username: data.username, role: data.role };
  saveCurrentUser(user);
  return user;
}

function logout() {
  saveCurrentUser(null);
}

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

// ----- 8) Quan ly admin users -----
async function getUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE}/api/adminusers`, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "getUsers failed");
  }
  return res.json();
}

async function createUser(username: string, role: string, password: string) {
  const res = await fetch(`${API_BASE}/api/adminusers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, role, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "createUser failed");
  }
}

async function updateUser(id: number, data: { role?: string; password?: string }) {
  const res = await fetch(`${API_BASE}/api/adminusers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "updateUser failed");
  }
}

async function deleteUser(id: number) {
  const res = await fetch(`${API_BASE}/api/adminusers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "deleteUser failed");
  }
}

// ==== Export object api cho cac page dung y nhu mockBackend ====
export const api = {
  login,
  logout,
  getCurrentUser,

  getAuthModeBySerial,
  getAllDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
  getLogs,

  getUsers,
  createUser,
  updateUser,
  deleteUser,
};

// Export ham le de import truc tiep
export {
  getAllDevices,
  deleteDevice,
  login,
  logout,
  getCurrentUser,
  getUsers,
  createUser,
  updateUser,
  deleteUser,
};
