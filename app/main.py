from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.predict import predict_churn
from fastapi.middleware.cors import CORSMiddleware

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
    return {"message": "Customer Churn Prediction API is running 🚀"}


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