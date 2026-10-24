import React, { useState, useEffect } from 'react';
import { 
  Bluetooth, 
  X, 
  Cpu, 
  Wifi, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Radio, 
  ExternalLink,
  Zap,
  Cable,
  ChevronDown,
  ChevronUp,
  Sliders
} from 'lucide-react';
import { BluetoothDeviceInfo, ConnectionStatus } from '../types';
import { hardwareConnection } from '../services/hardwareConnection';

interface BluetoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: ConnectionStatus;
  connectedDevice: BluetoothDeviceInfo | null;
  onConnect: (device: BluetoothDeviceInfo) => void;
  onDisconnect: () => void;
  currentBottleMl?: number;
}

const PRESET_SIMULATED_DEVICES: BluetoothDeviceInfo[] = [
  {
    id: 'sim-aquamind-primary',
    name: 'AquaMind_Sise (Test Simülasyonu)',
    address: '84:CC:A8:71:3B:9A',
    type: 'simulated',
    rssi: -45,
  },
  {
    id: 'sim-deneyap-ofis',
    name: 'Deneyap_AquaMind (Ofis Test)',
    address: '24:6F:28:B4:9C:12',
    type: 'simulated',
    rssi: -58,
  },
];

export const BluetoothModal: React.FC<BluetoothModalProps> = ({
  isOpen,
  onClose,
  status,
  connectedDevice,
  onConnect,
  onDisconnect,
  currentBottleMl = 650,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSimulated, setShowSimulated] = useState(false);
  const [isIframeBlocked, setIsIframeBlocked] = useState(false);

  // Saved paired real devices
  const [pairedDevices, setPairedDevices] = useState<BluetoothDeviceInfo[]>(() => {
    try {
      const saved = localStorage.getItem('aquamind_paired_devices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isInsideIframe = hardwareConnection.isInsideIframe();

  useEffect(() => {
    if (pairedDevices.length > 0) {
      localStorage.setItem('aquamind_paired_devices', JSON.stringify(pairedDevices));
    }
  }, [pairedDevices]);

  if (!isOpen) return null;

  const savePairedDevice = (device: BluetoothDeviceInfo) => {
    setPairedDevices((prev) => {
      const exists = prev.some((d) => d.id === device.id);
      if (exists) {
        return prev.map((d) => (d.id === device.id ? device : d));
      }
      return [device, ...prev];
    });
  };

  /**
   * REAL WEB BLUETOOTH SCAN
   * Opens the browser's native Bluetooth pairing dialog.
   * Any running prototype (ESP32 / Deneyap) will show up there!
   */
  const handleRealBluetoothScan = async () => {
    setErrorMessage(null);
    setIsIframeBlocked(false);
    setIsScanning(true);

    try {
      const realDevice = await hardwareConnection.scanAndConnectBluetooth();
      savePairedDevice(realDevice);
      onConnect(realDevice);
      onClose();
    } catch (err: unknown) {
      console.error('[Bluetooth] Eşleşme hatası:', err);
      if (err instanceof Error) {
        // Check for user cancellation
        if (err.name === 'NotFoundError') {
          setErrorMessage('Cihaz seçimi iptal edildi.');
        } else if (err.name === 'SecurityError' || err.message.includes('iframe') || err.message.includes('permissions policy')) {
          setIsIframeBlocked(true);
          setErrorMessage('Tarayıcı güvenlik kısıtı: Bluetooth araması iframe içinde kısıtlandı. Lütfen aşağıdaki "Yeni Sekmede Aç" butonunu kullanarak doğrudan tam ekranda açın.');
        } else if (!hardwareConnection.isWebBluetoothSupported()) {
          setErrorMessage('Tarayıcınız Web Bluetooth API desteklemiyor. Lütfen Chrome, Edge veya Opera kullanın.');
        } else {
          setErrorMessage(`Bluetooth bağlantı uyarısı: ${err.message}`);
        }
      }
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * REAL WEB SERIAL SCAN (Bluetooth SPP Virtual COM Port or USB-C cable)
   */
  const handleRealSerialScan = async () => {
    setErrorMessage(null);
    setIsIframeBlocked(false);
    setIsScanning(true);

    try {
      const realDevice = await hardwareConnection.scanAndConnectSerial(115200);
      savePairedDevice(realDevice);
      onConnect(realDevice);
      onClose();
    } catch (err: unknown) {
      console.error('[Serial] Port hatası:', err);
      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          setErrorMessage('Seri port seçimi iptal edildi.');
        } else if (err.name === 'SecurityError') {
          setIsIframeBlocked(true);
          setErrorMessage('Tarayıcı güvenlik kısıtı: Seri port araması iframe içinde kısıtlandı. Lütfen "Yeni Sekmede Aç" butonuna basın.');
        } else if (!hardwareConnection.isWebSerialSupported()) {
          setErrorMessage('Web Serial API desteklenmiyor. Lütfen Google Chrome veya Microsoft Edge kullanın.');
        } else {
          setErrorMessage(`Seri port bağlantı uyarısı: ${err.message}`);
        }
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleConnectSimulated = (device: BluetoothDeviceInfo) => {
    onConnect(device);
    onClose();
  };

  const handleOpenNewTab = () => {
    hardwareConnection.openInStandaloneTab();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      id="bluetooth-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-sky-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
        id="bluetooth-modal-card"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50/40 to-blue-50/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight tracking-tight">
                Bluetooth & Prototip Bağlantısı
              </h2>
              <p className="text-xs text-slate-500">
                Fiziksel Akıllı Şişe Prototipinizi Eşleştirin
              </p>
            </div>
          </div>
          <button
            id="btn-close-bluetooth-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Current Status Card */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
            status === 'connected' 
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : status === 'connecting'
              ? 'bg-amber-50/90 border-amber-300 text-amber-950 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className={`w-3 h-3 rounded-full shrink-0 ${
                status === 'connected' ? 'bg-emerald-500 ring-4 ring-emerald-200 animate-pulse' :
                status === 'connecting' ? 'bg-amber-500 animate-ping' : 'bg-slate-400'
              }`} />
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <span>
                    {status === 'connected' ? `Bağlandı: ${connectedDevice?.name}` :
                     status === 'connecting' ? 'Prototip Aranıyor / Bağlanıyor...' : 'Bağlı Cihaz Yok'}
                  </span>
                  {status === 'connected' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-200/80 text-emerald-900 font-extrabold font-mono uppercase">
                      {connectedDevice?.type === 'ble' ? 'Gerçek BLE' : connectedDevice?.type === 'web_serial' ? 'Gerçek COM/USB' : 'Simüle'}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {status === 'connected' 
                    ? `Canlı Şişe Seviyesi: ${currentBottleMl} ml • Veri Alınıyor` 
                    : 'Aşağıdaki tarama butonlarıyla prototipinize bağlanabilirsiniz.'}
                </div>
              </div>
            </div>

            {status === 'connected' && (
              <button
                id="btn-disconnect-bt"
                type="button"
                onClick={onDisconnect}
                className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-300 shadow-xs cursor-pointer transition-all shrink-0 ml-2"
              >
                Bağlantıyı Kes
              </button>
            )}
          </div>

          {/* Error / Warning Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">{errorMessage}</span>
                {isIframeBlocked && (
                  <button
                    type="button"
                    onClick={handleOpenNewTab}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs mt-1 shadow-xs cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Uygulamayı Yeni Sekmede Aç (Tam Donanım Erişimi)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Iframe tip */}
          {isInsideIframe && !errorMessage && (
            <div className="p-3 rounded-2xl bg-sky-50/70 border border-sky-200/70 text-sky-900 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="text-[11px]">
                  Prototipinizi doğrudan bağlamak için tarayıcının Bluetooth penceresi açılacaktır.
                </span>
              </div>
              <button
                type="button"
                onClick={handleOpenNewTab}
                title="Tam ekranda aç"
                className="text-[11px] font-bold text-sky-700 hover:text-sky-800 underline whitespace-nowrap cursor-pointer shrink-0"
              >
                Yeni Sekmede Aç ↗
              </button>
            </div>
          )}

          {/* PRIMARY ACTION: REAL WEB BLUETOOTH SCAN */}
          <div className="space-y-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-sky-600" />
              <span>1. Gerçek Bluetooth Eşleştirme (Kablosuz)</span>
            </span>

            <button
              id="btn-real-bluetooth-scan"
              type="button"
              onClick={handleRealBluetoothScan}
              disabled={isScanning}
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-sky-600 via-sky-500 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white shadow-lg shadow-sky-500/25 flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <Bluetooth className={`w-5 h-5 ${isScanning ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                </div>
                <div>
                  <div className="font-extrabold text-sm tracking-tight">
                    {isScanning ? 'Bluetooth Cihazları Taranıyor...' : 'Gerçek Bluetooth Cihazı Tara & Bağlan'}
                  </div>
                  <div className="text-xs text-sky-100 font-normal">
                    Prototipinizi açın • Tarayıcı penceresinde cihazınız gözükecektir
                  </div>
                </div>
              </div>

              <div className="px-3 py-1 rounded-xl bg-white/20 text-xs font-bold backdrop-blur-xs shrink-0">
                {isScanning ? 'Aranıyor...' : 'Tara ➜'}
              </div>
            </button>
          </div>

          {/* SECONDARY ACTION: REAL WEB SERIAL (Bluetooth SPP Virtual COM Port & USB-C) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Cable className="w-3.5 h-3.5 text-cyan-600" />
              <span>2. Bluetooth SPP / Seri Port (COM & USB)</span>
            </span>

            <button
              id="btn-real-serial-scan"
              type="button"
              onClick={handleRealSerialScan}
              disabled={isScanning}
              className="w-full p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-800 flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Bluetooth SPP (Sanal COM Portu) veya USB Bağla
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Windows/Mac Bluetooth ile eşleşmiş SPP portundan veya kabloyla veri okur
                  </div>
                </div>
              </div>

              <span className="text-xs font-bold text-cyan-700 px-2.5 py-1 rounded-lg bg-cyan-50 border border-cyan-200">
                Port Seç
              </span>
            </button>
          </div>

          {/* PAIRED / SAVED REAL PROTOTYPES */}
          {pairedDevices.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Kayıtlı Prototip Cihazlarım
              </span>

              <div className="space-y-1.5">
                {pairedDevices.map((device) => {
                  const isCurrent = connectedDevice?.id === device.id && status === 'connected';
                  return (
                    <div
                      key={device.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-emerald-50 border-emerald-300 shadow-xs' 
                          : 'bg-white border-slate-200 hover:border-sky-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${
                          isCurrent ? 'bg-emerald-500 text-white' : 'bg-sky-100 text-sky-700'
                        }`}>
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span>{device.name}</span>
                            {isCurrent && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 font-extrabold">
                                Aktif
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {device.type === 'ble' ? 'Bluetooth BLE' : 'Seri COM'} • {device.address}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRealBluetoothScan}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 cursor-pointer"
                      >
                        {isCurrent ? 'Bağlı' : 'Bağlan'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIMULATION FALLBACK (COLLAPSIBLE) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowSimulated(!showSimulated)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Donanım Yokken Test Etmek İçin (Sanal Simülatör)</span>
              </div>
              {showSimulated ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSimulated && (
              <div className="space-y-1.5 pt-2 animate-fadeIn">
                {PRESET_SIMULATED_DEVICES.map((device) => {
                  const isCurrent = connectedDevice?.id === device.id && status === 'connected';
                  return (
                    <div
                      key={device.id}
                      onClick={() => handleConnectSimulated(device)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'border-emerald-300 bg-emerald-50'
                          : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-xs font-medium text-slate-700">{device.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{device.address} • Simüle</div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-sky-600">
                        {isCurrent ? 'Seçili' : 'Simüle Bağlan'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            ESP32 Bluetooth SPP & BLE Destekli
          </span>
          <button
            id="btn-modal-cancel"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl cursor-pointer shadow-xs transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
