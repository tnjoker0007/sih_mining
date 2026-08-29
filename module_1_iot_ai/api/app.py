import os
import sys
from typing import Dict, Any

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from iot.sensor_reader import IoTSensorReader
from iot.telemetry_service import TelemetryService
from ai.anomaly_detector import AIAnomalyDetector
from ai.risk_predictor import AIRiskPredictor

from flask import Flask, jsonify, send_from_directory, request

class MineGuardModule1App:
    def __init__(self, serial_port: str = None):
        self.sensor_reader = IoTSensorReader(port=serial_port)
        self.telemetry_service = TelemetryService()
        self.anomaly_detector = AIAnomalyDetector()
        self.risk_predictor = AIRiskPredictor()

    def get_live_monitoring_data(self) -> Dict[str, Any]:
        raw_telemetry = self.sensor_reader.read_telemetry()
        eval_data = self.telemetry_service.evaluate_telemetry(raw_telemetry)
        is_anomaly, anomaly_score, reason = self.anomaly_detector.analyze_anomaly(raw_telemetry)
        risk_info = self.risk_predictor.calculate_risk_index(raw_telemetry, anomaly_score)

        return {
            "station": eval_data["station_id"],
            "timestamp": eval_data["timestamp"],
            "status": eval_data["status"],
            "ai_anomaly": {
                "detected": is_anomaly,
                "score": anomaly_score,
                "reason": reason
            },
            "risk_index": risk_info,
            "alerts": eval_data["alerts"],
            "raw_telemetry": raw_telemetry
        }

# Flask Application Setup
flask_app = Flask(__name__, static_folder="../web")
module1_app = MineGuardModule1App()

@flask_app.route("/")
def serve_index():
    return send_from_directory("../web", "index.html")

@flask_app.route("/band")
def serve_band():
    return send_from_directory("../web", "band.html")

@flask_app.route("/telemetry")
def serve_telemetry():
    return send_from_directory("../web", "telemetry.html")

@flask_app.route("/api/telemetry", methods=["GET"])
def get_telemetry():
    data = module1_app.get_live_monitoring_data()
    return jsonify(data)

if __name__ == "__main__":
    import json
    print("Starting MineGuard Module 1 IoT & AI Server on http://localhost:5000 ...")
    flask_app.run(host="0.0.0.0", port=5000, debug=False)

