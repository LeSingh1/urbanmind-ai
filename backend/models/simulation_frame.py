import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class SimulationFrame(Base):
    __tablename__ = "simulation_frames"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("simulation_sessions.id"), nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    zones_geojson: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    roads_geojson: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    agent_actions: Mapped[list] = mapped_column(ARRAY(JSONB), nullable=False, default=list)
    metrics_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session = relationship("SimulationSession", back_populates="frames")
