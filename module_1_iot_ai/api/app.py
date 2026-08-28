import os
import sys
from typing import Dict, Any

# Add parent directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from iot.sensor_reader import IoTSensorReader
from iot.telemetry_service import TelemetryService
from ai.anomaly_detector import AIAnomalyDetector
from ai.risk_predictor import AIRiskPredictor

class MineGuardModule1App:
    def __init__(self):
        self.sensor_reader = IoTSensorReader()
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

if __name__ == "__main__":
    app = MineGuardModule1App()
    result = app.get_live_monitoring_data()
    import json
    print(json.dumps(result, indent=2))
