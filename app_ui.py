import streamlit as st
import requests
import plotly.graph_objects as go
import pandas as pd

st.set_page_config(page_title="Churn AI SaaS", layout="wide")

# -------- PREMIUM CSS --------
st.markdown("""
<style>

body {
    background: linear-gradient(135deg, #0E1117, #111827);
}

.main-title {
    font-size: 42px;
    font-weight: bold;
    text-align: center;
    color: #00C9FF;
}

.sub-text {
    text-align: center;
    color: #aaa;
    margin-bottom: 30px;
}

.card {
    background: rgba(255,255,255,0.05);
    padding: 20px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
}

[data-testid="stMetric"] {
    background-color: #111;
    padding: 15px;
    border-radius: 12px;
    text-align: center;
}

</style>
""", unsafe_allow_html=True)

# -------- HEADER --------
st.markdown('<div class="main-title">🚀 Churn Intelligence System</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-text">AI-powered prediction, insights & retention engine</div>', unsafe_allow_html=True)

# -------- SIDEBAR --------
st.sidebar.title("⚙️ Control Panel")

credit_score = st.sidebar.slider("Credit Score", 300, 900, 600)
age = st.sidebar.slider("Age", 18, 100, 40)
tenure = st.sidebar.slider("Tenure", 0, 10, 5)
balance = st.sidebar.number_input("Balance", 0.0, 250000.0, 50000.0)
salary = st.sidebar.number_input("Salary", 0.0, 200000.0, 50000.0)

num_products = st.sidebar.selectbox("Products", [1, 2, 3, 4])
has_card = st.sidebar.selectbox("Credit Card", [0, 1])
is_active = st.sidebar.selectbox("Active Member", [0, 1])
geography = st.sidebar.selectbox("Geography", ["France", "Germany", "Spain"])
gender = st.sidebar.selectbox("Gender", ["Male", "Female"])

geo_germany = 1 if geography == "Germany" else 0
geo_spain = 1 if geography == "Spain" else 0
gender_male = 1 if gender == "Male" else 0

# -------- TABS --------
tab1, tab2, tab3 = st.tabs(["🔍 Prediction", "📊 Insights", "💡 Strategy"])

# -------- PREDICTION --------
with tab1:

    st.markdown("## 🔍 Run AI Analysis")

    if st.button("🚀 Analyze Now"):

        data = {
            "CreditScore": credit_score,
            "Age": age,
            "Tenure": tenure,
            "Balance": balance,
            "NumOfProducts": num_products,
            "HasCrCard": has_card,
            "IsActiveMember": is_active,
            "EstimatedSalary": salary,
            "Geography_Germany": geo_germany,
            "Geography_Spain": geo_spain,
            "Gender_Male": gender_male
        }

        try:
            with st.spinner("Running AI model..."):

                response = requests.post(
                    "https://churn-api-wdug.onrender.com/predict",
                    json=data,
                    timeout=15   # ✅ FIX: prevent timeout crash
                )

                response.raise_for_status()  # ✅ FIX: catch API errors

                result = response.json()

                prob = result.get("churn_probability", 0) * 100
                prediction = result.get("prediction", 0)

        except Exception as e:
            st.error("⚠ API is waking up or temporarily unavailable. Please try again.")
            st.stop()

        # -------- RESULT CARDS --------
        st.markdown("## 📊 Result Dashboard")

        col1, col2, col3 = st.columns(3)

        col1.metric("Prediction", "Churn" if prediction else "No Churn")
        col2.metric("Probability", f"{prob:.2f}%")

        if prob < 30:
            risk = "Low"
            color = "🟢"
        elif prob < 60:
            risk = "Medium"
            color = "🟡"
        else:
            risk = "High"
            color = "🔴"

        col3.metric("Risk Level", f"{color} {risk}")

        st.progress(int(prob))

        # -------- GAUGE --------
        fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=prob,
            title={'text': "Churn Probability"},
            gauge={
                'axis': {'range': [0, 100]},
                'bar': {'color': "#FF4B4B"},
                'steps': [
                    {'range': [0, 30], 'color': "#2ECC71"},
                    {'range': [30, 60], 'color': "#F1C40F"},
                    {'range': [60, 100], 'color': "#E74C3C"},
                ]
            }
        ))

        st.plotly_chart(fig, use_container_width=True)

        st.session_state["prob"] = prob

# -------- INSIGHTS --------
with tab2:

    st.markdown("## 📊 Customer Intelligence")

    if "prob" in st.session_state:

        prob = st.session_state["prob"]

        st.markdown("### 🧠 AI Interpretation")

        if prob > 60:
            st.error("High churn signals detected")
        elif prob > 30:
            st.warning("Moderate churn signals detected")
        else:
            st.success("Customer is stable")

        features = {
            "Age": age,
            "Balance": balance,
            "Products": num_products,
            "Activity": is_active,
            "CreditScore": credit_score
        }

        df = pd.DataFrame(features.items(), columns=["Feature", "Value"])

        st.markdown("### 📈 Feature Overview")
        st.bar_chart(df.set_index("Feature"))

    else:
        st.info("Run prediction first")

# -------- STRATEGY --------
with tab3:

    st.markdown("## 💡 Retention Engine")

    if "prob" in st.session_state:

        prob = st.session_state["prob"]

        if prob > 60:
            st.error("🔴 Immediate Action Required")
            st.write("- Offer incentives")
            st.write("- Personalized engagement")
            st.write("- Priority support")

        elif prob > 30:
            st.warning("🟡 Monitor & Engage")
            st.write("- Loyalty programs")
            st.write("- Follow-ups")
            st.write("- Improve service")

        else:
            st.success("🟢 Stable Customer")
            st.write("- Upsell opportunities")
            st.write("- Maintain experience")
            st.write("- Reward loyalty")

    else:
        st.info("Run prediction to unlock strategies")