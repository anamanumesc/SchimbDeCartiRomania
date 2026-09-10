from fastapi import FastAPI

app = FastAPI(
    title="BookExchange Romania API",
    version="2.0.0",
    description="Production-ready backend for physical book exchanges in Romania."
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "book-exchange-backend"}
