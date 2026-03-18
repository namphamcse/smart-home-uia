from fastapi import Depends
from app.core.security import verify_jwt_token

async def get_current_user(user: dict = Depends(verify_jwt_token)) -> dict:
    """Get current authenticated user"""
    return user