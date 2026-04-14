import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.exceptions import AppException
from app.core.exception_handlers import app_exception_handler

from app.api.router import api_router
from app.core.container import Container
from app.mqtt.client import start_mqtt, set_event_loop
from app.utils.logger import get_logger

logger = get_logger(__name__)

container = Container()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        container.init_resources()
        container.wire(packages=["app.api.endpoints", "app.mqtt.client"])

        loop = asyncio.get_event_loop()
        set_event_loop(loop)          # bridge MQTT thread -> async loop
        mqtt_client = start_mqtt()
        

        app.state.mqtt_client = mqtt_client
        
        # await mqtt_client.connect()
        yield

        if mqtt_client:
            mqtt_client.loop_stop()
            mqtt_client.disconnect()

    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

    finally:
        # --- Shutdown ---
        # await mqtt_client.disconnect()
        pass


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

app.container = container

def setup_middleware(app: FastAPI) -> None:
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.COR_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # if settings.ENVIRONMENT == "production":
    #     app.add_middleware(
    #         TrustedHostMiddleware,
    #         allowed_hosts=[""],

def setup_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppException, app_exception_handler)


def setup_routes(app: FastAPI) -> None:
    app.include_router(api_router, prefix="/api")


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "uia",
        "env": settings.ENVIRONMENT,
    }


# Bootstrap application
setup_middleware(app)
setup_exception_handlers(app)
setup_routes(app)