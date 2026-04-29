import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class SimulationStatus(str, enum.Enum):
    running = "running"
    paused = "paused"
    complete = "complete"
    error = "error"


class SimulationSession(Base):
    __tablename__ = "simulation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    city_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("cities.id"), nullable=False)
    scenario_id: Mapped[str] = mapped_column(String(30), nullable=False)
    status: Mapped[SimulationStatus] = mapped_column(
        Enum(SimulationStatus, name="simulation_status"),
        nullable=False,
        default=SimulationStatus.running,
    )
    current_year: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    agent_weights: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    metrics_history: Mapped[list] = mapped_column(ARRAY(JSONB), nullable=False, default=list)
    user_overrides: Mapped[list] = mapped_column(ARRAY(JSONB), nullable=False, default=list)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    city = relationship("City", back_populates="sessions")
    frames = relationship("SimulationFrame", back_populates="session", cascade="all, delete-orphan")
