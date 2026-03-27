# from app.schemas.sensor import SensorCreate
from app.repositories import SensorRepository
from app.core.exceptions import *

class SensorService:
    def __init__(self, repo: SensorRepository):
        self.repo = repo

    def get_by_id(self, sensor_id: int) -> dict:
        sensor = self.repo.get_by_id(sensor_id)
        if not sensor:
            raise SensorNotFoundException(sensor_id)  # domain exception
        return sensor
    
    def get_all(self) -> list:
        return self.repo.get_all()
    
    """ 
    In SensorService, we typically don't have a create/update/delete by sensor_id
    since sensors are often managed in the context of their parent device. 
    Instead, we might have methods that manage sensors by device_id or other attributes.
    """
    # def create(self, payload: SensorCreate) -> dict:

    # def update(self, sensor_id: int, payload: SensorUpdate) -> dict:

    # def delete(self, sensor_id: int) -> None:
