import logging
import sys
from colorama import Fore, Style, init
from app.core.config import settings

init(autoreset=True)

LOG_FORMAT = "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

TARGET_LOGGERS = [
    "uvicorn",
    "uvicorn.error",
    "uvicorn.access",
    "fastapi",
    "watchfiles",
]


class ColorFormatter(logging.Formatter):
    LEVEL_COLORS = {
        logging.DEBUG: Fore.CYAN,
        logging.INFO: Fore.GREEN,
        logging.WARNING: Fore.YELLOW,
        logging.ERROR: Fore.RED,
        logging.CRITICAL: Fore.RED + Style.BRIGHT,
    }

    def format(self, record: logging.LogRecord) -> str:
        color = self.LEVEL_COLORS.get(record.levelno, "")

        original_levelname = record.levelname
        record.levelname = f"{color}{original_levelname:<8}{Style.RESET_ALL}"

        formatted = super().format(record)

        record.levelname = original_levelname
        return formatted


class PlainFormatter(logging.Formatter):
    pass


def create_console_handler() -> logging.StreamHandler:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(ColorFormatter(LOG_FORMAT, DATE_FORMAT))
    return handler


def create_file_handler() -> logging.FileHandler:
    handler = logging.FileHandler("logs/app.log", encoding="utf-8")
    handler.setFormatter(PlainFormatter(LOG_FORMAT, DATE_FORMAT))
    handler.setLevel(logging.WARNING)
    return handler


def setup_logging() -> None:
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    console_handler = create_console_handler()

    for logger_name in TARGET_LOGGERS:
        logger = logging.getLogger(logger_name)
        if logger_name.startswith("uvicorn"):
            logger.setLevel(logging.INFO)
        else:
            logger.setLevel(log_level)
        logger.addHandler(console_handler)
        logger.propagate = False

    logging.getLogger("watchfiles").setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)

    if logger.handlers:
        return logger

    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    logger.setLevel(log_level)

    logger.addHandler(create_console_handler())

    if settings.ENVIRONMENT == "production":
        logger.addHandler(create_file_handler())

    logger.propagate = False
    return logger