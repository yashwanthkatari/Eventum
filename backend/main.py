from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext
from sqlalchemy.orm import Session
import jwt
import datetime as dt
from datetime import datetime
from typing import List

# Internal imports reflecting our modular split directory architecture
from database import engine, SessionLocal, Base
import models
import schemas

# Automatically compile all tables inside SQLite binary file on bootup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Eventum Engine Framework")

# Cryptographic token payload signing configurations
SECRET_KEY = "SUPER_SECRET_SECURITY_KEY_KEEP_THIS_HIDDEN" 
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], bcrypt__deprecated_minus_level=0)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Mount cross-origin middleware to grant port 5173 continuous transaction access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    """Performs dynamic request lifecycle execution wrapping for connection blocks."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Intercepts and decodes incoming Bearer tokens to assert active sessions."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate identity credentials session.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.UserModel).filter(models.UserModel.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=schemas.UserOut, status_code=201)
def register_user(user_in: schemas.UserRegister, db: Session = Depends(get_db)):
    """Creates a new identity node, securely checking for email duplicates."""
    duplicate_check = db.query(models.UserModel).filter(models.UserModel.email == user_in.email).first()
    if duplicate_check:
        raise HTTPException(status_code=400, detail="This network identity is already active.")
        
    hashed = pwd_context.hash(user_in.password)
    new_user = models.UserModel(
        name=user_in.name,
        email=user_in.email,
        hashed_password=hashed,
        role=user_in.role.lower() if user_in.role else "audience"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Validates password match structures and exports active JWT authorization vectors."""
    user = db.query(models.UserModel).filter(models.UserModel.email == form_data.username).first()
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credential values supplied.")
        
    token_expiry = datetime.utcnow() + dt.timedelta(hours=24)
    token_payload = {"sub": user.email, "exp": token_expiry}
    encoded_jwt = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"access_token": encoded_jwt, "token_type": "bearer"}

@app.get("/profile", response_model=schemas.UserOut)
def read_profile(current_user: models.UserModel = Depends(get_current_user)):
    """Exposes details of the currently authorized authorization tier."""
    return current_user

@app.get("/events", response_model=List[schemas.EventOut])
def fetch_events(db: Session = Depends(get_db)):
    """Pulls full systemic repository logs for active feed display processing."""
    return db.query(models.EventModel).all()

@app.post("/events", response_model=schemas.EventOut, status_code=201)
def create_event(event_in: schemas.EventCreate, current_user: models.UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Enforces management restrictions before assigning a new event node to the database."""
    if current_user.role not in ["admin", "organizer"]:
        raise HTTPException(status_code=403, detail="Audience access paths barred from composing elements.")
        
    new_event = models.EventModel(
        title=event_in.title,
        description=event_in.description,
        location=event_in.location,
        date=event_in.date,
        time=event_in.time,
        category=event_in.category,
        max_capacity=event_in.max_capacity,
        owner_id=current_user.id
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event

@app.delete("/events/{event_id}", status_code=200)
def delete_event(event_id: int, current_user: models.UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Confirms object ownership metadata boundaries prior to erasing event entries."""
    target = db.query(models.EventModel).filter(models.EventModel.id == event_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Announcement link not discovered.")
    if current_user.role != "admin" and target.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Deletion privilege validation failed.")
    db.delete(target)
    db.commit()
    return {"detail": "Announcement dropped successfully."}

@app.post("/events/{event_id}/register", response_model=schemas.EventOut)
def register_toggle(event_id: int, current_user: models.UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Main rsvp matrix processor that appends or slices identities from active arrays."""
    target = db.query(models.EventModel).filter(models.EventModel.id == event_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Announcement link not discovered.")
    if current_user in target.attendees:
        target.attendees.remove(current_user)
    else:
        target.attendees.append(current_user)
    db.commit()
    db.refresh(target)
    return target

@app.post("/events/{event_id}/toggle-complete", response_model=schemas.EventOut)
def toggle_complete(event_id: int, current_user: models.UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Shifts target entries between active timelines and archived directory states."""
    target = db.query(models.EventModel).filter(models.EventModel.id == event_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Announcement link not discovered.")
    if current_user.role != "admin" and target.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Modification privilege validation failed.")
    target.is_completed = not target.is_completed
    db.commit()
    db.refresh(target)
    return target

@app.get("/admin/users", response_model=List[schemas.UserOut])
def get_all_users(current_user: models.UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    """Exposes all active workspace profiles. Restricted to administrators."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Root access verification clearance required.")
    return db.query(models.UserModel).all()