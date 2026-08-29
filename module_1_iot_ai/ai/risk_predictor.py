from typing import Dict, Any

class AIRiskPredictor:
    """
    Computes a real-time Mine Safety Risk Index (0 - 100).
    0-35: LOW RISK
    36-70: MODERATE RISK
    71-100: HIGH RISK / DANGER
    """

    def calculate_risk_index(self, telemetry: Dict[str, Any], anomaly_score: float) -> Dict[str, Any]:
        base_risk = anomaly_score * 100.0
        
        # Additional safety factors
        if telemetry.get("local_alert") or telemetry.get("remote_alert") or telemetry.get("tilt_deg", 0) >= 1.5:
            base_risk += 100.0
        elif telemetry.get("tilt_deg", 0) >= 1.0:
            base_risk += 35.0
        if telemetry.get("methane_ch4_percent", 0) > 1.5:
            base_risk += 20.0
        if telemetry.get("carbon_monoxide_co_ppm", 0) > 50.0:
            base_risk += 15.0
            
        risk_score = round(min(max(base_risk, 0.0), 100.0), 1)

        if risk_score >= 70.0:
            category = "HIGH RISK - EVACUATE"
        elif risk_score >= 35.0:
            category = "MODERATE RISK - MONITOR"
        else:
            category = "LOW RISK - SAFE"

        return {
            "risk_score": risk_score,
            "category": category
        }
