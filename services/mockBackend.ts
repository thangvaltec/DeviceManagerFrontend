
import { Device, DeviceLog, AuthMode, User, AdminUser, UserRole } from '../types';

// Mock Data - Centralized System
let allDevices: Device[] = [
  { serialNo: 'BC0001', deviceName: '本社受付 (Main Reception)', authMode: AuthMode.Face, isActive: true, lastUpdated: new Date().toISOString() },
  { serialNo: '222222', deviceName: 'サーバールーム (Server Room)', authMode: AuthMode.FaceAndVein, isActive: true, lastUpdated: new Date().toISOString() },
  { serialNo: 'KF5KW2124062200091', deviceName: '大阪支社 (HW ID)', authMode: AuthMode.Vein, isActive: true, lastUpdated: new Date().toISOString() },
  { serialNo: 'BC0004', deviceName: '物流センター', authMode: AuthMode.Face, isActive: false, lastUpdated: new Date().toISOString() },
];

let allLogs: DeviceLog[] = [
  { id: 1, serialNo: 'BC0001', changeType: 'CREATE', changeDetails: '初期登録', timestamp: new Date(Date.now() - 86400000).toISOString(), adminUser: 'admin' },
  { id: 2, serialNo: 'KF5KW2124062200091', changeType: 'CREATE', changeDetails: '自動登録 (HW Serial)', timestamp: new Date(Date.now() - 86000000).toISOString(), adminUser: 'admin' },
];

// Mock Users (Extended with password for simulation)
interface MockUser extends AdminUser {
  password?: string;
}

let allUsers: MockUser[] = [
  { id: 1, username: 'admin', role: 'super_admin', createdAt: new Date(2024, 0, 1).toISOString(), password: 'admin' },
  { id: 2, username: 'manager', role: 'admin', createdAt: new Date(2024, 1, 15).toISOString(), password: '1234' },
];

// Session State
let currentUser: User | null = null;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  login: async (username: string, password: string): Promise<User | null> => {
    await delay(600);
    
    // Find user in our mock database
    const foundUser = allUsers.find(u => u.username === username);
    
    // Check password match
    if (foundUser && foundUser.password === password) {
       currentUser = { username: foundUser.username, role: foundUser.role };
       return currentUser;
    }
    
    return null;
  },

  logout: async () => {
    currentUser = null;
  },

  getCurrentUser: () => currentUser,

  // --- Device APIs ---

  getDevices: async (): Promise<Device[]> => {
    await delay(300);
    if (!currentUser) throw new Error("Unauthorized");
    return [...allDevices];
  },

  getDevice: async (serialNo: string): Promise<Device | undefined> => {
    await delay(200);
    if (!currentUser) throw new Error("Unauthorized");
    return allDevices.find(d => d.serialNo === serialNo);
  },

  createDevice: async (device: Device): Promise<void> => {
    await delay(500);
    if (!currentUser) throw new Error("Unauthorized");

    if (allDevices.some(d => d.serialNo === device.serialNo)) {
      throw new Error("このIDは既に登録されています。");
    }
    
    const newDevice = { ...device, lastUpdated: new Date().toISOString() };
    allDevices.push(newDevice);
    api.logChange(device.serialNo, 'CREATE', `デバイス登録: ${device.deviceName}`);
  },

  updateDevice: async (serialNo: string, updated: Partial<Device>): Promise<void> => {
    await delay(500);
    if (!currentUser) throw new Error("Unauthorized");

    const index = allDevices.findIndex(d => d.serialNo === serialNo);
    if (index === -1) throw new Error("デバイスが見つかりません。");
    
    const oldDevice = allDevices[index];
    allDevices[index] = { ...oldDevice, ...updated, lastUpdated: new Date().toISOString() };
    api.logChange(serialNo, 'UPDATE', `更新: ${JSON.stringify(updated)}`);
  },

  deleteDevice: async (serialNo: string): Promise<void> => {
    await delay(500);
    if (!currentUser) throw new Error("Unauthorized");

    const initialLength = allDevices.length;
    allDevices = allDevices.filter(d => d.serialNo !== serialNo);
    
    if (allDevices.length < initialLength) {
      api.logChange(serialNo, 'DELETE', 'デバイス削除');
    }
  },

  getLogs: async (serialNo: string): Promise<DeviceLog[]> => {
    await delay(300);
    if (!currentUser) throw new Error("Unauthorized");
    
    return allLogs
      .filter(l => l.serialNo === serialNo)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  logChange: (serialNo: string, type: 'CREATE' | 'UPDATE' | 'DELETE', details: string) => {
    if (!currentUser) return;
    allLogs.push({
      id: allLogs.length + 1,
      serialNo,
      changeType: type,
      changeDetails: details,
      timestamp: new Date().toISOString(),
      adminUser: currentUser.username
    });
  },

  // --- User Management APIs (Super Admin Only) ---
  
  getUsers: async (): Promise<AdminUser[]> => {
    await delay(300);
    if (!currentUser || currentUser.role !== 'super_admin') throw new Error("Forbidden");
    // Return users without passwords for security simulation
    return allUsers.map(({ password, ...u }) => u);
  },

  createUser: async (username: string, role: UserRole, password: string): Promise<void> => {
    await delay(500);
    if (!currentUser || currentUser.role !== 'super_admin') throw new Error("Forbidden");
    
    if (allUsers.some(u => u.username === username)) {
      throw new Error("ユーザー名は既に使用されています");
    }

    allUsers.push({
      id: allUsers.length + 1,
      username,
      role,
      createdAt: new Date().toISOString(),
      password: password // In real DB this would be hashed
    });
  },

  updateUser: async (id: number, data: { role?: UserRole, password?: string }): Promise<void> => {
    await delay(400);
    if (!currentUser || currentUser.role !== 'super_admin') throw new Error("Forbidden");

    const userIndex = allUsers.findIndex(u => u.id === id);
    if (userIndex === -1) throw new Error("User not found");

    // Don't allow changing the main admin's role
    if (allUsers[userIndex].username === 'admin' && data.role && data.role !== 'super_admin') {
         throw new Error("Cannot demote the root admin");
    }

    if (data.role) allUsers[userIndex].role = data.role;
    if (data.password) allUsers[userIndex].password = data.password;
  },

  deleteUser: async (id: number): Promise<void> => {
     await delay(400);
     if (!currentUser || currentUser.role !== 'super_admin') throw new Error("Forbidden");
     
     const userToDelete = allUsers.find(u => u.id === id);
     if (!userToDelete) throw new Error("User not found");

     // Prevent deleting self
     if (userToDelete.username === currentUser.username) {
         throw new Error("自分のアカウントは削除できません");
     }
     
     // Prevent deleting main admin
     if (userToDelete.username === 'admin') {
         throw new Error("システム管理者は削除できません");
     }

     allUsers = allUsers.filter(u => u.id !== id);
  }
};
