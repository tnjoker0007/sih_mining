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

    def __init__(self, station_id: str = "BAND-NODE-01", port: Optional[str] = None, baudrate: int = 115200):
        self.station_id = station_id
        self.port = port
        self.baudrate = baudrate
        self.ser = None
        self.last_tilt = 0.0
        self.last_local_alert = False
        self.last_remote_alert = False
        self._try_connect_serial()

    def _try_connect_serial(self):
        if not HAS_SERIAL:
            return

        if self.ser and self.ser.is_open:
            return

        if self.port:
            try:
                self.ser = serial.Serial(self.port, self.baudrate, timeout=0.1)
                print(f"[OK] Connected to ESP32 Hardware on {self.port}")
                return
            except Exception:
                pass

        # Scan all active COM ports dynamically
        ports = serial.tools.list_ports.comports()
        for p in ports:
            try:
                self.ser = serial.Serial(p.device, self.baudrate, timeout=0.1)
                self.port = p.device
                print(f"[OK] Connected to ESP32 Hardware on {p.device}")
                return
            except Exception:
                pass

    def read_telemetry(self) -> Dict[str, Any]:
        """
        Reads live hardware telemetry from ESP32 Serial using robust regex parsing.
        """
        if not (self.ser and self.ser.is_open):
            self._try_connect_serial()

        if self.ser and self.ser.is_open:
            try:
                while self.ser.in_waiting > 0:
                    line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    if not line:
                        continue
                    
                    # 1. Option 2 Structured JSON format parsing
                    if line.startswith("{") and line.endswith("}"):
                        try:
                            data = json.loads(line)
                            data["station_id"] = data.get("station_id", self.station_id)
                            data["timestamp"] = time.time()
                            data["hardware_connected"] = True
                            data["active_com_port"] = self.port if (self.ser and self.ser.is_open) else "NONE"
                            data["band_connected"] = True
                            data["box_connected"] = bool(data.get("remote_alert", False))
                            
                            tilt_val = float(data.get("tilt_deg", 0.0))
                            self.last_tilt = tilt_val
                            data["tilt_deg"] = tilt_val
                            data["vibration_g"] = float(data.get("vibration_g", round(tilt_val * 0.5, 2)))
                            
                            loc_alert = bool(data.get("local_alert", False))
                            rem_alert = bool(data.get("remote_alert", False))
                            bt_conn = bool(data.get("bt_connected", False))
                            
                            self.last_local_alert = loc_alert
                            self.last_remote_alert = rem_alert
                            self.last_bt_connected = bt_conn
                            
                            data["local_alert"] = loc_alert
                            data["remote_alert"] = rem_alert
                            data["bt_connected"] = bt_conn
                            
                            data["methane_ch4_percent"] = float(data.get("methane_ch4_percent", 0.0))
                            data["carbon_monoxide_co_ppm"] = float(data.get("carbon_monoxide_co_ppm", 0.0))
                            data["temperature_celsius"] = float(data.get("temperature_celsius", 0.0))
                            data["humidity_percent"] = float(data.get("humidity_percent", 0.0))
                            return data
                        except:
                            pass

                    # 2. Check Text format (e.g. "Pkt #12 | Tilt: 0.64° | Local: OK | Remote: OK" or "Tilt: 1.82 deg")
                    tilt_match = re.search(r'(?:Tilt:|tilt_deg"|tilt":?\s*)\s*([0-9]+\.?[0-9]*)', line, re.IGNORECASE)
                    if tilt_match:
                        try:
                            self.last_tilt = float(tilt_match.group(1))
                        except ValueError:
                            pass

                    # Parse exact Alert/OK flags from Arduino Serial Monitor string
                    if "LOCAL:" in line or "Local:" in line:
                        self.last_local_alert = ("ALERT" in line.split("LOCAL:")[1] if "LOCAL:" in line else "ALERT" in line.split("Local:")[1])
                    elif "BAND_ALERT" in line:
                        self.last_local_alert = True
                    elif "BAND_OK" in line:
                        self.last_local_alert = False

                    if "REMOTE:" in line or "Remote:" in line:
                        self.last_remote_alert = ("ALERT" in line.split("REMOTE:")[1] if "REMOTE:" in line else "ALERT" in line.split("Remote:")[1])
                    elif "BOX_ALERT" in line:
                        self.last_remote_alert = True
                    elif "BOX_OK" in line:
                        self.last_remote_alert = False
            except Exception as e:
                pass

        return {
            "station_id": self.station_id,
            "timestamp": time.time(),
            "tilt_deg": self.last_tilt,
            "methane_ch4_percent": 0.0,
            "carbon_monoxide_co_ppm": 0.0,
            "temperature_celsius": 0.0,
            "humidity_percent": 0.0,
            "vibration_g": round(self.last_tilt * 0.5, 2),
            "local_alert": self.last_local_alert,
            "remote_alert": self.last_remote_alert,
            "hardware_connected": self.ser is not None and self.ser.is_open,
            "active_com_port": self.port if (self.ser and self.ser.is_open) else "NONE",
            "band_connected": self.ser is not None and self.ser.is_open,
            "box_connected": self.last_remote_alert,
            "bt_connected": getattr(self, 'last_bt_connected', False)
        }

if __name__ == "__main__":
    reader = IoTSensorReader()
    data = reader.read_telemetry()
    print("IoT Sensor Telemetry:", data)


