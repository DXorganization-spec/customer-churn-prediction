from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, Response
from pydantic import BaseModel, Field, validator
from app.predict import predict_churn
from fastapi.middleware.cors import CORSMiddleware
import os
from typing import Optional

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
    CreditScore: int = Field(..., ge=300, le=900, description="Credit score between 300-900")
    Age: int = Field(..., ge=18, le=100, description="Customer age between 18-100")
    Tenure: int = Field(..., ge=0, le=10, description="Years as customer 0-10")
    Balance: float = Field(..., ge=0, le=10000000, description="Account balance")
    NumOfProducts: int = Field(..., ge=1, le=4, description="Number of products 1-4")
    HasCrCard: int = Field(..., ge=0, le=1, description="Has credit card: 0 or 1")
    IsActiveMember: int = Field(..., ge=0, le=1, description="Is active: 0 or 1")
    EstimatedSalary: float = Field(..., ge=0, le=10000000, description="Estimated salary")
    Geography_Germany: int = Field(..., ge=0, le=1, description="Is Germany: 0 or 1")
    Geography_Spain: int = Field(..., ge=0, le=1, description="Is Spain: 0 or 1")
    Gender_Male: int = Field(..., ge=0, le=1, description="Is male: 0 or 1")

    @validator('NumOfProducts')
    def validate_products(cls, v):
        if v < 1 or v > 4:
            raise ValueError('NumOfProducts must be between 1 and 4')
        return v


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

        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])

        return {
            "status": "success",
            "prediction": result["prediction"],
            "churn_probability": result["churn_probability"]
        }

    except ValueError as ve:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(ve)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "Customer Churn Prediction API",
        "version": "1.0.0"
    }


@app.get("/api/info")
def api_info():
    """API information endpoint"""
    return {
        "name": "Customer Churn Prediction API",
        "version": "1.0.0",
        "endpoints": {
            "predict": "POST /predict - Predict churn for a customer",
            "health": "GET /health - Health check",
            "info": "GET /api/info - API information"
        },
        "model_type": "XGBoost Classifier",
        "input_features": 11,
        "output": "Binary prediction + probability"
    }