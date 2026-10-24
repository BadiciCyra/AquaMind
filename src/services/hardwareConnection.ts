/**
 * AquaMind Real Hardware Connection Engine
 * Supports:
 * 1. Web Bluetooth (BLE GATT UART) for wireless connection to ESP32 / Deneyap Kart 1A
 * 2. Web Serial API for Bluetooth Classic SPP virtual COM port & USB-C serial
 */

import { BluetoothDeviceInfo } from '../types';

// Common BLE UART Services across ESP32 / Arduino
const KNOWN_UART_SERVICES = [
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (Most common on ESP32 BLE)
  '0000ffe0-0000-1000-8000-00805f9b34fb', // HM-10 / CC2541 / DFRobot BLE Serial
  '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
  'generic_access',
];

const NORDIC_UART_RX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Peripheral notify to client
const HM10_CHAR = '0000ffe1-0000-1000-8000-00805f9b34fb';

type DataCallback = (ml: number, raw: string) => void;
type StatusCallback = (status: 'disconnected' | 'connecting' | 'connected', device: BluetoothDeviceInfo | null, error?: string) => void;

interface WebBluetoothDeviceWithGatt {
  id: string;
  name?: string;
  gatt?: {
    connected: boolean;
    connect: () => Promise<unknown>;
    disconnect: () => void;
  };
  addEventListener: (event: string, listener: (e: unknown) => void) => void;
  removeEventListener: (event: string, listener: (e: unknown) => void) => void;
}

class HardwareConnectionManager {
  private activeBleDevice: WebBluetoothDeviceWithGatt | null = null;
  private activeGattServer: unknown | null = null;
  private activeSerialPort: unknown | null = null;
  private serialReader: unknown | null = null;
  private isSerialReading = false;
  
  private onDataCallback: DataCallback | null = null;
  private onStatusCallback: StatusCallback | null = null;
  
  private textBuffer = '';
  private currentDevice: BluetoothDeviceInfo | null = null;

  public setCallbacks(onData: DataCallback, onStatus: StatusCallback) {
    this.onDataCallback = onData;
    this.onStatusCallback = onStatus;
  }

  public isWebBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public isWebSerialSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in (navigator as unknown as { serial?: unknown });
  }

  public isInsideIframe(): boolean {
    try {
      return typeof window !== 'undefined' && window.self !== window.top;
    } catch {
      return true;
    }
  }

  public openInStandaloneTab() {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  }

  /**
   * Connects to a real Bluetooth device using Web Bluetooth API.
   * This triggers the native browser dialog where the user's real prototype appears!
   */
  public async scanAndConnectBluetooth(): Promise<BluetoothDeviceInfo> {
    if (!this.isWebBluetoothSupported()) {
      throw new Error(
        'Tarayıcınız Web Bluetooth API desteklemiyor. Lütfen Google Chrome, Microsoft Edge, Opera veya Android Chrome kullanın.'
      );
    }

    const nav = navigator as unknown as {
      bluetooth: {
        requestDevice: (options: {
          acceptAllDevices?: boolean;
          optionalServices?: string[];
        }) => Promise<WebBluetoothDeviceWithGatt>;
      };
    };

    this.onStatusCallback?.('connecting', null);

    try {
      // Prompt native browser device picker
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_UART_SERVICES,
      });

      this.activeBleDevice = device;

      const deviceInfo: BluetoothDeviceInfo = {
        id: device.id,
        name: device.name || 'Gerçek Bluetooth Şişe (ESP32)',
        address: device.id.slice(0, 17).toUpperCase(),
        type: 'ble',
        rssi: -45,
      };
      this.currentDevice = deviceInfo;

      // Handle spontaneous disconnection
      device.addEventListener('gattserverdisconnected', () => {
        console.log('[Bluetooth] Cihaz bağlantısı koptu:', device.name);
        this.currentDevice = null;
        this.activeBleDevice = null;
        this.activeGattServer = null;
        this.onStatusCallback?.('disconnected', null);
      });

      // Connect to GATT Server
      if (!device.gatt) {
        throw new Error('Cihaz GATT sunucusu sunmuyor.');
      }

      console.log('[Bluetooth] GATT bağlanıyor...');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const server = (await device.gatt.connect()) as any;
      this.activeGattServer = server;

      // Try discovering known services and notification characteristics
      let notificationStarted = false;

      for (const serviceUuid of KNOWN_UART_SERVICES) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          if (service) {
            // Try known characteristics
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.notify || char.properties.indicate) {
                await char.startNotifications();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                char.addEventListener('characteristicvaluechanged', (e: any) => {
                  this.handleIncomingBlePacket(e.target.value);
                });
                notificationStarted = true;
                console.log('[Bluetooth] Bildirim dinleyicisi aktif edildi:', char.uuid);
                break;
              }
            }
          }
          if (notificationStarted) break;
        } catch {
          // Service might not exist on this specific peripheral, check next
        }
      }

      // If no standard UART found, notify connected anyway (data may be read periodically or via general notify)
      this.onStatusCallback?.('connected', deviceInfo);
      return deviceInfo;
    } catch (err: unknown) {
      this.activeBleDevice = null;
      this.activeGattServer = null;
      this.currentDevice = null;

      const errorMsg = err instanceof Error ? err.message : String(err);
      this.onStatusCallback?.('disconnected', null, errorMsg);
      throw err;
    }
  }

  /**
   * Connects via Web Serial API.
   * Perfect for Bluetooth Classic SPP virtual COM ports (Windows/Mac/Linux) or direct USB cable.
   */
  public async scanAndConnectSerial(baudRate = 115200): Promise<BluetoothDeviceInfo> {
    if (!this.isWebSerialSupported()) {
      throw new Error(
        'Tarayıcınız Web Serial API desteklemiyor. Bluetooth SPP / USB bağlantısı için lütfen Google Chrome veya Microsoft Edge kullanın.'
      );
    }

    const nav = navigator as unknown as {
      serial: {
        requestPort: () => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
      };
    };

    this.onStatusCallback?.('connecting', null);

    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate });

      this.activeSerialPort = port;

      const deviceInfo: BluetoothDeviceInfo = {
        id: 'serial-com-' + Date.now(),
        name: 'Deneyap Kart 1A (Seri / Bluetooth SPP)',
        address: `COM-Port @ ${baudRate} baud`,
        type: 'web_serial',
        rssi: -30,
      };
      this.currentDevice = deviceInfo;

      this.startSerialReading(port);
      this.onStatusCallback?.('connected', deviceInfo);
      return deviceInfo;
    } catch (err: unknown) {
      this.activeSerialPort = null;
      this.currentDevice = null;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.onStatusCallback?.('disconnected', null, errorMsg);
      throw err;
    }
  }

  /**
   * Disconnects any active real connection
   */
  public async disconnect() {
    // 1. Disconnect BLE
    if (this.activeBleDevice && this.activeBleDevice.gatt?.connected) {
      try {
        this.activeBleDevice.gatt.disconnect();
      } catch (e) {
        console.warn('[Bluetooth] Disconnect hatası:', e);
      }
    }
    this.activeBleDevice = null;
    this.activeGattServer = null;

    // 2. Disconnect Serial
    if (this.activeSerialPort) {
      try {
        this.isSerialReading = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reader = this.serialReader as any;
        if (reader) {
          await reader.cancel();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const port = this.activeSerialPort as any;
        await port.close();
      } catch (e) {
        console.warn('[Serial] Port kapatma hatası:', e);
      }
    }
    this.activeSerialPort = null;
    this.serialReader = null;
    this.currentDevice = null;
    this.textBuffer = '';

    this.onStatusCallback?.('disconnected', null);
  }

  private handleIncomingBlePacket(dataView: DataView) {
    const decoder = new TextDecoder('utf-8');
    const chunk = decoder.decode(dataView);
    this.processRawChunk(chunk);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async startSerialReading(port: any) {
    this.isSerialReading = true;
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();
    this.serialReader = reader;

    try {
      while (this.isSerialReading) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          this.processRawChunk(value);
        }
      }
    } catch (err) {
      console.warn('[Serial] Okuma döngüsü sonlandı:', err);
    } finally {
      reader.releaseLock();
    }
  }

  private processRawChunk(chunk: string) {
    this.textBuffer += chunk;

    // Process complete lines ending with \n or \r\n
    if (this.textBuffer.includes('\n')) {
      const lines = this.textBuffer.split(/\r?\n/);
      // The last element is whatever remains incomplete after the last newline
      this.textBuffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Parse water ml: looking for numeric values (e.g. "450" or "Su: 450 ml" or "450\n")
        const match = trimmed.match(/\b(\d{1,4})\b/);
        if (match) {
          const parsedMl = parseInt(match[1], 10);
          if (!isNaN(parsedMl)) {
            // Cap between 0 and reasonable bottle capacity (e.g. 2000 ml)
            const sanitizedMl = Math.max(0, Math.min(2000, parsedMl));
            this.onDataCallback?.(sanitizedMl, trimmed + '\n');
          }
        }
      }
    }
  }
}

export const hardwareConnection = new HardwareConnectionManager();
