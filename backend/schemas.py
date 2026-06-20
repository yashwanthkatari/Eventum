from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserRegister(BaseModel):
    """Validates data payloads sent by the client during new account creation."""
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "audience"

class UserOut(BaseModel):
    """Safe profile structure returned to client (hides password hashes)."""
    id: int
    name: str
    email: EmailStr
    role: str
    class Config:
        from_attributes = True # Directs Pydantic to parse ORM database objects smoothly

class EventCreate(BaseModel):
    """Enforces type validation constraints when composing an announcement."""
    title: str
    description: str
    location: str
    date: str
    time: str
    category: str
    max_capacity: int

class EventOut(BaseModel):
    """Full detail matrix exposed across public-facing endpoint controllers."""
    id: int
    title: str
    description: Optional[str]
    location: Optional[str]
    date: Optional[str]
    time: Optional[str]
    category: Optional[str]
    max_capacity: int
    is_completed: bool
    owner_id: int
    owner: UserOut
    attendees: List[UserOut] = []
    class Config:
        from_attributes = True