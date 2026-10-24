import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

import { 
  ConnectionStatus, 
  BluetoothDeviceInfo, 
  SipRecord, 
  AquaSettings, 
  SerialLogEntry,
  ActiveScreen,
  UserProfile,
  NotificationRecord,
  DayIntakeRecord
} from './types';

import { WelcomeScreen } from './screens/WelcomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { RemindersScreen } from './screens/RemindersScreen';
import { StatsScreen } from './screens/StatsScreen';
import { HardwareScreen } from './screens/HardwareScreen';
import { BottomNavBar } from './components/BottomNavBar';
import { BluetoothModal } from './components/BluetoothModal';
import { NotificationAlert } from './components/NotificationAlert';
import { SettingsModal } from './components/SettingsModal';
import { CornerDateBadge } from './components/CornerDateBadge';
import { PersonChangedModal, PersonChangeDetails } from './components/PersonChangedModal';
import { AuthModal } from './components/AuthModal';
import { hardwareConnection } from './services/hardwareConnection';
import { 
  auth, 
  User, 
  logOut, 
  fetchUserData, 
  syncUserDataToCloud, 
  onAuthStateChanged 
} from './services/firebase';

import { 
  playWaterDropSound, 
  playHydrationAlertSound, 
  playRefillSound 
} from './utils/audio';

const generateInitialWeeklyData = (dailyGoal: number, todayIntake: number): DayIntakeRecord[] => [
  { id: 'pzt', dayShort: 'Pzt', dayFull: 'Pazartesi', dateStr: '08 Eyl', intakeMl: Math.round(dailyGoal * 1.05), goalMl: dailyGoal, completionRate: 105, goalReached: true, sipCount: 16 },
  { id: 'sal', dayShort: 'Sal', dayFull: 'Salı', dateStr: '09 Eyl', intakeMl: Math.round(dailyGoal * 0.92), goalMl: dailyGoal, completionRate: 92, goalReached: false, sipCount: 13 },
  { id: 'car', dayShort: 'Çar', dayFull: 'Çarşamba', dateStr: '10 Eyl', intakeMl: Math.round(dailyGoal * 1.08), goalMl: dailyGoal, completionRate: 108, goalReached: true, sipCount: 17 },
  { id: 'per', dayShort: 'Per', dayFull: 'Perşembe', dateStr: '11 Eyl', intakeMl: Math.round(dailyGoal * 1.02), goalMl: dailyGoal, completionRate: 102, goalReached: true, sipCount: 15 },
  { id: 'cum', dayShort: 'Cum', dayFull: 'Cuma', dateStr: '12 Eyl', intakeMl: Math.round(dailyGoal * 0.85), goalMl: dailyGoal, completionRate: 85, goalReached: false, sipCount: 11 },
  { id: 'cmt', dayShort: 'Cmt', dayFull: 'Cumartesi', dateStr: '13 Eyl', intakeMl: Math.round(dailyGoal * 1.12), goalMl: dailyGoal, completionRate: 112, goalReached: true, sipCount: 18 },
  { id: 'paz', dayShort: 'Paz', dayFull: 'Pazar', dateStr: '14 Eyl (Bugün)', intakeMl: todayIntake, goalMl: dailyGoal, completionRate: Math.round((todayIntake / (dailyGoal || 2450)) * 100), goalReached: todayIntake >= dailyGoal, sipCount: 8, isToday: true },
];

const DEFAULT_PROFILE: UserProfile = {
  name: 'Ahmet Yılmaz',
  age: 24,
  height: 175,
  weight: 70,
  calculatedGoal: 2450, // 70 kg * 35 ml = 2450 ml
  customGoal: 2450,
  activityLevel: 'medium',
  isProfileSet: false,
};

const DEFAULT_SETTINGS: AquaSettings = {
  dailyGoal: 2450, // Default Kilo (70) * 35 ml
  bottleCapacity: 1000, // 1000 ml kapasite
  reminderIntervalSec: 3600, // 1 saat = 3600 saniye kuralı
  enableSound: true,
  enableBrowserNotification: false,
};

export default function App() {
  // Screen routing state
  const [currentScreen, setCurrentScreen] = useState<ActiveScreen>(() => {
    try {
      const saved = localStorage.getItem('aquamind_last_screen');
      if (saved && ['welcome', 'profile', 'dashboard', 'reminders', 'stats', 'hardware'].includes(saved)) {
        return saved as ActiveScreen;
      }
      return 'welcome';
    } catch {
      return 'welcome';
    }
  });

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('aquamind_user_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // App Settings (Kapasite 1000 ml)
  const [settings, setSettings] = useState<AquaSettings>(() => {
    try {
      const saved = localStorage.getItem('aquamind_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.bottleCapacity || parsed.bottleCapacity === 750) {
          parsed.bottleCapacity = 1000;
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Bluetooth & Connection state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDeviceInfo | null>(null);
  const [isBluetoothModalOpen, setIsBluetoothModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [personChangeDetails, setPersonChangeDetails] = useState<PersonChangeDetails | null>(null);
  const [isPersonChangedModalOpen, setIsPersonChangedModalOpen] = useState<boolean>(false);

  // Cloud Account (Firebase Auth & Firestore) state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Core variables as requested by the user prompt
  // Global SuMiktari (Current bottle level in ml - default 650 ml of 1000 ml)
  const [suMiktari, setSuMiktari] = useState<number>(650);
  // Global SonİcilenMiktar (Previous bottle level)
  const sonIcilenMiktarRef = useRef<number>(650);
  // Global GecenSure (Elapsed seconds since last sip)
  const [gecenSure, setGecenSure] = useState<number>(0);
  // Bugün İçilen Toplam Su
  const [bugunToplamIcilen, setBugunToplamIcilen] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('aquamind_today_drank');
      return saved ? Number(saved) : 450;
    } catch {
      return 450;
    }
  });

  // In-app Alert / Notifier1 state
  const [notifierMessage, setNotifierMessage] = useState<string | null>(null);
  const [notifierTitle, setNotifierTitle] = useState<string>('💧 Su Vakti!');

  // Serial Stream & Logs
  const [serialLogs, setSerialLogs] = useState<SerialLogEntry[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [sipHistory, setSipHistory] = useState<SipRecord[]>([]);
  
  // Notification history
  const [notificationHistory, setNotificationHistory] = useState<NotificationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('aquamind_notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Weekly Hydration Records (7 days)
  const [weeklyDays, setWeeklyDays] = useState<DayIntakeRecord[]>(() => {
    try {
      const saved = localStorage.getItem('aquamind_weekly_data');
      if (saved) {
        return JSON.parse(saved);
      }
      return generateInitialWeeklyData(settings.dailyGoal, bugunToplamIcilen);
    } catch {
      return generateInitialWeeklyData(settings.dailyGoal, bugunToplamIcilen);
    }
  });

  // Sync today's consumption to weekly data dynamically
  useEffect(() => {
    setWeeklyDays((prevDays) => {
      return prevDays.map((d) => {
        if (d.isToday) {
          const rate = Math.round((bugunToplamIcilen / (settings.dailyGoal || 2450)) * 100);
          return {
            ...d,
            intakeMl: bugunToplamIcilen,
            goalMl: settings.dailyGoal,
            completionRate: rate,
            goalReached: bugunToplamIcilen >= settings.dailyGoal,
          };
        }
        return {
          ...d,
          goalMl: settings.dailyGoal,
          completionRate: Math.round((d.intakeMl / (settings.dailyGoal || 2450)) * 100),
          goalReached: d.intakeMl >= settings.dailyGoal,
        };
      });
    });
  }, [bugunToplamIcilen, settings.dailyGoal]);

  // Persist weekly days
  useEffect(() => {
    localStorage.setItem('aquamind_weekly_data', JSON.stringify(weeklyDays));
  }, [weeklyDays]);

  const handleUpdateDayIntake = (dayId: string, deltaMl: number) => {
    setWeeklyDays((prev) =>
      prev.map((d) => {
        if (d.id === dayId) {
          const newIntake = Math.max(0, d.intakeMl + deltaMl);
          const rate = Math.round((newIntake / (d.goalMl || 2450)) * 100);
          if (d.isToday) {
            setBugunToplamIcilen(newIntake);
          }
          return {
            ...d,
            intakeMl: newIntake,
            completionRate: rate,
            goalReached: newIntake >= d.goalMl,
          };
        }
        return d;
      })
    );
  };

  const handleResetWeeklyData = () => {
    const fresh = generateInitialWeeklyData(settings.dailyGoal, bugunToplamIcilen);
    setWeeklyDays(fresh);
    localStorage.setItem('aquamind_weekly_data', JSON.stringify(fresh));
  };

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('aquamind_last_screen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    localStorage.setItem('aquamind_user_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem('aquamind_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('aquamind_today_drank', bugunToplamIcilen.toString());
  }, [bugunToplamIcilen]);

  useEffect(() => {
    localStorage.setItem('aquamind_notifications', JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  // --------------------------------------------------------------------------
  // FIREBASE AUTH & AUTOMATIC CLOUD SYNC (Multi-device / Phone support)
  // When signing in with Gmail/Google or Email on another phone/device:
  // Automatically loads user profile, custom goal, settings and today's water intake.
  // --------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const cloudData = await fetchUserData(user.uid);
          if (cloudData) {
            // Restore settings from cloud
            if (cloudData.settings) {
              setSettings(cloudData.settings);
            }
            // Restore profile metrics from cloud
            if (cloudData.personName || cloudData.displayName) {
              setUserProfile((prev) => ({
                ...prev,
                name: cloudData.personName || cloudData.displayName || user.displayName || prev.name,
                weight: cloudData.settings?.weightKg || prev.weight,
                height: cloudData.settings?.heightCm || prev.height,
                calculatedGoal: cloudData.settings?.dailyGoal || prev.calculatedGoal,
                customGoal: cloudData.settings?.dailyGoal || prev.customGoal,
                isProfileSet: true,
              }));
            }
            // Restore today's water intake if on same day
            const todayStr = new Date().toISOString().slice(0, 10);
            if (cloudData.todayDateStr === todayStr && typeof cloudData.todayTotalDrank === 'number') {
              setBugunToplamIcilen(cloudData.todayTotalDrank);
            }
            if (cloudData.sips && Array.isArray(cloudData.sips) && cloudData.sips.length > 0) {
              setSipHistory(cloudData.sips);
            }
          }
        } catch (err) {
          console.warn('[Firebase] Auth state restore error:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to Cloud whenever hydration progress or profile settings change
  useEffect(() => {
    if (currentUser) {
      const todayStr = new Date().toISOString().slice(0, 10);
      syncUserDataToCloud(currentUser.uid, {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || userProfile.name,
        personName: userProfile.name,
        todayTotalDrank: bugunToplamIcilen,
        todayDateStr: todayStr,
        settings: {
          ...settings,
          weightKg: userProfile.weight,
          heightCm: userProfile.height,
          activityLevel: userProfile.activityLevel,
        },
        sips: sipHistory.slice(0, 30),
      });
    }
  }, [currentUser, bugunToplamIcilen, userProfile, settings, sipHistory]);

  const handleAuthSuccess = async (user: User) => {
    setCurrentUser(user);
    setNotifierTitle('☁️ Bulut Hesabı Bağlandı');
    setNotifierMessage(`Hoş geldiniz ${user.displayName || user.email}! Verileriniz senkronize ediliyor.`);

    try {
      const cloudData = await fetchUserData(user.uid);
      if (cloudData) {
        if (cloudData.settings) {
          setSettings(cloudData.settings);
        }
        if (cloudData.personName || cloudData.displayName) {
          setUserProfile((prev) => ({
            ...prev,
            name: cloudData.personName || cloudData.displayName || user.displayName || prev.name,
            weight: cloudData.settings?.weightKg || prev.weight,
            height: cloudData.settings?.heightCm || prev.height,
            calculatedGoal: cloudData.settings?.dailyGoal || prev.calculatedGoal,
            customGoal: cloudData.settings?.dailyGoal || prev.customGoal,
            isProfileSet: true,
          }));
        }
        const todayStr = new Date().toISOString().slice(0, 10);
        if (cloudData.todayDateStr === todayStr && typeof cloudData.todayTotalDrank === 'number') {
          setBugunToplamIcilen(cloudData.todayTotalDrank);
        }
        if (cloudData.sips && Array.isArray(cloudData.sips)) {
          setSipHistory(cloudData.sips);
        }
      } else {
        // First time account creation: backup local state to cloud immediately
        const todayStr = new Date().toISOString().slice(0, 10);
        syncUserDataToCloud(user.uid, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || userProfile.name,
          personName: userProfile.name,
          todayTotalDrank: bugunToplamIcilen,
          todayDateStr: todayStr,
          settings: {
            ...settings,
            weightKg: userProfile.weight,
            heightCm: userProfile.height,
            activityLevel: userProfile.activityLevel,
          },
          sips: sipHistory.slice(0, 30),
        });
      }
    } catch (err) {
      console.warn('[Firebase] handleAuthSuccess error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.warn('[Firebase] Sign out error:', err);
    }
    setCurrentUser(null);
    setNotifierTitle('🚪 Oturum Kapatıldı');
    setNotifierMessage('Hesabınızdan güvenle çıkış yapıldı.');
  };

  // Helper to add serial monitor log
  const addSerialLog = useCallback((raw: string, parsedMl: number, type: 'incoming' | 'event' | 'alert' = 'incoming') => {
    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    setSerialLogs((prev) => [
      ...prev.slice(-30),
      {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: timeStr,
        raw,
        parsedMl,
        type,
      },
    ]);
  }, []);

  // Trigger Local Notification & Alert (Notifier1)
  // Exact user specification:
  // "Eğer kullanıcı son 1 saat (3600 saniye) içinde şişeden hiç su içmediyse...
  //  telefona yerel bir push bildirim gönderilmeli.
  //  Bildirim Başlığı: '💧 Su Vakti!'
  //  Bildirim Metni: 'Hey! 1 saattir su içmedin. Böbreklerini kurutacaksın, hadi bir yudum al!'
  //  Bildirim gönderildikten sonra sayaç sıfırlanmalı."
  const triggerHydrationAlert = useCallback(() => {
    const title = '💧 Su Vakti!';
    const alertText = 'Hey! 1 saattir su içmedin. Böbreklerini kurutacaksın, hadi bir yudum al!';
    
    setNotifierTitle(title);
    setNotifierMessage(alertText);

    // Add to notification history
    const record: NotificationRecord = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      body: alertText,
      timestamp: Date.now(),
      isRead: false,
    };
    setNotificationHistory((prev) => [record, ...prev.slice(0, 19)]);

    if (settings.enableSound) {
      playHydrationAlertSound();
    }

    // Web Browser notification if enabled
    if (settings.enableBrowserNotification && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: alertText,
            icon: '/favicon.ico',
          });
        } catch {
          // Ignore
        }
      }
    }

    addSerialLog('ALERT: INACTIVITY_1_HOUR', suMiktari, 'alert');
  }, [settings.enableSound, settings.enableBrowserNotification, suMiktari, addSerialLog]);

  // Connect to Bluetooth Device (Physical Prototype or Simulated)
  const handleConnect = (device: BluetoothDeviceInfo) => {
    setConnectionStatus('connecting');
    setConnectedDevice(device);

    if (device.type === 'simulated') {
      setTimeout(() => {
        setConnectionStatus('connected');
        addSerialLog(`CONNECT: ${device.name} (Simülasyon)`, suMiktari, 'event');
      }, 400);
    } else {
      setConnectionStatus('connected');
      addSerialLog(`CONNECT: ${device.name} (${device.type.toUpperCase()})`, suMiktari, 'event');
    }
  };

  const handleDisconnect = async () => {
    try {
      await hardwareConnection.disconnect();
    } catch {
      // Ignore
    }
    setConnectionStatus('disconnected');
    setConnectedDevice(null);
    addSerialLog('DISCONNECT', suMiktari, 'event');
  };

  // --------------------------------------------------------------------------
  // INCOMING SENSOR DATA PROCESSING (Deneyap Kart 1A / ESP32)
  // Implements the user's exact specification:
  // "Eğer gelen yeni veri, bir önceki okunan veriden daha azsa (Örn: 500 ml idi, şimdi 450 ml geldi),
  //  aradaki fark (50 ml) 'Bugün İçilen Toplam Su' değişkenine eklenmeli.
  //  Şişe yeniden doldurulduğunda (gelen veri arttığında) bu miktar sıfırlanmamalı, sadece mevcut şişe seviyesi güncellenmeli."
  // --------------------------------------------------------------------------
  const processIncomingSensorData = useCallback((yeniVeri: number) => {
    const oncekiVeri = sonIcilenMiktarRef.current;
    
    // Gelen ham veri formatı: "450\n"
    const rawString = `${yeniVeri}\n`;
    addSerialLog(rawString, yeniVeri, 'incoming');

    setSuMiktari(yeniVeri);

    if (yeniVeri < oncekiVeri) {
      // Su içildi!
      const fark = oncekiVeri - yeniVeri;
      const yeniToplam = bugunToplamIcilen + fark;
      setBugunToplamIcilen(yeniToplam);

      // Reset timer & update last drink reference
      sonIcilenMiktarRef.current = yeniVeri;
      setGecenSure(0);

      // Add to sip history
      const newSip: SipRecord = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        amount: fark,
        bottleLevelAfter: yeniVeri,
      };
      setSipHistory((prev) => [newSip, ...prev.slice(0, 19)]);

      if (settings.enableSound) {
        playWaterDropSound();
      }

      // Check if daily goal reached
      if (yeniToplam >= settings.dailyGoal && bugunToplamIcilen < settings.dailyGoal) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } else if (yeniVeri > oncekiVeri) {
      // Şişe yeniden dolduruldu (gelen veri arttı)
      // Toplam su sıfırlanmaz, sadece mevcut şişe seviyesi güncellenir
      sonIcilenMiktarRef.current = yeniVeri;
      if (settings.enableSound) {
        playRefillSound();
      }
    } else {
      // Su miktarı değişmedi
    }
  }, [bugunToplamIcilen, settings.dailyGoal, settings.enableSound, addSerialLog]);

  // --------------------------------------------------------------------------
  // REAL HARDWARE (WEB BLUETOOTH BLE & WEB SERIAL) DATA LISTENER
  // Receives live water level numbers from the physical prototype
  // --------------------------------------------------------------------------
  useEffect(() => {
    hardwareConnection.setCallbacks(
      (parsedMl: number, raw: string) => {
        // Real incoming data from physical ESP32 prototype!
        processIncomingSensorData(parsedMl);
      },
      (status, device, error) => {
        setConnectionStatus(status);
        if (device) {
          setConnectedDevice(device);
        }
        if (status === 'connected' && device) {
          addSerialLog(`CONNECTED: ${device.name} [${device.type.toUpperCase()}]`, suMiktari, 'event');
        } else if (status === 'disconnected') {
          setConnectedDevice(null);
          addSerialLog('DISCONNECTED', suMiktari, 'event');
        }
        if (error) {
          console.warn('[Hardware Error]:', error);
        }
      }
    );
  }, [processIncomingSensorData, addSerialLog, suMiktari]);

  // --------------------------------------------------------------------------
  // CLOCK1 TIMER IMPLEMENTATION (Saniyede bir çalışan arka plan motoru)
  // TimeInterval = 1000 ms
  // --------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      // 1. Clock1: Zaman kontrolü
      setGecenSure((prevGecen) => {
        const nextGecen = prevGecen + 1;

        // 2. Akıllı Bildirim Kontrolü:
        // Eğer GecenSure >= 3600 (veya settings.reminderIntervalSec) ise bildirim at ve süreyi sıfırla
        if (nextGecen >= settings.reminderIntervalSec) {
          triggerHydrationAlert();
          return 0; // Bildirim gönderildikten sonra sayacı sıfırla
        }

        return nextGecen;
      });

      // 3. Bluetooth SPP bağlıysa periyodik veri okuma simülasyonu
      if (connectionStatus === 'connected' && isStreaming) {
        addSerialLog(`${suMiktari}\n`, suMiktari, 'incoming');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [connectionStatus, isStreaming, settings.reminderIntervalSec, suMiktari, triggerHydrationAlert, addSerialLog]);

  // Actions
  const handleTakeSip = (amount = 50) => {
    const nextLevel = Math.max(0, suMiktari - amount);
    processIncomingSensorData(nextLevel);
  };

  const handleRefillBottle = () => {
    processIncomingSensorData(settings.bottleCapacity);
  };

  const handleFastForwardTime = (seconds: number) => {
    setGecenSure((prev) => {
      const advanced = prev + seconds;
      if (advanced >= settings.reminderIntervalSec) {
        triggerHydrationAlert();
        return 0;
      }
      return advanced;
    });
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    // Check if the person is being changed
    const previousName = userProfile.name || 'Kullanıcı';
    const isPersonChanged = userProfile.isProfileSet && (
      newProfile.name.trim().toLowerCase() !== previousName.trim().toLowerCase()
    );

    const newDailyGoal = newProfile.customGoal || newProfile.calculatedGoal;

    setUserProfile(newProfile);
    
    // Automatically synchronize daily water goal from profile
    setSettings((prev) => ({
      ...prev,
      dailyGoal: newDailyGoal,
    }));

    // EXACT USER SPECIFICATION: "kişi değiştirildiğinde bilgiler sıfırlasın ve bunun uyarısı verilsin"
    if (isPersonChanged) {
      // 1. Reset today's total drunk water
      setBugunToplamIcilen(0);

      // 2. Reset sip log history
      setSipHistory([]);

      // 3. Reset 1-hour inactivity reminder timer
      setGecenSure(0);

      // 4. Reset bottle baseline to current bottle water level
      sonIcilenMiktarRef.current = suMiktari;

      // 5. Trigger prominent warning modal with details
      setPersonChangeDetails({
        previousName,
        newName: newProfile.name,
        previousGoal: settings.dailyGoal,
        newGoal: newDailyGoal,
        resetIntake: true,
      });
      setIsPersonChangedModalOpen(true);

      // 6. Also trigger pop-up Notifier alert banner
      setNotifierTitle('⚠️ Kişi Değiştirildi!');
      setNotifierMessage(`"${previousName}" kullanıcısı yerine "${newProfile.name}" profiline geçildi. Bugünün su tüketim bilgileri (0 ml) sıfırlandı ve yeni günlük hedef ${newDailyGoal} ml olarak belirlendi.`);

      // 7. Add serial log event
      addSerialLog(`PROFILE_SWITCH: ${previousName} -> ${newProfile.name} (INTAKE_RESET_0ML)`, suMiktari, 'event');
    }

    // Navigate directly to Dashboard
    setCurrentScreen('dashboard');
  };

  const handleResetToday = () => {
    setBugunToplamIcilen(0);
    setSipHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50/40 to-slate-100 text-slate-800 antialiased flex flex-col justify-between selection:bg-sky-500 selection:text-white" id="aquamind-app">
      
      {/* Pop-up Alert / Notifier1 Banner */}
      <NotificationAlert
        title={notifierTitle}
        message={notifierMessage}
        onDismiss={() => setNotifierMessage(null)}
        onTakeSip={() => handleTakeSip(50)}
      />

      {/* Screen Container */}
      <main className="flex-1 flex flex-col w-full pb-3">
        {/* Top Bar with Corner Date (displayed on all screens except welcome which has its own) */}
        {currentScreen !== 'welcome' && (
          <div className="max-w-md md:max-w-xl mx-auto w-full px-4 pt-2.5 pb-0.5 flex items-center justify-between" id="app-top-date-bar">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[150px] sm:max-w-none">AquaMind Canlı Takip</span>
            </div>
            <CornerDateBadge />
          </div>
        )}

        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStart={() => setCurrentScreen('profile')}
            onQuickDashboard={() => setCurrentScreen('dashboard')}
            userName={userProfile.name}
            hasProfile={userProfile.isProfileSet}
            currentUser={currentUser}
            onOpenAuthModal={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            initialProfile={userProfile}
            onSaveProfile={handleSaveProfile}
            onGoBack={() => setCurrentScreen('welcome')}
            currentUser={currentUser}
            onOpenAuthModal={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            connectionStatus={connectionStatus}
            connectedDevice={connectedDevice}
            onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
            suMiktari={suMiktari}
            bottleCapacity={settings.bottleCapacity}
            bugunToplamIcilen={bugunToplamIcilen}
            dailyGoal={settings.dailyGoal}
            gecenSure={gecenSure}
            userProfile={userProfile}
            currentUser={currentUser}
            onOpenAuthModal={() => {
              setAuthModalMode('login');
              setIsAuthModalOpen(true);
            }}
            onTakeSip={handleTakeSip}
            onRefillBottle={handleRefillBottle}
            onNavigateToReminders={() => setCurrentScreen('reminders')}
            onNavigateToProfile={() => setCurrentScreen('profile')}
            onNavigateToHardware={() => setCurrentScreen('hardware')}
            onNavigateToStats={() => setCurrentScreen('stats')}
            weeklyDays={weeklyDays}
            sipHistory={sipHistory}
          />
        )}

        {currentScreen === 'stats' && (
          <StatsScreen
            weeklyDays={weeklyDays}
            dailyGoal={settings.dailyGoal}
            userProfile={userProfile}
            onUpdateDayIntake={handleUpdateDayIntake}
            onResetWeeklyData={handleResetWeeklyData}
            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'reminders' && (
          <RemindersScreen
            settings={settings}
            onUpdateSettings={setSettings}
            gecenSure={gecenSure}
            onFastForwardTime={handleFastForwardTime}
            onResetTimer={() => setGecenSure(0)}
            onTriggerInstantAlert={triggerHydrationAlert}
            notificationHistory={notificationHistory}
          />
        )}

        {currentScreen === 'hardware' && (
          <HardwareScreen
            isConnected={connectionStatus === 'connected'}
            connectedDevice={connectedDevice}
            onOpenBluetoothModal={() => setIsBluetoothModalOpen(true)}
            bottleLevel={suMiktari}
            bottleCapacity={settings.bottleCapacity}
            elapsedSeconds={gecenSure}
            onSimulateData={processIncomingSensorData}
            onFastForwardTime={handleFastForwardTime}
            onResetTime={() => setGecenSure(0)}
            serialLogs={serialLogs}
            isStreaming={isStreaming}
            onToggleStreaming={() => setIsStreaming(!isStreaming)}
            todayDrankMl={bugunToplamIcilen}
            dailyGoalMl={settings.dailyGoal}
          />
        )}
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <BottomNavBar
        currentScreen={currentScreen}
        onSelectScreen={(screen) => setCurrentScreen(screen)}
        isReminderOverdue={gecenSure >= settings.reminderIntervalSec}
        hasProfile={userProfile.isProfileSet}
      />

      {/* Bluetooth Connection Modal */}
      <BluetoothModal
        isOpen={isBluetoothModalOpen}
        onClose={() => setIsBluetoothModalOpen(false)}
        status={connectionStatus}
        connectedDevice={connectedDevice}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        currentBottleMl={suMiktari}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onSave={setSettings}
        onResetToday={handleResetToday}
      />

      {/* Person Changed Warning Modal */}
      <PersonChangedModal
        isOpen={isPersonChangedModalOpen}
        details={personChangeDetails}
        onClose={() => setIsPersonChangedModalOpen(false)}
      />

      {/* Cloud Account & Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onSuccess={handleAuthSuccess}
        onSignOut={handleSignOut}
        initialMode={authModalMode}
      />
    </div>
  );
}
