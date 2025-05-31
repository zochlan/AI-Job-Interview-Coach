from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, ForeignKey, Enum as SQLAlchemyEnum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from ..config import Config

Base = declarative_base()

class QuestionType(Enum):
    """Types of interview questions."""
    BEHAVIORAL = 'behavioral'
    TECHNICAL = 'technical'
    SITUATIONAL = 'situational'
    STAR = 'star'

class User(Base):
    """User model."""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    
    sessions = relationship('InterviewSession', back_populates='user')
    
    def __repr__(self):
        return f'<User {self.username}>'

class InterviewSession(Base):
    """Interview session model."""
    __tablename__ = 'interview_sessions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    session_type = Column(SQLAlchemyEnum(QuestionType), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    
    user = relationship('User', back_populates='sessions')
    responses = relationship('Response', back_populates='session')
    
    def __repr__(self):
        return f'<InterviewSession {self.id}>'

class Response(Base):
    """Response model."""
    __tablename__ = 'responses'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('interview_sessions.id'), nullable=False)
    response_text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship('InterviewSession', back_populates='responses')
    feedback = relationship('Feedback', back_populates='response', uselist=False)
    
    def __repr__(self):
        return f'<Response {self.id}>'

class Feedback(Base):
    """Feedback model."""
    __tablename__ = 'feedback'
    
    id = Column(Integer, primary_key=True)
    response_id = Column(Integer, ForeignKey('responses.id'), unique=True, nullable=False)
    feedback_text = Column(Text, nullable=False)
    improvement_suggestions = Column(Text, nullable=False)
    professional_tone = Column(Float, nullable=False)
    clarity = Column(Float, nullable=False)
    completeness_score = Column(Float, nullable=False)
    
    response = relationship('Response', back_populates='feedback')
    
    def __repr__(self):
        return f'<Feedback {self.id}>'

class UserStats(Base):
    """User statistics model."""
    __tablename__ = 'user_stats'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), unique=True, nullable=False)
    total_sessions = Column(Integer, default=0)
    average_tone_score = Column(Float, default=0.0)
    average_clarity_score = Column(Float, default=0.0)
    average_completeness_score = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    user = relationship('User')
    
    def __repr__(self):
        return f'<UserStats {self.user_id}>'

class Prompt(Base):
    """Interview prompt model."""
    __tablename__ = 'prompts'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey('interview_sessions.id'), nullable=False)
    prompt_text = Column(Text, nullable=False)
    prompt_type = Column(SQLAlchemyEnum(QuestionType), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship('InterviewSession')
    
    def __repr__(self):
        return f'<Prompt {self.id}>'
