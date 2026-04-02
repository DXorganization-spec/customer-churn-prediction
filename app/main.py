from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel
from app.predict import predict_churn
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(title="Customer Churn Prediction API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CustomerData(BaseModel):
    CreditScore: int
    Age: int
    Tenure: int
    Balance: float
    NumOfProducts: int
    HasCrCard: int
    IsActiveMember: int
    EstimatedSalary: float
    Geography_Germany: int
    Geography_Spain: int
    Gender_Male: int


@app.get("/")
def home():
    # Serve the HTML file
    html_path = os.path.join(os.path.dirname(__file__), "..", "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)


@app.get("/styles.css")
def get_styles():
    css_path = os.path.join(os.path.dirname(__file__), "..", "style.css")
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()
    return Response(content=css_content, media_type="text/css")


@app.get("/app.js")
def get_app_js():
    js_path = os.path.join(os.path.dirname(__file__), "..", "app.js")
    return FileResponse(js_path, media_type="application/javascript")


@app.post("/predict")
def predict(data: CustomerData):
    try:
        result = predict_churn(data.dict())

        return {
            "status": "success",
            "prediction": result["prediction"],
            "churn_probability": result["churn_probability"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))