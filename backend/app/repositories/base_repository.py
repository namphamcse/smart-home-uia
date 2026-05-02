from typing import Any
from datetime import datetime
from app.core.exceptions import DatabaseException
from app.utils.logger import get_logger

logger = get_logger(__name__)
class BaseRepository:
    def __init__(self, db, table_name: str):
        self.db = db
        self.table_name = table_name
        self.pk = f"{table_name[:-1]}_id"

    def _table(self) -> Any:
        return self.db.table(self.table_name)

    def _serialize(self, obj: Any) -> Any:
        """Recursively convert datetime objects to ISO strings so the DB client can JSON-encode the payload."""
        if isinstance(obj, dict):
            return {k: self._serialize(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [self._serialize(v) for v in obj]
        if isinstance(obj, datetime):
            return obj.isoformat()
        return obj
    
    def _execute(self, query) -> Any:
        import traceback
        try:
            return query.execute()
        except Exception as e:
            logger.error(
            f"DB Error on {self.table_name}: {str(e)}",
            exc_info=True  # ← Giữ full traceback
        )
        raise DatabaseException(
            f"Database operation failed on {self.table_name}",
            original_error=str(e)
        ) from e 

    def get_all(self) -> list:
        res = self._execute(self._table().select("*"))
        return res.data

    def get_by_id(self, id: int) -> dict | None:
        res = self._execute(self._table().select("*").eq(self.pk, id))
        return res.data[0] if res.data and len(res.data) > 0 else None

    def create(self, data: dict) -> dict:
        res = self._execute(self._table().insert(self._serialize(data)))
        return res.data[0]

    def update(self, id: int, data: dict) -> dict | None:
        res = self._execute(self._table().update(self._serialize(data)).eq(self.pk, id))
        return res.data[0] if res.data else None

    def delete(self, id: int) -> bool:
        res = self._execute(self._table().delete().eq(self.pk, id))
        return bool(res.data)