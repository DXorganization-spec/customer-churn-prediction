import joblib
import numpy as np

# Load trained model
model = joblib.load("app/model/churn_model.pkl")


def predict_churn(input_data: dict):

    feature_order = [
        "CreditScore",
        "Age",
        "Tenure",
        "Balance",
        "NumOfProducts",
        "HasCrCard",
        "IsActiveMember",
        "EstimatedSalary",
        "Geography_Germany",
        "Geography_Spain",
        "Gender_Male"
    ]

    values = [input_data.get(feature, 0) for feature in feature_order]
    values_array = np.array(values).reshape(1, -1)

    probability = model.predict_proba(values_array)[0][1]
    prediction = model.predict(values_array)[0]

    return {
        "churn_probability": float(probability),
        "prediction": int(prediction)
    }