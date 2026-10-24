import React from 'react';
import { Cpu, Terminal, Radio, Wrench, Share2, Layers, BookOpen, ChevronRight } from 'lucide-react';
import { HardwareSimulator } from '../components/HardwareSimulator';
import { I2CLcdDisplay } from '../components/I2CLcdDisplay';
import { BluetoothDeviceInfo, SerialLogEntry } from '../types';

interface HardwareScreenProps {
  isConnected: boolean;
  connectedDevice?: BluetoothDeviceInfo | null;
  onOpenBluetoothModal?: () => void;
  bottleLevel: number;
  bottleCapacity: number;
  elapsedSeconds: number;
  onSimulateData: (newLevel: number) => void;
  onFastForwardTime: (seconds: number) => void;
  onResetTime: () => void;
  serialLogs: SerialLogEntry[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  todayDrankMl: number;
  dailyGoalMl: number;
}

export const HardwareScreen: React.FC<HardwareScreenProps> = ({
  isConnected,
  connectedDevice,
  onOpenBluetoothModal,
  bottleLevel,
  bottleCapacity,
  elapsedSeconds,
  onSimulateData,
  onFastForwardTime,
  onResetTime,
  serialLogs,
  isStreaming,
  onToggleStreaming,
  todayDrankMl,
  dailyGoalMl,
}) => {
  return (
    <div className="flex-1 flex flex-col gap-4 max-w-md md:max-w-xl mx-auto w-full px-4 py-2 text-slate-800" id="hardware-screen">
      
      {/* Top Banner */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-cyan-400 flex items-center justify-center shadow-md border border-slate-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                DENEYAP Kart 1A Laboratuvarı
              </h2>
              {isConnected && connectedDevice && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-300">
                  {connectedDevice.type === 'ble' ? 'Gerçek BLE Bağlı' : connectedDevice.type === 'web_serial' ? 'Gerçek Seri/USB' : 'Simülatör'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {isConnected && connectedDevice 
                ? `Aktif Prototip: ${connectedDevice.name} (${connectedDevice.address})` 
                : 'ESP32 Bluetooth SPP & BLE, HC-SR04 Sensör & I2C LCD'}
            </p>
          </div>
        </div>
        {onOpenBluetoothModal && (
          <button
            type="button"
            onClick={onOpenBluetoothModal}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              isConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                : 'bg-sky-600 text-white border-sky-600 hover:bg-sky-700 shadow-xs'
            }`}
          >
            {isConnected ? 'Cihaz Yönet' : 'Prototip Bağla'}
          </button>
        )}
      </div>

      {/* 4-Pin I2C LCD Display Preview */}
      <I2CLcdDisplay
        currentBottleMl={bottleLevel}
        todayDrankMl={todayDrankMl}
        dailyGoalMl={dailyGoalMl}
        isConnected={isConnected}
      />

      {/* Hardware Architecture Overview */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-sky-100 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>Donanım Bağlantı Şeması & Pin Dağılımı</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block text-[11px]">HC-SR04 Ultrasonik</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Trig: D12 / Echo: D13</span>
            <span className="text-sky-600 text-[10px] block mt-0.5">VCC: 5V • GND: GND</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 block text-[11px]">I2C LCD (16x2)</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">SDA: GPIO21 • SCL: GPIO22</span>
            <span className="text-cyan-600 text-[10px] block mt-0.5">I2C Adres: 0x27 (4 Pin)</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-100 text-[11px] text-slate-600 leading-relaxed">
          <strong>İçilen Su Hesaplama Algoritması:</strong> Ultrasonik sensör kapaktan su yüzeyine olan mesafeyi ölçer. Mesafe formülüyle mililitreye çevrilir. Yeni okunan ml değeri önceki değerden azaldığında içilen miktar toplam hidrasyona eklenir ve 1 saatlik sayaç sıfırlanır. Su eklendiğinde ise sadece seviye güncellenir.
        </div>
      </div>

      {/* Hardware Bench & Serial Monitor */}
      <div className="space-y-2">
        <HardwareSimulator
          isConnected={isConnected}
          bottleLevel={bottleLevel}
          bottleCapacity={bottleCapacity}
          elapsedSeconds={elapsedSeconds}
          onSimulateData={onSimulateData}
          onFastForwardTime={onFastForwardTime}
          onResetTime={onResetTime}
          serialLogs={serialLogs}
          isStreaming={isStreaming}
          onToggleStreaming={onToggleStreaming}
        />
      </div>

    </div>
  );
};
