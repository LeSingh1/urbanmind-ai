from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.session_store import session_store
import json
import io

router = APIRouter()


@router.get("/{session_id}/pdf")
async def export_pdf(session_id: str):
    session = session_store.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")

    history = session_store.get_history(session_id)

    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from reportlab.lib.units import inch

        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        story.append(Paragraph("UrbanMind AI — City Planning Report", styles["Title"]))
        story.append(Spacer(1, 0.2 * inch))

        city_id = session.get("city_id", "Unknown")
        scenario = session.get("scenario", "Unknown")
        story.append(Paragraph(f"City: {city_id}", styles["Heading2"]))
        story.append(Paragraph(f"Scenario: {scenario}", styles["Heading2"]))
        story.append(Paragraph(f"Status: {session.get('status', 'unknown')}", styles["Normal"]))
        story.append(Spacer(1, 0.2 * inch))

        if history:
            last = history[-1]
            metrics = last.get("metrics", {})
            if metrics:
                story.append(Paragraph("Final Metrics", styles["Heading2"]))
                rows = [["Metric", "Value"]]
                for k, v in list(metrics.items())[:20]:
                    rows.append([k.replace("_", " ").title(), str(round(v, 2)) if isinstance(v, float) else str(v)])
                t = Table(rows, colWidths=[3 * inch, 2 * inch])
                t.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1B4F8A")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F0F4F8")]),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E0")),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("PADDING", (0, 0), (-1, -1), 6),
                ]))
                story.append(t)

        doc.build(story)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=urbanmind_{session_id[:8]}.pdf"},
        )
    except ImportError:
        # reportlab not installed — return JSON
        data = {"session_id": session_id, "session": session, "history": history}
        return StreamingResponse(
            io.BytesIO(json.dumps(data, indent=2).encode()),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=urbanmind_{session_id[:8]}.json"},
        )
