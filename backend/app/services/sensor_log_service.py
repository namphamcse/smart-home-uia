from app.repositories import SensorLogRepository

class SensorLogService:
    def __init__(self, repo: SensorLogRepository):
        self.repo = repo

    def get_all(self) -> list:
        return self.repo.get_all()

    def get_by_sensor_id(self, sensor_id: int) -> list:
        return self.repo.get_by_sensor_id(sensor_id)