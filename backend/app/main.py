from fastapi import FastAPI
from app.supabase.client import supabase

app = FastAPI(title="Smart Home UIA API")

@app.get("/")
def read_root():
    response = supabase.table("users").select("*").limit(5).execute()
    return {"data": response.data}