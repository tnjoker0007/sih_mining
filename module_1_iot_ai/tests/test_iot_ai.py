import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from iot.sensor_reader import IoTSensorReader
from iot.telemetry_service import TelemetryService
from ai.anomaly_detector import AIAnomalyDetector
from ai.risk_predictor import AIRiskPredictor
from api.app import MineGuardModule1App

class TestMineGuardModule1(unittest.TestCase):

    def setUp(self):
        self.reader = IoTSensorReader()
        self.telemetry_service = TelemetryService()
        self.anomaly_detector = AIAnomalyDetector()
        self.risk_predictor = AIRiskPredictor()
        self.app = MineGuardModule1App()

    def test_sensor_reader(self):
        data = self.reader.read_telemetry()
        self.assertIn("methane_ch4_percent", data)
        self.assertIn("carbon_monoxide_co_ppm", data)

    def test_telemetry_service_critical_alert(self):
        telemetry = {
            "station_id": "TEST-01",
            "methane_ch4_percent": 2.0,  # > 1.5 critical
            "carbon_monoxide_co_ppm": 10.0,
            "vibration_g": 1.0
        }
        res = self.telemetry_service.evaluate_telemetry(telemetry)
        self.assertEqual(res["status"], "CRITICAL")
        self.assertGreater(len(res["alerts"]), 0)

    def test_anomaly_detector(self):
        telemetry = {
            "methane_ch4_percent": 1.8,
            "carbon_monoxide_co_ppm": 55.0,
            "vibration_g": 4.5,
            "temperature_celsius": 45.0
        }
        is_anomaly, score, reason = self.anomaly_detector.analyze_anomaly(telemetry)
        self.assertTrue(is_anomaly)
        self.assertGreaterEqual(score, 0.65)

    def test_full_application_flow(self):
        data = self.app.get_live_monitoring_data()
        self.assertIn("ai_anomaly", data)
        self.assertIn("risk_index", data)

if __name__ == "__main__":
    unittest.main()
