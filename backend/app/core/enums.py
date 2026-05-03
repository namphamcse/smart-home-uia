from enum import Enum

# Device
class DeviceTypeEnum(str, Enum):
    LIGHT: str = "light"
    FAN: str = "fan"
    SENSOR: str = "sensor"
    CAMERA: str = "camera"
    SERVO: str = "servo"
    OTHER: str = "other"

class DeviceModeEnum(str, Enum):
    AUTO: str = "auto"
    MANUAL: str = "manual"

# Sensor
class SensorTypeEnum(str, Enum):
    TEMPERATURE: str = "temperature"
    HUMIDITY: str = "humidity"
    MOTION: str = "motion"
    LIGHT: str = "light"

class ActionEnum(str, Enum):
    TURN_ON = "turn_on"
    TURN_OFF = "turn_off"
    SET_COLOR = "set_color"
    SET_ANGLE = "set_angle"
    SET_SPEED = "set_speed"

class SourceEnum(str, Enum):
    APP = "app"
    REMOTE = "remote"
    AUTO = "auto"
    SCHEDULE = "schedule"

class NotificationTypeEnum(str, Enum):
    ALERT = "alert"
    INTRUSION = "intrusion"
    DEVICE = "device"
    SYSTEM = "system"
    ERROR = "error"

class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TriggerTypeEnum(str, Enum):
    SENSOR = "sensor"
    SCHEDULE = "schedule"

class ConditionOperatorEnum(str, Enum):
    GT = ">"
    LT = "<"
    EQ = "=="
    GE = ">="
    LE = "<="

class RecognitionEnum(str, Enum):
    OWNER = "owner"
    STRANGER = "stranger"
    UNKNOWN = "unknown"