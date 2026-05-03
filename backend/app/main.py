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
from app.utils.logger import get_logger

logger = get_logger(__name__)

container = Container()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        container.init_resources()
        container.wire(packages=["app.api.endpoints", "app.mqtt.client", "app.core.scheduler"])

        loop = asyncio.get_event_loop()
        
        mqtt = container.mqtt_gateway()
        scheduler = container.scheduler()  
        scheduler.start()

        queue = container.face_recognition_queue()
        global queue_worker_task
        queue_worker_task = asyncio.create_task(queue.start_worker())
        
        mqtt.set_engine(container.automation_engine())
        mqtt.start(settings.MQTT_BROKER,
                   settings.MQTT_PORT,
                   settings.MQTT_USER,
                   settings.MQTT_PASSWORD,
                   loop)
        yield

        mqtt.stop()
        scheduler.stop()

        queue.stop_worker()
        if queue_worker_task:
            await queue_worker_task

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

def setup(app: FastAPI) -> None:
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.COR_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.add_exception_handler(AppException, app_exception_handler)

    app.include_router(api_router, prefix="/api")

    # if settings.ENVIRONMENT == "production":
    #     app.add_middleware(
    #         TrustedHostMiddleware,
    #         allowed_hosts=[""],

@app.get("/ping", tags=["System"])
def ping_check():
    return {
        "pong": "uia",
        "env": settings.ENVIRONMENT,
    }


# Bootstrap application
setup(app)