from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base # Importing the shared foundational mapper base

# Many-to-Many Bridge Table linking user identities to targeted event matrices
# It records the exact timestamp of registration, which our waitlist processes
event_attendees = Table(
    "event_attendees",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE")),
    Column("event_id", Integer, ForeignKey("events.id", ondelete="CASCADE")),
    Column("registered_at", DateTime, default=datetime.utcnow) 
)

class UserModel(Base):
    """Represents a member profile node on the platform with role tiers."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="audience") # Permitted configurations: admin, organizer, audience

    # Relational link configurations connecting owned announcements and joined rosters
    events_owned = relationship("EventModel", back_populates="owner")
    events_joined = relationship("EventModel", secondary=event_attendees, back_populates="attendees")

class EventModel(Base):
    """Represents an announcement node built with strict capacity limits."""
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    location = Column(String)
    date = Column(String)
    time = Column(String)
    category = Column(String, default="Tech")
    max_capacity = Column(Integer, default=0) # A value of 0 maps to completely infinite bounds
    is_completed = Column(Boolean, default=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))

    # Relational connections mapping back to the singular creator and member arrays
    owner = relationship("UserModel", back_populates="events_owned")
    attendees = relationship("UserModel", secondary=event_attendees, back_populates="events_joined")