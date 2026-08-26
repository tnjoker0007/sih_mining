import time
import random
from typing import Dict, Any

class IoTSensorReader:
    """
    Simulates or reads real-time IoT environmental sensor data
    from mine shaft monitoring stations.
    """

    def __init__(self, station_id: str = "MINE-SHAFT-01"):
        self.station_id = station_id

    def read_telemetry(self) -> Dict[str, Any]:
        """
        Generates/reads telemetry data from active IoT sensors.
        """
        telemetry = {
            "station_id": self.station_id,
            "timestamp": time.time(),
            "methane_ch4_percent": round(random.uniform(0.1, 1.8), 2),
            "carbon_monoxide_co_ppm": round(random.uniform(5.0, 55.0), 1),
            "temperature_celsius": round(random.uniform(22.0, 45.0), 1),
            "humidity_percent": round(random.uniform(55.0, 92.0), 1),
            "vibration_g": round(random.uniform(0.1, 5.0), 2)
        }
        return telemetry

if __name__ == "__main__":
    reader = IoTSensorReader()
    data = reader.read_telemetry()
    print("IoT Sensor Telemetry:", data)
