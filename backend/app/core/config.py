from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    MQTT_BROKER: str
    MQTT_PORT: int = 1883

    class Config:
        env_file = ".env"

settings = Settings()