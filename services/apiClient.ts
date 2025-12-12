// src/services/apiClient.ts
// API client dﾃｹng chung cho toﾃn b盻・frontend

import { Device, DeviceLog, AdminUser } from "../types";

// ﾄ雪ｻ皇 base URL t盻ｫ bi蘯ｿn mﾃｴi trﾆｰ盻拵g Vite
// - Dev:   VITE_API_BASE = http://10.200.2.29:5000
// - Prod:  VITE_API_BASE = ""  (deploy chung v盻嬖 backend)
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const CURRENT_USER_KEY = "currentUser";

type CurrentUser = { username: string; role: string };

// ローカルストレージへ現在のユーザー情報を保存・クリアする。
function saveCurrentUser(user: CurrentUser | null) {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

// ローカルストレージからログイン済みユーザーを復元する。
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
// 認証APIにリクエストを送り、成功時はユーザー情報を永続化する。
async function login(contractClientCd: string, username: string, password: string): Promise<CurrentUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractClientCd, username, password }),
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

// クライアント側のセッション情報を破棄する。
function logout() {
  saveCurrentUser(null);
}

// ==== Ki盻ブ tr蘯｣ v盻・cho API getAuthMode (BodyCamera cﾅｩng dﾃｹng) ====
export type AuthModeResponse = {
  authMode: number;
  deviceName: string;
  isActive: boolean;
};

// シリアルNoを受け取り、デバイスの認証モードを問い合わせる。
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

// 全デバイスを取得してフロントエンドのDevice型へマップする。
async function getAllDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/api/device`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getAllDevices error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Map t盻ｫ DB 竊・ki盻ブ Device trﾃｪn frontend
  return (json as any[]).map((d) => ({
    serialNo: d.serialNo,
    deviceName: d.deviceName,
    authMode: d.authMode,
    isActive: d.isActive,
    lastUpdated: d.updatedAt ?? d.createdAt ?? "",
  }));
}

// シリアルNoで1件のデバイスを検索する（暫定で全件取得後フィルタ）。
async function getDevice(serialNo: string): Promise<Device | undefined> {
  // T蘯｡m th盻拱: l蘯･y toﾃn b盻・r盻妬 filter (s盻・lﾆｰ盻｣ng thi蘯ｿt b盻・khﾃｴng nhi盻「 nﾃｪn OK)
  const list = await getAllDevices();
  return list.find((d) => d.serialNo === serialNo);
}

// 新規デバイスを作成し、API応答をフロントの型へ整形して返す。
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

// ----- 5) Update device (DeviceEdit chế độ edit) -----
// 既存デバイスを更新し、更新後の値を返却する。
async function updateDevice(
  serialNo: string,
  data: Partial<Device>
): Promise<Device> {
  // body g盻ｭi lﾃｪn ph蘯｣i ﾄ妥ｺng v盻嬖 model C# Device
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

// 指定デバイスを削除する（成功時はレスポンスボディなし）。
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

// デバイス変更履歴を取得し、フロント用ログ型へマッピングする。
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
// 管理者ユーザー一覧を取得する。
async function getUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${API_BASE}/api/adminusers`, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "getUsers failed");
  }
  return res.json();
}

// 新規管理ユーザーを作成する。
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

// 役割やパスワードなどの管理ユーザー情報を更新する。
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

// 管理ユーザーを削除する。
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



