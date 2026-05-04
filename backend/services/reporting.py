import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from models.ioc import IOC

def generate_pdf_report(iocs: list[IOC], title: str) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=20
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles['Heading2'],
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=20,
        spaceAfter=10
    )
    
    elements = []
    
    # Cover Page
    elements.append(Paragraph("ThreatFlow Intelligence Report", title_style))
    elements.append(Paragraph(f"Title: {title}", styles['Normal']))
    elements.append(Paragraph(f"Generated: {datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", styles['Normal']))
    elements.append(Spacer(1, 40))
    
    # Exec Summary Stats
    total_iocs = len(iocs)
    risk_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "clean": 0}
    type_counts = {}
    
    for ioc in iocs:
        risk_counts[ioc.risk_level] = risk_counts.get(ioc.risk_level, 0) + 1
        type_counts[ioc.ioc_type] = type_counts.get(ioc.ioc_type, 0) + 1
        
    elements.append(Paragraph("Executive Summary", heading_style))
    stat_data = [["Metric", "Count"], ["Total IOCs", str(total_iocs)]]
    for r_level in ["critical", "high", "medium", "low", "clean"]:
        stat_data.append([f"{r_level.capitalize()} Risk", str(risk_counts[r_level])])
        
    stat_table = Table(stat_data, colWidths=[200, 100])
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F1F5F9')),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
    ]))
    elements.append(stat_table)
    elements.append(Spacer(1, 40))
    
    # IOC Table
    elements.append(Paragraph("Analyzed IOCs", heading_style))
    ioc_data = [["Value", "Type", "Risk Score", "Risk Level"]]
    for ioc in iocs:
        ioc_data.append([ioc.value, ioc.ioc_type.upper(), f"{ioc.risk_score:.1f}", ioc.risk_level.upper()])
        
    if len(ioc_data) > 1:
        ioc_table = Table(ioc_data, colWidths=[200, 80, 80, 100])
        ioc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ]))
        
        # Color coding risk levels row by row
        for i, row in enumerate(ioc_data[1:], start=1):
            level = row[3]
            bg_color = colors.HexColor('#F8FAFC')
            if level == "CRITICAL":
                bg_color = colors.HexColor('#FEE2E2')
            elif level == "HIGH":
                bg_color = colors.HexColor('#FFEDD5')
            elif level == "MEDIUM":
                bg_color = colors.HexColor('#FEF9C3')
            elif level == "LOW":
                bg_color = colors.HexColor('#DCFCE7')
            
            ioc_table.setStyle(TableStyle([('BACKGROUND', (0, i), (-1, i), bg_color)]))
            
        elements.append(ioc_table)
        
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
