from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str
    HOST: str
    PORT: int
    ENVIRONMENT: str
    DEBUG: bool
    SKIP_AUTH_FOR_TESTING: bool
    SUPABASE_URL: str
    SUPABASE_KEY: str
    SUPABASE_JWT_SECRET: str
    MQTT_BROKER: str
    MQTT_PORT: int
    MQTT_USER: str
    MQTT_PASSWORD: str

    COR_ORIGINS: list[str]
    class Config:
        env_file = ".env"

settings = Settings()