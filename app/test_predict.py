from app.predict import predict_churn

sample_customer = {
    "CreditScore": 600,
    "Age": 45,
    "Tenure": 3,
    "Balance": 120000,
    "NumOfProducts": 1,
    "HasCrCard": 1,
    "IsActiveMember": 0,
    "EstimatedSalary": 50000,
    "Geography_Germany": 1,
    "Geography_Spain": 0,
    "Gender_Male": 1
}

result = predict_churn(sample_customer)
print(result)