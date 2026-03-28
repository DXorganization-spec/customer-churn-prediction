from sqlalchemy import Column, Integer, Float, DateTime
from datetime import datetime
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    credit_score = Column(Integer)
    age = Column(Integer)
    tenure = Column(Integer)
    balance = Column(Float)

    num_products = Column(Integer)
    has_credit_card = Column(Integer)
    is_active_member = Column(Integer)

    estimated_salary = Column(Float)

    probability = Column(Float)
    prediction = Column(Integer)

    created_at = Column(DateTime, default=datetime.utcnow)