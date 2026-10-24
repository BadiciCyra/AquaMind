import React, { useState } from 'react';
import { 
  Terminal, 
  Cpu, 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Code, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Sparkles,
  Sliders,
  Radio
} from 'lucide-react';
import { SerialLogEntry } from '../types';

interface HardwareSimulatorProps {
  isConnected: boolean;
  bottleLevel: number;
  bottleCapacity: number;
  elapsedSeconds: number;
  onSimulateData: (newLevel: number) => void;
  onFastForwardTime: (seconds: number) => void;
  onResetTime: () => void;
  serialLogs: SerialLogEntry[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
}

export const HardwareSimulator: React.FC<HardwareSimulatorProps> = ({
  isConnected,
  bottleLevel,
  bottleCapacity,
  elapsedSeconds,
  onSimulateData,
  onFastForwardTime,
  onResetTime,
  serialLogs,
  isStreaming,
  onToggleStreaming,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'serial' | 'code'>('controls');
  const [copied, setCopied] = useState(false);
  const [sliderValue, setSliderValue] = useState(bottleLevel);

  const sampleArduinoCode = `/*
 * AquaMind - Deneyap Kart 1A (ESP32) Su Seviyesi & Bluetooth SPP
 * Ultrasonik Mesafe Sensörü (HC-SR04) ile Su Miktarı Ölçümü
 */

#include "BluetoothSerial.h"

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled!
#endif

BluetoothSerial SerialBT;

// Ultrasonik Sensör Pinleri (Deneyap Kart 1A)
const int TRIG_PIN = D12; // veya D0
const int ECHO_PIN = D13; // veya D1

// Şişe Ölçüleri (cm ve ml kalibrasyonu)
const float SISE_YUKSEKLIK_CM = 24.0; // Şişenin toplam yüksekliği
const float MAKS_HACIM_ML = 1000.0;   // Şişe hacmi (1000 ml)
const float TABAN_ALAN_CM2 = MAKS_HACIM_ML / SISE_YUKSEKLIK_CM;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Bluetooth SPP Cihaz Adı
  SerialBT.begin("Deneyap_AquaMind");
  Serial.println("AquaMind Bluetooth baslatildi! Eslesme bekleniyor...");
}

float mesafeOlc() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return SISE_YUKSEKLIK_CM; // Maks mesafe

  float mesafeCm = (duration * 0.0343) / 2.0;
  return constrain(mesafeCm, 0.0, SISE_YUKSEKLIK_CM);
}

void loop() {
  float boslukCm = mesafeOlc();
  float suYukseklikCm = SISE_YUKSEKLIK_CM - boslukCm;
  if (suYukseklikCm < 0) suYukseklikCm = 0;

  // Hacim hesabı (ml)
  int suMiktariMl = (int)(suYukseklikCm * TABAN_ALAN_CM2);
  suMiktariMl = constrain(suMiktariMl, 0, (int)MAKS_HACIM_ML);

  // Serial ve Bluetooth SPP üzerinden '450\\n' formatında gönderim
  Serial.printf("Mesafe: %.1f cm -> Su: %d ml\\n", boslukCm, suMiktariMl);
  
  if (SerialBT.hasClient()) {
    SerialBT.println(suMiktariMl); // Her 1 saniyede string + \\n
  }

  delay(1000); // Clock1 ile senkron her 1 saniyede bir ölçüm
}
`;

  const copyCode = () => {
    navigator.clipboard.writeText(sampleArduinoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
    onSimulateData(val);
  };

  return (
    <div 
      className="w-full bg-white rounded-2xl shadow-md border border-sky-100 overflow-hidden"
      id="hardware-simulator-card"
    >
      {/* Toggle Bar */}
      <button
        id="btn-toggle-simulator"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-slate-50 to-sky-50/60 hover:bg-sky-50/80 transition-colors flex items-center justify-between cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span>Deneyap Kart 1A Donanım & Test Paneli</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                <Radio className={`w-3 h-3 ${isConnected ? 'animate-pulse text-emerald-600' : ''}`} />
                {isConnected ? 'SPP Akışı Aktif (1s)' : 'Bağlantı Bekleniyor'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Ultrasonik sensör testleri, seri monitör ve Arduino/Deneyap C++ kodları
            </p>
          </div>
        </div>
        
        <div className="text-slate-400">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-sky-100 space-y-4 animate-in fade-in duration-200">
          {/* Sub-tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              id="tab-sim-controls"
              type="button"
              onClick={() => setActiveTab('controls')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'controls' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sensör & Aksiyonlar
            </button>
            <button
              id="tab-sim-serial"
              type="button"
              onClick={() => setActiveTab('serial')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'serial' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Seri Monitör ({serialLogs.length})</span>
            </button>
            <button
              id="tab-sim-code"
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeTab === 'code' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Deneyap C++ Kodu</span>
            </button>
          </div>

          {/* TAB 1: CONTROLS */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              {/* Quick Action buttons */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">
                  Hızlı Donanım Aksiyonları (Sensör Değişimi Simülasyonu)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    id="btn-sip-50"
                    type="button"
                    onClick={() => {
                      const next = Math.max(0, bottleLevel - 50);
                      setSliderValue(next);
                      onSimulateData(next);
                    }}
                    className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-900 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Yudum Al (-50 ml)</span>
                  </button>

                  <button
                    id="btn-sip-150"
                    type="button"
                    onClick={() => {
                      const next = Math.max(0, bottleLevel - 150);
                      setSliderValue(next);
                      onSimulateData(next);
                    }}
                    className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-xs font-semibold text-sky-900 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Büyük Yudum (-150 ml)</span>
                  </button>

                  <button
                    id="btn-refill-bottle"
                    type="button"
                    onClick={() => {
                      const next = bottleCapacity;
                      setSliderValue(next);
                      onSimulateData(next);
                    }}
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold text-emerald-900 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-600" />
                    <span>Şişeyi Doldur ({bottleCapacity} ml)</span>
                  </button>

                  <button
                    id="btn-empty-bottle"
                    type="button"
                    onClick={() => {
                      setSliderValue(0);
                      onSimulateData(0);
                    }}
                    className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-semibold text-rose-900 flex flex-col items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    <span>Şişeyi Boşalt (0 ml)</span>
                  </button>
                </div>
              </div>

              {/* Slider for continuous level */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-sky-600" />
                    <span>Ultrasonik Mesafe Simülatörü:</span>
                  </div>
                  <span className="font-mono text-sky-700 font-bold">{sliderValue} ml / {bottleCapacity} ml</span>
                </div>
                <input
                  id="slider-bottle-level"
                  type="range"
                  min="0"
                  max={bottleCapacity}
                  step="10"
                  value={sliderValue}
                  onChange={handleSliderChange}
                  className="w-full accent-sky-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>0 ml (Boş)</span>
                  <span>{Math.round(bottleCapacity / 2)} ml</span>
                  <span>{bottleCapacity} ml (Dolu)</span>
                </div>
              </div>

              {/* Inactivity & Clock1 notification fast test */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-bold text-amber-950 block">
                      Clock1 Bildirim Zamanlayıcısı Testi (1 Saat Hatırlatıcısı)
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Geçen Süre: <strong className="font-mono">{elapsedSeconds} sn</strong> ({Math.floor(elapsedSeconds / 60)} dk {elapsedSeconds % 60} sn)
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      id="btn-fast-forward-1h"
                      type="button"
                      onClick={() => onFastForwardTime(3600)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                      <span>+1 Saati Tetikle (3600 sn)</span>
                    </button>
                    <button
                      id="btn-reset-timer"
                      type="button"
                      onClick={onResetTime}
                      className="p-1.5 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-xs font-medium cursor-pointer"
                      title="Süreyi Sıfırla"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-amber-800/80">
                  Kullanıcı 1 saattir (3600 sn) su içmediğinde: &quot;💧 Hey! 1 saattir su içmedin, böbreklerini kurutacaksın, hadi bir yudum al!&quot; bildirimi fırlar.
                </p>
              </div>

              {/* Stream toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-500">
                  ESP32 1 saniyede bir otomatik &quot;X\n&quot; veri akışı
                </span>
                <button
                  id="btn-toggle-stream"
                  type="button"
                  onClick={onToggleStreaming}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    isStreaming ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isStreaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isStreaming ? 'Akışı Duraklat' : 'Akışı Başlat'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SERIAL MONITOR */}
          {activeTab === 'serial' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Gelen Ham SPP Verisi (ReceiveText):</span>
                <span className="font-mono text-[11px] text-sky-700">Format: Integer + \n</span>
              </div>
              <div 
                className="w-full h-44 bg-slate-950 text-emerald-400 font-mono text-xs p-3 rounded-xl overflow-y-auto border border-slate-800 space-y-1 shadow-inner"
                id="serial-monitor-output"
              >
                {serialLogs.length === 0 ? (
                  <div className="text-slate-500 text-center py-8">Henüz veri yok. Bluetooth bağlandığında her saniye veri akacaktır...</div>
                ) : (
                  serialLogs.slice(-20).map((log) => (
                    <div key={log.id} className="flex items-center gap-2 leading-relaxed">
                      <span className="text-slate-500 text-[10px]">{log.timestamp}</span>
                      <span className="text-sky-400 font-bold">&gt;&gt;</span>
                      <span className="text-emerald-300 font-semibold">{JSON.stringify(log.raw)}</span>
                      <span className="text-slate-400 text-[11px]">→ parsed: {log.parsedMl} ml</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CODE */}
          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Deneyap Kart 1A (ESP32) Arduino IDE Kodu</span>
                <button
                  id="btn-copy-arduino-code"
                  type="button"
                  onClick={copyCode}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>
              </div>
              <pre className="w-full h-52 bg-slate-900 text-sky-200 font-mono text-[11px] p-3 rounded-xl overflow-y-auto border border-slate-800 shadow-inner">
                {sampleArduinoCode}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
