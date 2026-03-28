from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from app.predict import predict_churn
from app.database import SessionLocal
from app.models import Prediction
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Customer Churn Prediction API")

# ✅ CORS (important for frontend later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change later for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Request Schema
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


# ✅ Health Check Route
@app.get("/")
def home():
    return {"message": "Customer Churn Prediction API is running 🚀"}


# ✅ Prediction Route
@app.post("/predict")
def predict(data: CustomerData):
    try:
        # 🔹 Run ML prediction
        result = predict_churn(data.dict())

        # 🔹 DB connection
        db = SessionLocal()

        # 🔹 Create DB record
        record = Prediction(
            credit_score=data.CreditScore,
            age=data.Age,
            tenure=data.Tenure,
            balance=data.Balance,
            num_products=data.NumOfProducts,
            has_credit_card=data.HasCrCard,
            is_active_member=data.IsActiveMember,
            estimated_salary=data.EstimatedSalary,
            probability=result["churn_probability"],
            prediction=result["prediction"]
        )

        # 🔹 Save to DB
        db.add(record)
        db.commit()

        return {
            "status": "success",
            "prediction": result["prediction"],
            "churn_probability": result["churn_probability"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()