from typing import Dict, Any, Tuple

class AIAnomalyDetector:
    """
    AI Anomaly Detection Engine for Mine Shaft Environmental Hazards.
    Detects non-linear gas spikes, thermal runaway, and seismic vibration anomalies.
    """

    def analyze_anomaly(self, telemetry: Dict[str, Any]) -> Tuple[bool, float, str]:
        """
        Calculates an anomaly score [0.0 - 1.0] and determines if an AI anomaly is present.
        Returns: (is_anomaly, anomaly_score, reason)
        """
        ch4 = telemetry.get("methane_ch4_percent", 0.0)
        co = telemetry.get("carbon_monoxide_co_ppm", 0.0)
        temp = telemetry.get("temperature_celsius", 0.0)
        vibration = telemetry.get("vibration_g", 0.0)
        tilt = telemetry.get("tilt_deg", 0.0)

        # Composite AI risk weighting
        score = (ch4 / 2.0) * 0.3 + (co / 60.0) * 0.2 + (vibration / 5.0) * 0.2 + (temp / 60.0) * 0.1 + (tilt / 3.0) * 0.2
        score = min(max(score, 0.0), 1.0)

        is_anomaly = score >= 0.65
        reason = "Normal parameters"
        if is_anomaly:
            reasons = []
            if ch4 > 1.2: reasons.append("Gas Spike (CH4)")
            if co > 35.0: reasons.append("Toxic Gas Accumulation (CO)")
            if vibration > 3.0: reasons.append("Seismic Instability")
            if tilt >= 1.5: reasons.append(f"Ground Tilt Anomaly ({tilt}°)")
            reason = "Anomaly Detected: " + ", ".join(reasons) if reasons else "Multi-sensor compound risk anomaly"

        return is_anomaly, round(score, 3), reason
