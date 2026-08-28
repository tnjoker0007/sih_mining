# MineGuard Module 1: IoT & AI Safety Monitoring System

Welcome to **Module 1 (IoT & AI)** of the MineGuard Mining Safety Platform.

## 📌 Module Scope & Features

This module handles real-time environmental IoT sensor data ingestion, hazard threshold monitoring, AI anomaly detection, and predictive risk scoring for underground mining environments.

### Key Components:
- **IoT Layer (`/iot`)**: Collects telemetry data (Methane, Carbon Monoxide, Temperature, Humidity, Structural Vibration).
- **AI Analytics Layer (`/ai`)**: Detects gas spikes, structural instability, and computes a dynamic Mine Safety Index (0-100).
- **API Gateway (`/api`)**: REST API exposing endpoints for telemetry streaming and real-time alert broadcasts.
- **Config (`/config`)**: Customizable safety thresholds and sensor calibration settings.

---

## 🛠 Directory Layout

```
module_1_iot_ai/
├── config/
│   └── config.json           # Safety thresholds & alert settings
├── iot/
│   ├── sensor_reader.py      # Real-time sensor data simulator/ingestion
│   └── telemetry_service.py  # Telemetry stream & alert evaluation
├── ai/
│   ├── anomaly_detector.py   # AI anomaly detection model
│   └── risk_predictor.py     # Dynamic Risk Index calculator
├── api/
│   └── app.py                # REST API endpoints
└── tests/
    └── test_iot_ai.py        # Automated unit & integration tests
```
