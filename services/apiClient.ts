// src/services/apiClient.ts
// フロントエンド共通のAPIクライアント

import { Device, DeviceLog, AdminUser } from "../types";

// Vite環境変数からAPIベースURLを読み取る
// - Dev:  VITE_API_BASE = http://10.200.2.29:5000
// - Prod: VITE_API_BASE = ""  (バックエンドと同一ホスト想定)
const RAW_API_BASE = import.meta.env.VITE_API_BASE || "";
const API_BASE = RAW_API_BASE.replace(/\/+$/, "");
const CURRENT_USER_KEY = "currentUser";

type CurrentUser = { username: string; role: string };

// ローカルストレージへ現在ユーザー情報を保存／削除する。
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

//  Auth APIへログインリクエストを送り、成功時にユーザー情報を保存する。
// 認証APIへリクエストし、成功時にユーザー情報を保存する。
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

// クライアント側のセッション情報を破棄する。
function logout() {
  saveCurrentUser(null);
}

// ==== Echo API getAuthMode の戻り値 ====
export type AuthModeResponse = {
  authMode: number;
  deviceName: string;
  isActive: boolean;
};

// シリアルNoを基にデバイスの認証モードを問い合わせる。
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

// 全デバイスを取得し、フロントエンドのDevice型へ整形する。
async function getAllDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE}/api/device`, {
    method: "GET",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`getAllDevices error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // DBの形からフロント用Device型へマッピング
  return (json as any[]).map((d) => ({
    serialNo: d.serialNo,
    deviceName: d.deviceName,
    authMode: d.authMode,
    isActive: d.isActive,
    lastUpdated: d.updatedAt ?? d.createdAt ?? "",
  }));
}

// シリアルNoで1件のデバイスを検索する（暫定的に全件取得してフィルタ）。
async function getDevice(serialNo: string): Promise<Device | undefined> {
  // 台数が少ない前提で全件取得後にフィルタ
  const list = await getAllDevices();
  return list.find((d) => d.serialNo === serialNo);
}

// 新規デバイスを作成し、API応答をフロント用の型に整形して返す。
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

// 既存デバイスを更新し、更新後の値を返す。
async function updateDevice(
  serialNo: string,
  data: Partial<Device>
): Promise<Device> {
  // C# Deviceモデルに合わせたペイロード
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

  // DBのDeviceLogをフロントのDeviceLog型にマップ
  return (json as any[]).map((log) => ({
    id: log.id ?? 0,
    serialNo: log.serialNo ?? "",
    changeType: log.action ?? "",
    changeDetails: log.action ?? "",
    timestamp: log.createdAt ?? "",
    adminUser: "system",
  }));
}

// ----- 8) 管理ユーザー系API -----
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

// 権限やパスワードなど管理ユーザー情報を更新する。
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

// ==== ページ側でそのまま使うapiオブジェクト ====
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

// 必要に応じて個別関数として再エクスポート
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

