import React from 'react';
import { Home, Bell, User, Cpu, BarChart3 } from 'lucide-react';
import { ActiveScreen } from '../types';

interface BottomNavBarProps {
  currentScreen: ActiveScreen;
  onSelectScreen: (screen: ActiveScreen) => void;
  isReminderOverdue: boolean;
  hasProfile: boolean;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentScreen,
  onSelectScreen,
  isReminderOverdue,
  hasProfile,
}) => {
  // Hide navbar on welcome screen to provide a clean splash landing
  if (currentScreen === 'welcome') return null;

  const navItems = [
    {
      id: 'dashboard' as ActiveScreen,
      label: 'Ana Sayfa',
      icon: Home,
    },
    {
      id: 'stats' as ActiveScreen,
      label: 'Grafikler',
      icon: BarChart3,
    },
    {
      id: 'reminders' as ActiveScreen,
      label: 'Hatırlatıcı',
      icon: Bell,
      badge: isReminderOverdue,
    },
    {
      id: 'profile' as ActiveScreen,
      label: 'Hedef & Profil',
      icon: User,
    },
    {
      id: 'hardware' as ActiveScreen,
      label: 'DENEYAP 1A',
      icon: Cpu,
    },
  ];

  return (
    <nav 
      className="sticky bottom-0 inset-x-0 w-full bg-white/95 backdrop-blur-md border-t border-sky-100 py-1.5 px-3 z-40 shadow-lg"
      id="bottom-navigation-bar"
    >
      <div className="max-w-md md:max-w-xl mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentScreen === item.id;
          const IconComponent = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
                isActive 
                  ? 'text-sky-600 font-extrabold scale-105' 
                  : 'text-slate-400 hover:text-slate-600 font-medium'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
