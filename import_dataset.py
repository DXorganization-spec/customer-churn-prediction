import pandas as pd
from sqlalchemy import create_engine

# connect to PostgreSQL
engine = create_engine("postgresql://postgres:admin123@localhost:5432/churn_db")

# load CSV
df = pd.read_csv("data/Churn_Modelling.csv")

print("Rows in CSV:", len(df))  # verify dataset size

# insert dataset into PostgreSQL
df.to_sql("churn_data", engine, if_exists="replace", index=False)

print("Dataset inserted successfully!")