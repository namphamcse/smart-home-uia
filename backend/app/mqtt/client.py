import json
import asyncio
import paho.mqtt.client as mqtt
import threading
from typing import Optional

from app.core.config import settings
from app.utils.logger import get_logger
from app.websocket.manager import ws_manager

logger = get_logger(__name__)


class MQTTClientManager:
    """Thread-safe MQTT client with proper event loop handling."""
    
    _lock = threading.Lock()
    _loop: Optional[asyncio.AbstractEventLoop] = None
    _client: Optional[mqtt.Client] = None
    
    @classmethod
    def set_event_loop(cls, loop: asyncio.AbstractEventLoop) -> None:
        """Set the event loop (thread-safe)."""
        with cls._lock:
            cls._loop = loop
            logger.debug(f"Event loop set to {loop}")
    
    @classmethod
    def get_event_loop(cls) -> Optional[asyncio.AbstractEventLoop]:
        """Get the event loop (thread-safe)."""
        with cls._lock:
            return cls._loop
    
    @classmethod
    def push_to_ws(
        cls, 
        data: dict,
        timeout: float = 5.0
    ) -> bool:
        """
        Thread-safe bridge: MQTT thread -> async WebSocket.
        
        Args:
            device_id: Device identifier
            data: Message data
            timeout: Timeout in seconds
            
        Returns:
            True if successfully queued, False otherwise
        """
        loop = cls.get_event_loop()
        
        if loop is None:
            logger.warning(
                f"Event loop not initialized when pushing to WS. "
                "Make sure set_event_loop() was called."
            )
            return False
        
        try:
            future = asyncio.run_coroutine_threadsafe(
                ws_manager.broadcast(data),
                loop
            )
            # Wait for the coroutine to complete with timeout
            future.result(timeout=timeout)
            return True
            
        except asyncio.TimeoutError:
            logger.error(
                f"Timeout pushing message to device after {timeout}s. "
                "WebSocket broadcast may be overloaded."
            )
            return False
            
        except Exception as e:
            logger.error(
                f"Failed to push message to device: {type(e).__name__}: {e}",
                exc_info=True
            )
            return False
    
    @classmethod
    def set_client(cls, client: mqtt.Client) -> None:
        """Store the MQTT client reference."""
        with cls._lock:
            cls._client = client

    @classmethod
    def send_command(cls, command: dict) -> bool:
        with cls._lock:
            if cls._client is None:
                logger.error("MQTT client not initialized")
                return False
            return publish_control(cls._client, command)


# Module-level interface (backward compatible)
def set_event_loop(loop: asyncio.AbstractEventLoop) -> None:
    """Set the event loop."""
    MQTTClientManager.set_event_loop(loop)


def _push_to_ws(data: dict) -> bool:
    """Thread-safe bridge: MQTT thread -> async WebSocket."""
    return MQTTClientManager.push_to_ws(data)


def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        logger.info("Connected to MQTT Broker successfully.")
        # Subscribe đúng feed firmware gửi lên
        client.subscribe("iot-json", qos=1)
        logger.info("Subscribed to 'iot-json' topic")
    else:
        logger.error(f"Failed to connect, return code: {reason_code}")


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    """Handle MQTT disconnection."""
    if reason_code != 0:
        logger.warning(
            f"Unexpected disconnect (code={reason_code}). "
            "Auto-reconnect in progress..."
        )
    else:
        logger.info("MQTT client disconnected cleanly")

def on_message(client, userdata, msg):
    """Nhận dữ liệu sensor từ firmware qua iot-json."""
    try:
        payload = json.loads(msg.payload.decode())

        if not all(k in payload for k in ("temp", "humi", "light")):
            logger.warning(f"Missing fields in payload: {payload}")
            return

        handle_sensor_data(payload)

    except json.JSONDecodeError:
        logger.warning(f"Invalid JSON on iot-json: {msg.payload}")
    except Exception as e:
        logger.error(f"Error processing iot-json message: {e}", exc_info=True)

def handle_sensor_data(data: dict) -> None:
    """
    Xử lý gói dữ liệu tổng hợp {temp, humi, light} từ firmware.
    Broadcast toàn bộ về WebSocket để frontend hiển thị.
    """
    logger.info(
        f"[iot-json] temp={data['temp']}°C  "
        f"humi={data['humi']}%  "
        f"light={data['light']} lux"
    )
    # Broadcast về WS — không cần device_id nếu chỉ có 1 thiết bị,
    # hoặc firmware có thể gửi kèm device_id trong payload nếu cần phân biệt
    success = _push_to_ws({"type": "sensor", **data})
    if not success:
        logger.warning("Failed to broadcast sensor data to WebSocket")

def publish_control(client: mqtt.Client, command: dict) -> bool:
    """
    Gửi lệnh điều khiển xuống thiết bị qua iot-control.
    
    Ví dụ command: {"action": "set_threshold", "value": 30}
                   {"action": "toggle_relay", "state": "on"}
    """
    try:
        payload = json.dumps(command)
        result = client.publish("iot-control", payload, qos=1)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            logger.info(f"[iot-control] Sent command: {command}")
            return True
        else:
            logger.error(f"[iot-control] Publish failed, rc={result.rc}")
            return False
    except Exception as e:
        logger.error(f"[iot-control] Error sending command: {e}", exc_info=True)
        return False


def start_mqtt() -> Optional[mqtt.Client]:
    """
    Start MQTT client and connect to broker.
    
    Returns:
        mqtt.Client instance if successful, None otherwise
    """
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        
        # Set callbacks
        client.on_connect = on_connect
        client.on_disconnect = on_disconnect
        client.on_message = on_message
        
        # Configure auto-reconnect
        client.reconnect_delay_set(min_delay=2, max_delay=30)
        
        client.username_pw_set(settings.MQTT_USER, settings.MQTT_PASSWORD)
        
        # Connect to broker
        logger.info(
            f"Connecting to MQTT Broker at {settings.MQTT_BROKER}:"
            f"{settings.MQTT_PORT}..."
        )
        client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, keepalive=60)
        
        # Start background thread
        client.loop_start()
        logger.info("MQTT client started (background thread)")
        
        # Store client reference
        MQTTClientManager.set_client(client)
        
        return client
        
    except ConnectionRefusedError:
        logger.critical(
            f"Connection refused by MQTT Broker at "
            f"{settings.MQTT_BROKER}:{settings.MQTT_PORT}. "
            "Check if broker is running."
        )
        return None
        
    except OSError as e:
        logger.critical(
            f"Network error connecting to MQTT Broker: {e}. "
            "Check broker address and network connectivity."
        )
        return None
        
    except Exception as e:
        logger.critical(
            f"Unexpected error starting MQTT client: {type(e).__name__}: {e}",
            exc_info=True
        )
        return None


def stop_mqtt(client: Optional[mqtt.Client]) -> None:
    """Gracefully stop MQTT client."""
    if client is not None:
        try:
            client.loop_stop()
            logger.info("MQTT client stopped")
        except Exception as e:
            logger.error(f"Error stopping MQTT client: {e}")