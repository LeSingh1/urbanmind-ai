import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import inch
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet


def build_planning_report(city_name: str, scenario: str, status: str, metrics_history: list[dict[str, Any]], actions: list[dict[str, Any]]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=42, leftMargin=42, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    story: list[Any] = []
    final = metrics_history[-1] if metrics_history else {}

    story += [
        Paragraph("UrbanMind AI", styles["Title"]),
        Paragraph("Urban Planning Report", styles["Heading1"]),
        Paragraph(f"{city_name} · {datetime.utcnow().date().isoformat()} · {scenario}", styles["Heading2"]),
        Paragraph("Powered by AI", styles["Normal"]),
        PageBreak(),
        Paragraph("Executive Summary", styles["Heading1"]),
        Paragraph(_summary(city_name, scenario, final), styles["BodyText"]),
        Spacer(1, 0.2 * inch),
        _key_stats(final),
        PageBreak(),
        Paragraph("Population Growth Chart", styles["Heading1"]),
        _metric_table(metrics_history, ["year", "pop_total", "pop_growth_rate", "pop_density_avg"]),
        PageBreak(),
        Paragraph("Zone Distribution Map", styles["Heading1"]),
        Paragraph("Final city map snapshot is represented by the latest simulation state and Mapbox basemap in the live app.", styles["BodyText"]),
        PageBreak(),
        Paragraph("Metrics Dashboard", styles["Heading1"]),
        _metric_table(metrics_history, ["year", "mobility_commute", "env_green_ratio", "equity_infra_gini", "infra_power_load", "infra_water_capacity"]),
        PageBreak(),
        Paragraph("Infrastructure Timeline", styles["Heading1"]),
        _actions_table(actions),
        PageBreak(),
        Paragraph("Recommendations", styles["Heading1"]),
        Paragraph("1. Prioritize transit-linked density near new employment centers.<br/>2. Reserve flood-prone land for parks and retention landscapes.<br/>3. Expand hospitals and schools ahead of residential growth.<br/>4. Keep industrial logistics close to freight corridors but buffered from housing.<br/>5. Re-run scenario comparison before approving large capital projects.", styles["BodyText"]),
        PageBreak(),
        Paragraph("Appendix: Metrics Table", styles["Heading1"]),
        _metric_table(metrics_history, list(final.keys())[:12] if final else ["year"]),
    ]
    doc.build(story)
    buffer.seek(0)
    return buffer


def _summary(city_name: str, scenario: str, final: dict[str, Any]) -> str:
    return (
        f"The {scenario} scenario for {city_name} projects a 50-year expansion path that balances land use, infrastructure capacity, "
        f"mobility, climate exposure, and public services. Final population reaches {final.get('pop_total', 'n/a')}, with transit coverage, "
        f"school access, hospital access, and green-space ratios tracked year by year. The report highlights where infrastructure unlocks "
        f"growth and where constraints such as flood exposure, commute time, and power load require intervention."
    )


def _key_stats(final: dict[str, Any]) -> Table:
    rows = [["Metric", "Final Value"]] + [[key.replace("_", " ").title(), str(final.get(key, ""))] for key in ["pop_total", "mobility_commute", "equity_infra_gini", "env_co2_est", "env_green_ratio", "econ_jobs_created"]]
    return _table(rows)


def _metric_table(history: list[dict[str, Any]], keys: list[str]) -> Table:
    rows = [[key.replace("_", " ").title() for key in keys]]
    selected = [item for item in history if item.get("year") in {0, 10, 25, 50}] or history[-8:]
    for item in selected:
      rows.append([str(item.get(key, "")) for key in keys])
    return _table(rows or [["No metrics"]])


def _actions_table(actions: list[dict[str, Any]]) -> Table:
    rows = [["Year", "Zone Type", "Explanation"]]
    for action in actions[:40]:
        rows.append([str(action.get("year", "")), str(action.get("zone_type_id", "")), str(action.get("explanation_text", action.get("rejection_reason", "")))[:100]])
    if len(rows) == 1:
        rows.append(["-", "No major placements recorded", "-"])
    return _table(rows)


def _table(rows: list[list[str]]) -> Table:
    table = Table(rows, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1F2937")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F3F4F6")]),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    return table
