/*
 * AquaMind - Deneyap Kart 1A firmware
 *
 * Ultrasonik sensörle şişedeki su seviyesini ölçer, 16x2 I2C LCD'ye yazar
 * ve BLE (Nordic UART Service) üzerinden AquaMind uygulamasına gönderir.
 * Aynı veri USB seri porttan da (115200 baud) basılır.
 *
 * Uygulamaya giden format: her satırda tek sayı, ml cinsinden. Örnek: "450\n"
 *
 * Gerekli kütüphane (Arduino IDE > Kütüphane Yöneticisi):
 *   - "LiquidCrystal I2C" (Frank de Brabander)
 * BLE kütüphanesi ESP32 / Deneyap kart paketiyle birlikte gelir.
 *
 * Kart seçimi: Araçlar > Kart > Deneyap Mikrodenetleyiciler > Deneyap Kart 1A
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLE2902.h>

// ===================== AYARLAR (kendi donanımına göre düzenle) =====================

// Ultrasonik sensör pinleri (HC-SR04 vb.)
#define TRIG_PIN D4
#define ECHO_PIN D5
// NOT: HC-SR04 5V ile beslenirse ECHO pini 5V verir. Deneyap Kart 3.3V'tur;
// ECHO hattına gerilim bölücü koyun (ör. ECHO -> 1k -> PIN -> 2k -> GND).

// LCD: 16x2, I2C adresi genelde 0x27 (bazı modüllerde 0x3F).
// SDA/SCL için kartın üzerinde SDA ve SCL yazan pinleri kullanın.
#define LCD_ADRES 0x27

// Şişe ölçüleri (cm). Sensör kapakta, aşağıya bakacak şekilde varsayılmıştır.
const float SENSOR_DIP_MESAFE_CM = 20.0;  // şişe boşken sensörün ölçtüğü mesafe
const float SISE_IC_CAP_CM       = 7.0;   // şişenin iç çapı
const int   SISE_KAPASITE_ML     = 750;   // üst sınır (taşma/gürültü için)

const int GUNLUK_HEDEF_ML  = 2500;  // LCD'deki yüzde için
const int YUDUM_ESIK_ML    = 15;    // bundan küçük düşüşler gürültü sayılır
const unsigned long OLCUM_ARALIGI_MS = 1000;

// =================================================================================

#define NUS_SERVICE_UUID "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define NUS_RX_UUID      "6e400002-b5a3-f393-e0a9-e50e24dcca9e"  // uygulama -> kart
#define NUS_TX_UUID      "6e400003-b5a3-f393-e0a9-e50e24dcca9e"  // kart -> uygulama (notify)

LiquidCrystal_I2C lcd(LCD_ADRES, 16, 2);
BLEServer *bleServer = nullptr;
BLECharacteristic *txChar = nullptr;
volatile bool bleBagli = false;

int sonMl = -1;          // son kararlı ölçüm
int bugunIcilenMl = 0;   // kart açıldığından beri içilen

class SunucuCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *) override { bleBagli = true; }
  void onDisconnect(BLEServer *s) override {
    bleBagli = false;
    s->startAdvertising();  // bağlantı koparsa tekrar görünür ol
  }
};

float mesafeOkuCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  unsigned long sure = pulseIn(ECHO_PIN, HIGH, 30000UL);  // ~5 m zaman aşımı
  if (sure == 0) return -1;
  return sure * 0.0343f / 2.0f;
}

// 5 ölçümün medyanı: ani sıçramaları eler
float kararliMesafeCm() {
  float d[5];
  int n = 0;
  for (int i = 0; i < 5; i++) {
    float m = mesafeOkuCm();
    if (m > 0) d[n++] = m;
    delay(30);
  }
  if (n == 0) return -1;
  for (int i = 1; i < n; i++) {
    float k = d[i];
    int j = i - 1;
    while (j >= 0 && d[j] > k) { d[j + 1] = d[j]; j--; }
    d[j + 1] = k;
  }
  return d[n / 2];
}

int mesafedenMl(float mesafeCm) {
  float suYuksekligi = SENSOR_DIP_MESAFE_CM - mesafeCm;
  if (suYuksekligi < 0) suYuksekligi = 0;
  float r = SISE_IC_CAP_CM / 2.0f;
  int ml = (int)(PI * r * r * suYuksekligi);  // 1 cm³ = 1 ml
  return constrain(ml, 0, SISE_KAPASITE_ML);
}

void lcdGuncelle(int ml) {
  char satir1[17], satir2[17];
  int yuzde = min(99, (int)((bugunIcilenMl * 100L) / GUNLUK_HEDEF_ML));
  snprintf(satir1, sizeof(satir1), "AquaMind  %4dml", ml);
  snprintf(satir2, sizeof(satir2), "Bugun:%dml %%%d", bugunIcilenMl, yuzde);
  lcd.setCursor(0, 0);
  lcd.print(satir1);
  for (int i = strlen(satir1); i < 16; i++) lcd.print(' ');
  lcd.setCursor(0, 1);
  lcd.print(satir2);
  // sağ alt köşede BLE durumu
  for (int i = strlen(satir2); i < 15; i++) lcd.print(' ');
  lcd.setCursor(15, 1);
  lcd.print(bleBagli ? '*' : ' ');
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  Wire.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("AquaMind");
  lcd.setCursor(0, 1);
  lcd.print("Baslatiliyor...");

  BLEDevice::init("AquaMind-Sise");
  bleServer = BLEDevice::createServer();
  bleServer->setCallbacks(new SunucuCallbacks());
  BLEService *servis = bleServer->createService(NUS_SERVICE_UUID);
  txChar = servis->createCharacteristic(NUS_TX_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  txChar->addDescriptor(new BLE2902());
  servis->createCharacteristic(NUS_RX_UUID, BLECharacteristic::PROPERTY_WRITE);  // ileride kullanım için
  servis->start();

  BLEAdvertising *reklam = BLEDevice::getAdvertising();
  reklam->addServiceUUID(NUS_SERVICE_UUID);
  reklam->setScanResponse(true);
  BLEDevice::startAdvertising();

  Serial.println("AquaMind hazir. BLE adi: AquaMind-Sise");
}

void loop() {
  static unsigned long sonOlcum = 0;
  if (millis() - sonOlcum < OLCUM_ARALIGI_MS) return;
  sonOlcum = millis();

  float mesafe = kararliMesafeCm();
  if (mesafe < 0) {
    lcd.setCursor(0, 1);
    lcd.print("Sensor hatasi!  ");
    return;
  }

  int ml = mesafedenMl(mesafe);

  if (sonMl < 0) {
    sonMl = ml;
  } else if (sonMl - ml >= YUDUM_ESIK_ML) {
    bugunIcilenMl += sonMl - ml;  // seviye düştü -> içildi
    sonMl = ml;
  } else if (ml - sonMl >= YUDUM_ESIK_ML) {
    sonMl = ml;                   // seviye arttı -> şişe dolduruldu
  }

  lcdGuncelle(sonMl);

  char satir[12];
  snprintf(satir, sizeof(satir), "%d\n", sonMl);
  Serial.print(satir);
  if (bleBagli) {
    txChar->setValue((uint8_t *)satir, strlen(satir));
    txChar->notify();
  }
}
