from fastapi import FastAPI

app = FastAPI()


app = FastAPI(title="Smart Home UIA API")


@app.get("/")
def read_root():
    return {"Hello": "Ping pong!"}