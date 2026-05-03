import json
import asyncio
from typing import Any, Optional

import paho.mqtt.client as mqtt

from app.utils.logger import get_logger
from app.websocket.system_manager import SystemWebSocketManager
from app.services.notification_service import NotificationService
from app.services.sensor_log_service import SensorLogService
from app.core.enums import *
from app.schemas.notification import NotificationCreate
from app.schemas.sensor_log import SensorLogCreate
logger = get_logger(__name__)


class MQTTGateway:
    def __init__(self, system_manager: SystemWebSocketManager, notification: NotificationService, sensor_log: SensorLogService) -> None:
        self.client: mqtt.Client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.loop: Optional[asyncio.AbstractEventLoop] = None
        self.system_manager: SystemWebSocketManager = system_manager
        self.notification: NotificationService = notification
        self.sensor_log: SensorLogService = sensor_log

    def set_engine(self, engine: Any) -> None:
        self.engine = engine
    def _on_connect(
        self,
        client: mqtt.Client,
        userdata: Any,
        flags: dict[str, Any],
        reason_code: int,
        properties: Any,
    ) -> None:
        if reason_code == 0:
            logger.info("Connected to MQTT Broker successfully.")

            client.subscribe("iot-json", qos=1)

            self.notification.create(NotificationCreate(
                title="System Back Online",
                description=(
                    "Connection to your smart home devices has been successfully restored. "
                    "All systems are now operating normally."
                ),
                notification_type=NotificationTypeEnum.SYSTEM,
                severity=SeverityEnum.LOW
            ))

            logger.info("Subscribed to 'iot-json' topic")
        else:
            logger.error(f"Failed to connect, return code: {reason_code}")

    def _on_disconnect(
        self,
        client: mqtt.Client,
        userdata: Any,
        disconnect_flags: Any,
        reason_code: int,
        properties: Any,
    ) -> None:
        """Handle MQTT disconnection."""
        if reason_code != 0:
            self.notification.create(NotificationCreate(
                title="Connection Lost",
                description=(
                    "Your smart home system has temporarily lost connection to IoT devices. "
                    "Real-time updates and automation may be delayed until the connection is restored."
                ),
                notification_type=NotificationTypeEnum.SYSTEM,
                severity=SeverityEnum.HIGH
            ))
            logger.warning(f"Unexpected disconnect (code={reason_code}). Auto-reconnect in progress...")
        else:
            logger.info("MQTT client disconnected cleanly")

    def _on_message(
        self,
        client: mqtt.Client,
        userdata: Any,
        msg: mqtt.MQTTMessage,
    ) -> None:
        try:
            data: dict[str, Any] = json.loads(msg.payload.decode())

            # logger.info(
            #     f"[iot-json] temp={data['temp']}°C  "
            #     f"humi={data['humi']}%  "
            #     f"light={data['light']} lux"
            # )

            for key in ["temp", "humi", "light"]:
                if key in data:
                    _, sensor = self.sensor_log.create(SensorLogCreate(
                        key=key,
                        value=data[key]
                    ))
                    self.engine.sensor_rule(sensor["sensor_id"], data[key])

            success: bool = self._push_to_ws(data)

            if not success:
                logger.warning("Failed to broadcast sensor data to WebSocket")

        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON on iot-json: {msg.payload}")

        except Exception as e:
            logger.error(f"Error processing iot-json message: {e}", exc_info=True)

    def _push_to_ws(
        self,
        data: dict[str, Any],
        timeout: float = 5.0,
    ) -> bool:
        """
        Thread-safe bridge: MQTT thread -> async WebSocket.
        """

        if self.loop is None:
            logger.warning("Event loop not initialized when pushing to WS. Make sure start() was called.")
            return False

        try:
            asyncio.run_coroutine_threadsafe(self.system_manager.broadcast(data), self.loop)
            return True

        except asyncio.TimeoutError:
            logger.error(
                f"Timeout pushing message after {timeout}s. WebSocket broadcast may be overloaded.")
            return False

        except Exception as e:
            logger.error(
                f"Failed to push message: {type(e).__name__}: {e}", exc_info=True)
            return False
    
    def send_command(self, command: dict) -> bool:
        try:
            payload = json.dumps(command)
            result = self.client.publish("iot-control", payload, qos=1)
            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"[iot-control] Sent command: {command}")
                return True
            else:
                logger.error(f"[iot-control] Publish failed, rc={result.rc}")
                return False
        except Exception as e:
            logger.error(f"[iot-control] Error sending command: {e}", exc_info=True)
            return False

    def start(
        self,
        broker: str,
        port: int,
        user: str,
        pwd: str,
        loop: asyncio.AbstractEventLoop,
    ) -> None:
        try:
            self.loop = loop

            self.client.on_connect = self._on_connect
            self.client.on_disconnect = self._on_disconnect
            self.client.on_message = self._on_message

            self.client.reconnect_delay_set(min_delay=2, max_delay=30)

            self.client.username_pw_set(user, pwd)

            logger.info(f"Connecting to MQTT Broker at {broker}:{port}...")

            self.client.connect(broker, port, keepalive=60)

            self.client.loop_start()

            logger.info("MQTT client started (background thread)")

        except ConnectionRefusedError:
            logger.critical(
                f"Connection refused by MQTT Broker at {broker}:{port}. Check if broker is running.")

        except OSError as e:
            logger.critical(
                f"Network error connecting to MQTT Broker: {e}. Check broker address and network connectivity.")

        except Exception as e:
            logger.critical(
                f"Unexpected error starting MQTT client: {type(e).__name__}: {e}", exc_info=True)

    def stop(self) -> None:
        try:
            self.client.disconnect()
            self.client.loop_stop()

            logger.info("MQTT client stopped")

        except Exception as e:
            logger.error(f"Error stopping MQTT client: {e}")