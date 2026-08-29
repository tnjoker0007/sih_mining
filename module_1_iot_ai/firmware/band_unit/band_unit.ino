#include <Wire.h>
#include <WiFi.h>
#include <esp_now.h>
#include <Adafruit_SSD1306.h>
#include <math.h>
#include "BluetoothA2DPSource.h"

// 🎧 BLUETOOTH HEADSET NAME
BluetoothA2DPSource a2dp_source;
const char* targetHeadset = "Immortal Katana Blade 2.0";

#define BUZZER_PIN 4
#define TILT_THRESHOLD 1.5 
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

// 📡 2-Way ESP-NOW Emergency Payload
typedef struct struct_message {
  char alertMsg[32];
} struct_message;

struct_message txData;
struct_message rxData;

float baseAX = 0, baseAY = 0, baseAZ = 0;
bool oledReady = false;
volatile unsigned long lastBoxAlertTime = 0;
bool isAudioAlertActive = false;

char chipIdStr[18];

// 🎧 Bluetooth A2DP Audio Sweep Siren (44.1kHz PCM)
int32_t get_sound_data(Frame *frame, int32_t frame_count) {
  static float phase = 0, freq = 800;
  static bool rising = true;

  for (int i = 0; i < frame_count; i++) {
    if (isAudioAlertActive) {
      if (rising) { freq += 0.5; if (freq >= 1600) rising = false; }
      else { freq -= 0.5; if (freq <= 800) rising = true; }

      float sample = sin(phase) * 15000.0;
      phase += (2.0 * M_PI * freq) / 44100.0;
      if (phase >= 2.0 * M_PI) phase -= 2.0 * M_PI;

      frame[i].channel1 = (int16_t)sample;
      frame[i].channel2 = (int16_t)sample;
    } else {
      frame[i].channel1 = 0; frame[i].channel2 = 0;
    }
  }
  return frame_count;
}

void initMPU() {
  Wire.beginTransmission(0x68);
  Wire.write(0x6B);
  Wire.write(0x00);
  Wire.endTransmission(true);
}

void readMPU(float &ax, float &ay, float &az) {
  Wire.beginTransmission(0x68);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(0x68, 6, true);
  if (Wire.available() >= 6) {
    ax = ((int16_t)(Wire.read() << 8 | Wire.read()) / 16384.0) * 9.81;
    ay = ((int16_t)(Wire.read() << 8 | Wire.read()) / 16384.0) * 9.81;
    az = ((int16_t)(Wire.read() << 8 | Wire.read()) / 16384.0) * 9.81;
  }
}

void soundBuzzer(bool enable) {
  if (enable) tone(BUZZER_PIN, 2500);
  else { noTone(BUZZER_PIN); digitalWrite(BUZZER_PIN, LOW); }
}

// 📡 RECEIVE BOX EMERGENCY ALERTS OVER ESP-NOW
void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&rxData, incomingData, sizeof(rxData));
  if (strstr(rxData.alertMsg, "BOX_ALERT") != NULL) {
    lastBoxAlertTime = millis();
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  soundBuzzer(false);
  Wire.begin(21, 22);

  uint64_t chipid = ESP.getEfuseMac();
  snprintf(chipIdStr, sizeof(chipIdStr), "%04X%08X", (uint16_t)(chipid >> 32), (uint32_t)chipid);

  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    oledReady = true;
  }

  // 🛡️ 3-SECOND MINEGUARD CALIBRATION SCREEN & PROGRESS BAR
  initMPU();
  float sX = 0, sY = 0, sZ = 0;
  int numSamples = 30;
  for (int i = 0; i < numSamples; i++) {
    float ax, ay, az; readMPU(ax, ay, az);
    sX += ax; sY += ay; sZ += az;

    if (oledReady) {
      display.clearDisplay();
      display.setTextSize(2);
      display.setTextColor(SSD1306_WHITE);
      display.setCursor(10, 6);
      display.println("MINEGUARD");
      display.setTextSize(1);
      display.setCursor(12, 30);
      display.println("Calibrating MPU...");
      display.drawRect(12, 46, 104, 10, SSD1306_WHITE);
      int progressWidth = map(i + 1, 1, numSamples, 0, 100);
      display.fillRect(14, 48, progressWidth, 6, SSD1306_WHITE);
      display.display();
    }
    delay(100);
  }
  baseAX = sX / (float)numSamples;
  baseAY = sY / (float)numSamples;
  baseAZ = sZ / (float)numSamples;

  WiFi.mode(WIFI_STA);

  // Initialize Bluetooth Master Driver targeting Katana Headset
  a2dp_source.set_auto_reconnect(true);
  a2dp_source.start(targetHeadset, get_sound_data);

  if (esp_now_init() == ESP_OK) {
    esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, broadcastAddress, 6);
    esp_now_add_peer(&peerInfo);
  }
}

void loop() {
  float ax, ay, az; readMPU(ax, ay, az);
  float dX = ax - baseAX, dY = ay - baseAY, dZ = az - baseAZ;
  float tiltAngle = (sqrt(dX * dX + dY * dY + dZ * dZ) / 9.81) * 57.3;
  bool localAlert = (tiltAngle >= TILT_THRESHOLD);

  if (localAlert) {
    strcpy(txData.alertMsg, "BAND_ALERT");
    esp_now_send(broadcastAddress, (uint8_t *)&txData, sizeof(txData));
  } else {
    strcpy(txData.alertMsg, "BAND_OK");
    esp_now_send(broadcastAddress, (uint8_t *)&txData, sizeof(txData));
  }

  bool remoteAlert = (millis() - lastBoxAlertTime < 2500);
  bool btConnected = a2dp_source.is_connected();
  isAudioAlertActive = localAlert || remoteAlert;
  soundBuzzer(isAudioAlertActive);

  // 📺 5-LINE OLED DISPLAY
  if (oledReady) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.println("--- MINEGUARD SYSTEM ---");
    display.print("Tilt  : "); display.print(tiltAngle, 2); display.println(" deg");
    display.print("BT    : "); display.println(btConnected ? "KATANA READY" : "SEARCHING...");
    display.print("LOCAL : "); display.println(localAlert ? "ALERT!" : "OK");
    display.print("REMOTE: "); display.println(remoteAlert ? "ALERT!" : "OK");
    display.display();
  }

  // 📡 USB Serial Stream Backup for Python Web Dashboard
  Serial.print("{\"station_id\":\"BAND-NODE-01\",\"hardware_chip_id\":\"");
  Serial.print(chipIdStr);
  Serial.print("\",\"tilt_deg\":");
  Serial.print(tiltAngle, 2);
  Serial.print(",\"vibration_g\":");
  Serial.print(tiltAngle * 0.5, 2);
  Serial.print(",\"local_alert\":");
  Serial.print(localAlert ? "true" : "false");
  Serial.print(",\"remote_alert\":");
  Serial.print(remoteAlert ? "true" : "false");
  Serial.print(",\"bt_connected\":");
  Serial.print(btConnected ? "true" : "false");
  Serial.println("}");

  delay(150);
}
