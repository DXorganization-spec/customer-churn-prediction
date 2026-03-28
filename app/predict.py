import pickle
import numpy as np
import os

# ✅ Absolute path (safe for deployment)
MODEL_PATH = os.path.join("app", "model", "churn_model.pkl")

# ✅ Load model ONCE (important for performance)
with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)


def predict_churn(data: dict):
    try:
        # Convert input dict → list → numpy array
        features = np.array(list(data.values())).reshape(1, -1)

        # Prediction
        prediction = model.predict(features)[0]
        probability = model.predict_proba(features)[0][1]

        return {
            "prediction": int(prediction),
            "churn_probability": float(probability)
        }

    except Exception as e:
        return {
            "error": str(e)
        }