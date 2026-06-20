from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Street address for our local SQL database engine file
DATABASE_URL = "sqlite:///./database.db"

# The core engine wrapper that handles low-level SQL transaction communication
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Factory engine designed to generate clean database sessions for endpoint requests
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# The base object-mapping class that our structural data tables inherit from
Base = declarative_base()