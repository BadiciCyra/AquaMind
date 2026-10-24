export type ActiveScreen = 'welcome' | 'profile' | 'dashboard' | 'reminders' | 'stats' | 'hardware';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

export interface DayIntakeRecord {
  id: string;
  dayShort: string; // 'Pzt', 'Sal', etc.
  dayFull: string;  // 'Pazartesi', etc.
  dateStr: string;  // '08 Eyl'
  intakeMl: number;
  goalMl: number;
  completionRate: number; // in %
  goalReached: boolean;
  sipCount: number;
  isToday?: boolean;
}

export interface WeeklySummary {
  totalIntakeMl: number;
  averageDailyMl: number;
  completedDaysCount: number;
  totalDays: number;
  overallRate: number;
  streakDays: number;
  bestDay: {
    day: string;
    intakeMl: number;
  };
}

export interface UserProfile {
  name: string;
  age: number;
  height: number; // in cm
  weight: number; // in kg
  calculatedGoal: number; // weight * 35 ml
  customGoal: number; // user adjusted goal
  activityLevel: 'low' | 'medium' | 'high';
  isProfileSet: boolean;
}

export interface BluetoothDeviceInfo {
  id: string;
  name: string;
  address: string;
  type: 'classic_spp' | 'ble' | 'web_serial' | 'simulated';
  rssi?: number;
}

export interface SipRecord {
  id: string;
  timestamp: number;
  amount: number; // in ml
  bottleLevelAfter: number; // in ml
}

export interface AquaSettings {
  dailyGoal: number; // in ml, e.g. 2450
  bottleCapacity: number; // in ml, e.g. 1000
  reminderIntervalSec: number; // default 3600 (1 hour)
  enableSound: boolean;
  enableBrowserNotification: boolean;
  weightKg?: number;
  heightCm?: number;
  activityLevel?: 'low' | 'medium' | 'high';
}

export interface SerialLogEntry {
  id: string;
  timestamp: string;
  raw: string;
  parsedMl: number;
  type: 'incoming' | 'event' | 'alert';
}

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  isRead: boolean;
}
