"""
FastAPI ML API for SEO Insights

Provides machine learning endpoints for:
- Anomaly detection
- Ranking prediction
- Keyword clustering
- Content decay prediction
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from models.anomaly_detector import (
    AnomalyDetector,
    TimeSeriesPoint,
    AnomalyAlert,
    MetricType,
    Severity
)

# Initialize FastAPI app
app = FastAPI(
    title="SEO ML API",
    description="Machine Learning API for SEO insights and predictions",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.vercel.app",
        "https://sirius.roilabs.com.br"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS (Pydantic)
# ============================================================================

class TimeSeriesPointRequest(BaseModel):
    """Time series data point"""
    date: str = Field(..., description="Date in ISO format (YYYY-MM-DD)")
    value: float = Field(..., description="Metric value")
    segment: Optional[Dict[str, str]] = Field(None, description="Segmentation (country, device, etc)")

    class Config:
        json_schema_extra = {
            "example": {
                "date": "2026-02-03",
                "value": 150.5,
                "segment": {"country": "BR", "device": "mobile"}
            }
        }


class DetectAnomaliesRequest(BaseModel):
    """Request body for anomaly detection"""
    data: List[TimeSeriesPointRequest] = Field(..., description="Time series data")
    metric_type: str = Field(..., description="Type of metric (clicks, impressions, etc)")
    window_size: int = Field(14, description="Rolling window size for baseline (days)")
    z_threshold: float = Field(3.0, description="Z-score threshold for anomaly detection")
    method: str = Field("combined", description="Detection method: z-score, iqr, or combined")

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {"date": "2026-01-20", "value": 100},
                    {"date": "2026-01-21", "value": 105},
                    {"date": "2026-01-22", "value": 98},
                    {"date": "2026-01-23", "value": 30}
                ],
                "metric_type": "clicks",
                "window_size": 14,
                "z_threshold": 3.0,
                "method": "combined"
            }
        }


class AnomalyAlertResponse(BaseModel):
    """Response model for anomaly alert"""
    metric: str
    severity: str
    detected_at: str
    baseline: float
    current: float
    deviation: float
    confidence: float
    segment: Optional[Dict[str, str]] = None
    recommended_actions: List[str]
    estimated_impact: Optional[Dict[str, float]] = None
    method: str

    class Config:
        json_schema_extra = {
            "example": {
                "metric": "clicks",
                "severity": "critical",
                "detected_at": "2026-02-03T00:00:00",
                "baseline": 105.3,
                "current": 30.0,
                "deviation": -71.5,
                "confidence": 98.5,
                "segment": {"country": "BR"},
                "recommended_actions": [
                    "🚨 Verificar Google Search Console para erros de indexação",
                    "📊 Comparar com dados de anos anteriores (sazonalidade?)"
                ],
                "estimated_impact": {
                    "clicks_lost": 75.3,
                    "estimated_revenue_impact": 376.5
                },
                "method": "z-score+iqr"
            }
        }


class DetectAnomaliesResponse(BaseModel):
    """Response for anomaly detection"""
    success: bool
    alerts: List[AnomalyAlertResponse]
    total_alerts: int
    critical_count: int
    warning_count: int
    info_count: int
    processed_at: str


# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "name": "SEO ML API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "anomaly_detection": "/api/ml/detect-anomalies",
            "health": "/health"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.post(
    "/api/ml/detect-anomalies",
    response_model=DetectAnomaliesResponse,
    tags=["Anomaly Detection"]
)
async def detect_anomalies(request: DetectAnomaliesRequest):
    """
    Detect anomalies in time series data

    Uses statistical methods (Z-Score and/or IQR) to identify unusual patterns
    in SEO metrics like clicks, impressions, CTR, position, Core Web Vitals, etc.

    **Methods:**
    - `z-score`: Standard deviation based detection (good for normal distributions)
    - `iqr`: Interquartile range based detection (robust to outliers)
    - `combined`: Uses both methods for higher confidence

    **Returns:**
    - List of anomaly alerts with severity, confidence, and recommended actions
    - Estimated business impact (lost clicks, revenue, etc)
    """
    try:
        # Validate metric type
        try:
            metric_type = MetricType(request.metric_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid metric_type. Must be one of: {[m.value for m in MetricType]}"
            )

        # Convert request data to TimeSeriesPoint objects
        data_points = [
            TimeSeriesPoint(
                date=point.date,
                value=point.value,
                segment=point.segment
            )
            for point in request.data
        ]

        # Initialize detector
        detector = AnomalyDetector(
            window_size=request.window_size,
            z_threshold=request.z_threshold
        )

        # Detect anomalies using selected method
        if request.method == "z-score":
            alerts = detector.detect_zscore(data_points, metric_type)
        elif request.method == "iqr":
            alerts = detector.detect_iqr(data_points, metric_type)
        elif request.method == "combined":
            alerts = detector.detect_combined(data_points, metric_type)
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid method. Must be one of: z-score, iqr, combined"
            )

        # Count alerts by severity
        critical_count = sum(1 for a in alerts if a.severity == Severity.CRITICAL)
        warning_count = sum(1 for a in alerts if a.severity == Severity.WARNING)
        info_count = sum(1 for a in alerts if a.severity == Severity.INFO)

        # Convert to response model
        alert_responses = [
            AnomalyAlertResponse(
                metric=alert.metric,
                severity=alert.severity.value,
                detected_at=alert.detected_at,
                baseline=alert.baseline,
                current=alert.current,
                deviation=alert.deviation,
                confidence=alert.confidence,
                segment=alert.segment,
                recommended_actions=alert.recommended_actions,
                estimated_impact=alert.estimated_impact,
                method=alert.method
            )
            for alert in alerts
        ]

        return DetectAnomaliesResponse(
            success=True,
            alerts=alert_responses,
            total_alerts=len(alerts),
            critical_count=critical_count,
            warning_count=warning_count,
            info_count=info_count,
            processed_at=datetime.now().isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )


# ============================================================================
# STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
