"""phase 1 foundation schema

Revision ID: 0001_phase1_foundation
Revises:
Create Date: 2026-04-28 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from geoalchemy2 import Geometry
from sqlalchemy.dialects import postgresql

revision = "0001_phase1_foundation"
down_revision = None
branch_labels = None
depends_on = None

CITY_SEEDS = [
    {
        "id": "abb0bf4f-1418-51b8-a7db-7e03f0a92b65",
        "slug": "new_york",
        "name": "New York City",
        "country": "United States",
        "wkt": "POLYGON((-74.26 40.48, -73.7 40.48, -73.7 40.92, -74.26 40.92, -74.26 40.48))",
        "center_lat": 40.71,
        "center_lng": -74.01,
        "default_zoom": 11,
        "climate_zone": "Humid subtropical",
        "population_current": 8300000,
        "gdp_per_capita": 85000,
        "urban_growth_rate": 0.4
    },
    {
        "id": "73eb644c-eb92-5f64-a581-ddf4d579bfe7",
        "slug": "los_angeles",
        "name": "Los Angeles",
        "country": "United States",
        "wkt": "POLYGON((-118.67 33.7, -117.65 33.7, -117.65 34.35, -118.67 34.35, -118.67 33.7))",
        "center_lat": 34.05,
        "center_lng": -118.24,
        "default_zoom": 10,
        "climate_zone": "Mediterranean",
        "population_current": 3900000,
        "gdp_per_capita": 72000,
        "urban_growth_rate": 0.6
    },
    {
        "id": "806e551e-4b10-535e-8914-a9821377c474",
        "slug": "tokyo",
        "name": "Tokyo",
        "country": "Japan",
        "wkt": "POLYGON((139.45 35.52, 139.93 35.52, 139.93 35.82, 139.45 35.82, 139.45 35.52))",
        "center_lat": 35.68,
        "center_lng": 139.69,
        "default_zoom": 11,
        "climate_zone": "Humid subtropical",
        "population_current": 14000000,
        "gdp_per_capita": 52000,
        "urban_growth_rate": -0.1
    },
    {
        "id": "5978f048-41cc-5410-8476-0348c07c1c07",
        "slug": "lagos",
        "name": "Lagos",
        "country": "Nigeria",
        "wkt": "POLYGON((3.1 6.35, 3.7 6.35, 3.7 6.7, 3.1 6.7, 3.1 6.35))",
        "center_lat": 6.52,
        "center_lng": 3.38,
        "default_zoom": 11,
        "climate_zone": "Tropical wet",
        "population_current": 15900000,
        "gdp_per_capita": 4200,
        "urban_growth_rate": 5.8
    },
    {
        "id": "3fa8355a-257d-510f-9b71-d64dc4b88617",
        "slug": "london",
        "name": "London",
        "country": "United Kingdom",
        "wkt": "POLYGON((-0.52 51.28, 0.33 51.28, 0.33 51.7, -0.52 51.7, -0.52 51.28))",
        "center_lat": 51.51,
        "center_lng": -0.12,
        "default_zoom": 11,
        "climate_zone": "Oceanic",
        "population_current": 9650000,
        "gdp_per_capita": 58000,
        "urban_growth_rate": 0.9
    },
    {
        "id": "02f43b9d-3143-5316-8b5e-cf3170f5b041",
        "slug": "sao_paulo",
        "name": "S\u00e3o Paulo",
        "country": "Brazil",
        "wkt": "POLYGON((-46.93 -23.8, -46.37 -23.8, -46.37 -23.36, -46.93 -23.36, -46.93 -23.8))",
        "center_lat": -23.55,
        "center_lng": -46.63,
        "default_zoom": 11,
        "climate_zone": "Humid subtropical",
        "population_current": 12300000,
        "gdp_per_capita": 18000,
        "urban_growth_rate": 1.2
    },
    {
        "id": "456a2c49-8e7d-5e57-8078-3546073f2b9b",
        "slug": "singapore",
        "name": "Singapore",
        "country": "Singapore",
        "wkt": "POLYGON((103.6 1.15, 104.08 1.15, 104.08 1.48, 103.6 1.48, 103.6 1.15))",
        "center_lat": 1.35,
        "center_lng": 103.82,
        "default_zoom": 12,
        "climate_zone": "Tropical rainforest",
        "population_current": 5920000,
        "gdp_per_capita": 65000,
        "urban_growth_rate": 0.8
    },
    {
        "id": "2e5f106d-12d6-5e18-88c9-3c0bd724535b",
        "slug": "dubai",
        "name": "Dubai",
        "country": "United Arab Emirates",
        "wkt": "POLYGON((54.9 24.98, 55.65 24.98, 55.65 25.4, 54.9 25.4, 54.9 24.98))",
        "center_lat": 25.2,
        "center_lng": 55.27,
        "default_zoom": 11,
        "climate_zone": "Hot desert",
        "population_current": 3600000,
        "gdp_per_capita": 42000,
        "urban_growth_rate": 3.2
    },
    {
        "id": "c9d0672a-c185-5334-9d69-ae815323b179",
        "slug": "mumbai",
        "name": "Mumbai",
        "country": "India",
        "wkt": "POLYGON((72.74 18.9, 73.05 18.9, 73.05 19.28, 72.74 19.28, 72.74 18.9))",
        "center_lat": 19.08,
        "center_lng": 72.88,
        "default_zoom": 11,
        "climate_zone": "Tropical wet and dry",
        "population_current": 20700000,
        "gdp_per_capita": 8500,
        "urban_growth_rate": 1.8
    }
]


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    status_enum = postgresql.ENUM("running", "paused", "complete", "error", name="simulation_status")
    status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "cities",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(length=60), nullable=False, unique=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("country", sa.String(length=50), nullable=False),
        sa.Column("boundary_geom", Geometry("POLYGON", srid=4326), nullable=False),
        sa.Column("center_lat", sa.Float(), nullable=False),
        sa.Column("center_lng", sa.Float(), nullable=False),
        sa.Column("default_zoom", sa.Integer(), nullable=False),
        sa.Column("climate_zone", sa.String(length=30), nullable=False),
        sa.Column("population_current", sa.Integer(), nullable=False),
        sa.Column("gdp_per_capita", sa.Float(), nullable=False),
        sa.Column("urban_growth_rate", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_cities_slug", "cities", ["slug"])

    op.create_table(
        "simulation_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("city_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("cities.id"), nullable=False),
        sa.Column("scenario_id", sa.String(length=30), nullable=False),
        sa.Column("status", status_enum, nullable=False),
        sa.Column("current_year", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("agent_weights", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("metrics_history", postgresql.ARRAY(postgresql.JSONB()), nullable=False, server_default=sa.text("ARRAY[]::jsonb[]")),
        sa.Column("user_overrides", postgresql.ARRAY(postgresql.JSONB()), nullable=False, server_default=sa.text("ARRAY[]::jsonb[]")),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "simulation_frames",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("simulation_sessions.id"), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("zones_geojson", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("roads_geojson", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("agent_actions", postgresql.ARRAY(postgresql.JSONB()), nullable=False, server_default=sa.text("ARRAY[]::jsonb[]")),
        sa.Column("metrics_snapshot", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "zone_explanations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("context_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("zone_type", sa.String(length=50), nullable=False),
        sa.Column("explanation_text", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_zone_explanations_context_hash", "zone_explanations", ["context_hash"])

    for city in CITY_SEEDS:
        op.execute(
            sa.text(
                """
                INSERT INTO cities (
                    id, slug, name, country, boundary_geom, center_lat, center_lng,
                    default_zoom, climate_zone, population_current, gdp_per_capita, urban_growth_rate
                ) VALUES (
                    :id, :slug, :name, :country, ST_GeomFromText(:wkt, 4326), :center_lat, :center_lng,
                    :default_zoom, :climate_zone, :population_current, :gdp_per_capita, :urban_growth_rate
                )
                """
            ).bindparams(**city)
        )


def downgrade() -> None:
    op.drop_index("ix_zone_explanations_context_hash", table_name="zone_explanations")
    op.drop_table("zone_explanations")
    op.drop_table("simulation_frames")
    op.drop_table("simulation_sessions")
    op.drop_index("ix_cities_slug", table_name="cities")
    op.drop_table("cities")
    postgresql.ENUM(name="simulation_status").drop(op.get_bind(), checkfirst=True)
