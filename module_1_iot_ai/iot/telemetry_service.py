import json
import os
from typing import Dict, Any, List

class TelemetryService:
    """
    Evaluates IoT telemetry readings against safety threshold rules.
    """

    def __init__(self, config_path: str = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "config.json")
        
        with open(config_path, "r", encoding="utf-8") as f:
            self.config = json.load(f)
        
        self.thresholds = self.config.get("sensor_thresholds", {})

    def evaluate_telemetry(self, telemetry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates current telemetry against warning and critical safety levels.
        """
        alerts: List[Dict[str, str]] = []
        status = "SAFE"

        # Check CH4 Methane
        ch4 = telemetry.get("methane_ch4_percent", 0.0)
        ch4_thresh = self.thresholds.get("methane_ch4_percent", {})
        if ch4 >= ch4_thresh.get("critical", 1.5):
            status = "CRITICAL"
            alerts.append({"type": "METHANE_CRITICAL", "message": f"Methane level {ch4}% exceeds CRITICAL limit ({ch4_thresh.get('critical')}%). EVACUATE!"})
        elif ch4 >= ch4_thresh.get("warning", 1.0):
            if status != "CRITICAL":
                status = "WARNING"
            alerts.append({"type": "METHANE_WARNING", "message": f"Methane level {ch4}% exceeds WARNING limit ({ch4_thresh.get('warning')}%)."})

        # Check CO Carbon Monoxide
        co = telemetry.get("carbon_monoxide_co_ppm", 0.0)
        co_thresh = self.thresholds.get("carbon_monoxide_co_ppm", {})
        if co >= co_thresh.get("critical", 50.0):
            status = "CRITICAL"
            alerts.append({"type": "CO_CRITICAL", "message": f"CO level {co}ppm exceeds CRITICAL limit ({co_thresh.get('critical')}ppm). EVACUATE!"})
        elif co >= co_thresh.get("warning", 25.0):
            if status != "CRITICAL":
                status = "WARNING"
            alerts.append({"type": "CO_WARNING", "message": f"CO level {co}ppm exceeds WARNING limit ({co_thresh.get('warning')}ppm)."})

        # Check Vibration (Structural Instability)
        vib = telemetry.get("vibration_g", 0.0)
        vib_thresh = self.thresholds.get("vibration_g", {})
        if vib >= vib_thresh.get("critical", 4.5):
            status = "CRITICAL"
            alerts.append({"type": "VIBRATION_CRITICAL", "message": f"Vibration level {vib}g indicates structural failure risk! EVACUATE!"})

        return {
            "station_id": telemetry.get("station_id"),
            "timestamp": telemetry.get("timestamp"),
            "status": status,
            "alerts": alerts,
            "telemetry": telemetry
        }
