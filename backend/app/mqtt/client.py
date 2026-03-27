import json
import asyncio
import paho.mqtt.client as mqtt

from app.core.config import settings
from app.utils.logger import get_logger
from app.websocket.manager import ws_manager

logger = get_logger(__name__)

_loop: asyncio.AbstractEventLoop | None = None


def set_event_loop(loop: asyncio.AbstractEventLoop):
    global _loop
    _loop = loop


def _push_to_ws(device_id: str, data: dict):
    """Thread-safe bridge: MQTT thread -> async WebSocket."""
    if _loop is None:
        return
    asyncio.run_coroutine_threadsafe(
        ws_manager.broadcast_to_device(device_id, data),
        _loop,
    )


def on_connect(client, userdata, flags, reason_code, properties=None):
    if reason_code == 0:
        logger.info("Connected to MQTT Broker successfully.")
        client.subscribe("devices/#", qos=1)
    else:
        logger.error(f"Failed to connect, return code {reason_code}")


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    if reason_code != 0:
        logger.warning(f"Unexpected disconnect (code={reason_code}). Will auto-reconnect...")


def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())

        parts = topic.split("/")          # ["devices", "esp32_001", "sensors", "light"]
        if len(parts) < 3:
            return

        device_id = parts[1]             # "esp32_001"
        sub_path  = "/".join(parts[2:])  # "sensors/light"

        route_message(device_id, sub_path, payload)

    except json.JSONDecodeError:
        logger.warning(f"Invalid JSON on topic {msg.topic}")
    except Exception as e:
        logger.error(f"Error processing message: {e}", exc_info=True)

def route_message(device_id: str, sub_path: str, data: dict):
    handlers = {
        "sensors/light": handle_light_data,
        "sensors/dht20": handle_dht20_data,
        "status":        handle_status_data,
    }
    handler = handlers.get(sub_path)
    if handler:
        handler(device_id, data)


def handle_light_data(device_id: str, data: dict):
    logger.info(f"[{device_id}] Light -> lux={data.get('lux')}  cond={data.get('condition')}")
    _push_to_ws(device_id, {"type": "light", **data})


def handle_dht20_data(device_id: str, data: dict):
    logger.info(f"[{device_id}] DHT20 -> temp={data.get('temperature_c')}°C  hum={data.get('humidity_pct')}%")
    _push_to_ws(device_id, {"type": "dht20", **data})


def handle_status_data(device_id: str, data: dict):
    logger.info(f"[{device_id}] Status -> {data.get('status')}")
    _push_to_ws(device_id, {"type": "status", **data})


def start_mqtt() -> mqtt.Client | None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)

    # if settings.MQTT_USER and settings.MQTT_PASSWORD:
    #     client.username_pw_set(settings.MQTT_USER, settings.MQTT_PASSWORD)

    client.on_connect    = on_connect
    client.on_disconnect = on_disconnect
    client.on_message    = on_message
    client.reconnect_delay_set(min_delay=2, max_delay=30)

    try:
        client.connect(settings.MQTT_BROKER, settings.MQTT_PORT, keepalive=60)
        client.loop_start()
        return client
    except Exception as e:
        logger.critical(f"Could not connect to MQTT Broker: {e}")
        return None