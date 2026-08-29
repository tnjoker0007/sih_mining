#include <Wire.h>
#include <WiFi.h>
#include <esp_now.h>

#define ALERT_BUTTON_PIN 0 // BOOT Button on BOX triggers emergency alert
#define BUZZER_PIN 4

uint8_t broadcastAddress[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};

typedef struct struct_message {
  char alertMsg[32];
} struct_message;

struct_message txData;
struct_message rxData;

volatile unsigned long lastBandAlertTime = 0;

void OnDataRecv(const uint8_t * mac, const uint8_t *incomingData, int len) {
  memcpy(&rxData, incomingData, sizeof(rxData));
  if (strstr(rxData.alertMsg, "BAND_ALERT") != NULL) {
    lastBandAlertTime = millis();
    Serial.println("🚨 EMERGENCY BAND ALERT RECEIVED ON BOX!");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ALERT_BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() == ESP_OK) {
    esp_now_register_recv_cb(esp_now_recv_cb_t(OnDataRecv));
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, broadcastAddress, 6);
    esp_now_add_peer(&peerInfo);
  }
}

void loop() {
  bool localBoxAlert = (digitalRead(ALERT_BUTTON_PIN) == LOW);
  bool remoteBandAlert = (millis() - lastBandBandAlertTime < 2500);

  if (localBoxAlert || remoteBandAlert) {
    tone(BUZZER_PIN, 2000);
  } else {
    noTone(BUZZER_PIN);
    digitalWrite(BUZZER_PIN, LOW);
  }

  if (localBoxAlert) {
    strcpy(txData.alertMsg, "BOX_ALERT");
  } else {
    strcpy(txData.alertMsg, "BOX_OK");
  }
  esp_now_send(broadcastAddress, (uint8_t *)&txData, sizeof(txData));

  delay(150);
}
