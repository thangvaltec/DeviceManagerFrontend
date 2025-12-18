
export enum AuthMode {
  Face = 0,
  Vein = 1,
  FaceAndVein = 2,
}

export interface Device {
  serialNo: string;
  deviceName: string;
  authMode: AuthMode;
  isActive: boolean;
  lastUpdated: string;
}

export interface DeviceLog {
  id: number;
  serialNo: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
  changeDetails: string;
  timestamp: string;
  adminUser: string;
}

export interface AuthLog {
  id: number;
  timestamp: string;
  userId: string;
  userName?: string; // Optional: User's display name from database
  deviceName: string;
  serialNo: string;
  authMode: AuthMode;
  isSuccess: boolean;
  errorMessage?: string;
}

export type UserRole = 'super_admin' | 'admin';

export interface User {
  username: string;
  role: UserRole;
}

export interface AdminUser {
  id: number;
  username: string;
  role: UserRole;
  createdAt: string;
}
