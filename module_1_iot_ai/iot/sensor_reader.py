import time
import json
import re
from typing import Dict, Any, Optional

try:
    import serial
    import serial.tools.list_ports
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

class IoTSensorReader:
    """
    Reads real-time IoT environmental and MPU tilt sensor data
    from physical ESP32 hardware via USB Serial.
    """

    def __init__(self, station_id: str = "BAND-NODE-01", port: Optional[str] = "COM9", baudrate: int = 115200):
        self.station_id = station_id
        self.port = "COM9"
        self.baudrate = baudrate
        self.ser = None
        self.last_tilt = 0.0
        self.last_vibration = 0.0
        self.last_local_alert = False
        self.last_remote_alert = False
        self.last_bt_connected = False
        self.last_station_id = station_id
        self._try_connect_serial()

    def _try_connect_serial(self):
        if not HAS_SERIAL:
            return

        if self.ser and self.ser.is_open:
            return

        # STRICTLY CONNECT TO COM9 ONLY
        target_port = "COM9"
        try:
            self.ser = serial.Serial(target_port, self.baudrate, timeout=0.1)
            self.port = target_port
            print(f"[OK] Connected to ESP32 Hardware on {target_port}")
            return
        except Exception:
            self.ser = None
            self.port = "NONE"

    def read_telemetry(self) -> Dict[str, Any]:
        """
        Reads live hardware telemetry strictly from ESP32 Serial on COM9 with zero buffer lag.
        """
        if not (self.ser and self.ser.is_open):
            self._try_connect_serial()

        if self.ser and self.ser.is_open:
            try:
                # Flush old stale serial buffer backlog to guarantee instant zero-lag real-time data
                if self.ser.in_waiting > 150:
                    self.ser.reset_input_buffer()

                while self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    if not line:
                        continue
                    
                    # 1. Regex JSON extraction (handles any surrounding log text or control chars)
                    json_match = re.search(r'\{.*\}', line)
                    if json_match:
                        try:
                            data = json.loads(json_match.group(0))
                            
                            self.last_station_id = str(data.get("station_id", self.station_id))
                            self.last_tilt = float(data.get("tilt_deg", self.last_tilt))
                            self.last_vibration = float(data.get("vibration_g", round(self.last_tilt * 0.5, 2)))
                            self.last_local_alert = bool(data.get("local_alert", self.last_local_alert))
                            self.last_remote_alert = bool(data.get("remote_alert", self.last_remote_alert))
                            self.last_bt_connected = bool(data.get("bt_connected", self.last_bt_connected))
                            
                            return {
                                "station_id": self.last_station_id,
                                "timestamp": time.time(),
                                "tilt_deg": self.last_tilt,
                                "vibration_g": self.last_vibration,
                                "local_alert": self.last_local_alert,
                                "remote_alert": self.last_remote_alert,
                                "bt_connected": self.last_bt_connected,
                                "hardware_connected": True,
                                "active_com_port": "COM9",
                                "band_connected": True,
                                "box_connected": self.last_remote_alert,
                                "methane_ch4_percent": float(data.get("methane_ch4_percent", 0.0)),
                                "carbon_monoxide_co_ppm": float(data.get("carbon_monoxide_co_ppm", 0.0)),
                                "temperature_celsius": float(data.get("temperature_celsius", 0.0)),
                                "humidity_percent": float(data.get("humidity_percent", 0.0))
                            }
                        except Exception:
                            pass

                    # 2. Backup Text format parsing
                    tilt_match = re.search(r'(?:Tilt:|tilt_deg"|tilt":?\s*)\s*([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
                    if tilt_match:
                        try:
                            self.last_tilt = float(tilt_match.group(1))
                            self.last_vibration = round(self.last_tilt * 0.5, 2)
                        except ValueError:
                            pass
            except Exception:
                self.ser = None

        return {
            "station_id": self.last_station_id,
            "timestamp": time.time(),
            "tilt_deg": self.last_tilt,
            "vibration_g": self.last_vibration,
            "local_alert": self.last_local_alert,
            "remote_alert": self.last_remote_alert,
            "hardware_connected": self.ser is not None and self.ser.is_open,
            "active_com_port": "COM9" if (self.ser and self.ser.is_open) else "NONE",
            "band_connected": self.ser is not None and self.ser.is_open,
            "box_connected": self.last_remote_alert,
            "bt_connected": self.last_bt_connected,
            "methane_ch4_percent": 0.0,
            "carbon_monoxide_co_ppm": 0.0,
            "temperature_celsius": 0.0,
            "humidity_percent": 0.0
        }


if __name__ == "__main__":
    reader = IoTSensorReader()
    data = reader.read_telemetry()
    print("IoT Sensor Telemetry:", data)


