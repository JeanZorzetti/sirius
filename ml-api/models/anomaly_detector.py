"""
Anomaly Detection Model for SEO Metrics

Implements two statistical methods:
1. Z-Score: detects anomalies based on standard deviation
2. IQR (Interquartile Range): robust to outliers

Reference:
- https://www.meegle.com/en_us/topics/anomaly-detection/anomaly-detection-in-seo-analytics
- https://nextflywebdesign.com/blog/ga4-anomaly-detection/
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Optional, Literal
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum


class Severity(str, Enum):
    """Alert severity levels"""
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class MetricType(str, Enum):
    """Supported metric types"""
    CLICKS = "clicks"
    IMPRESSIONS = "impressions"
    CTR = "ctr"
    POSITION = "position"
    CWV_LCP = "cwv_lcp"
    CWV_INP = "cwv_inp"
    CWV_CLS = "cwv_cls"
    INDEXED_PAGES = "indexed_pages"
    CRAWL_ERRORS = "crawl_errors"


@dataclass
class TimeSeriesPoint:
    """Single data point in time series"""
    date: str
    value: float
    segment: Optional[Dict[str, str]] = None  # e.g., {"country": "BR", "device": "mobile"}


@dataclass
class AnomalyAlert:
    """Anomaly detection result"""
    metric: str
    severity: Severity
    detected_at: str
    baseline: float
    current: float
    deviation: float  # % change
    confidence: float  # 0-100%
    segment: Optional[Dict[str, str]] = None
    recommended_actions: List[str] = None
    estimated_impact: Optional[Dict[str, float]] = None
    method: str = "z-score"  # or "iqr"

    def __post_init__(self):
        if self.recommended_actions is None:
            self.recommended_actions = []
        if self.estimated_impact is None:
            self.estimated_impact = {}


class AnomalyDetector:
    """
    Statistical anomaly detection for time series data

    Uses two methods:
    1. Z-Score: (x - mean) / std
    2. IQR: Q1 - 1.5*IQR to Q3 + 1.5*IQR
    """

    def __init__(
        self,
        window_size: int = 14,  # rolling window for baseline (2 weeks)
        z_threshold: float = 3.0,  # Z-score threshold (3 sigma = 99.7%)
        iqr_multiplier: float = 1.5,  # IQR multiplier
        min_data_points: int = 7,  # minimum data points needed
    ):
        self.window_size = window_size
        self.z_threshold = z_threshold
        self.iqr_multiplier = iqr_multiplier
        self.min_data_points = min_data_points

    def detect_zscore(
        self,
        data: List[TimeSeriesPoint],
        metric_type: MetricType,
    ) -> List[AnomalyAlert]:
        """
        Z-Score anomaly detection

        Detects points that are N standard deviations away from the mean.
        Works well for normally distributed data.
        """
        if len(data) < self.min_data_points:
            return []

        # Convert to pandas for easier manipulation
        df = pd.DataFrame([
            {"date": p.date, "value": p.value, "segment": p.segment}
            for p in data
        ])
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")

        # Calculate rolling statistics
        df["rolling_mean"] = df["value"].rolling(
            window=self.window_size,
            min_periods=self.min_data_points
        ).mean()

        df["rolling_std"] = df["value"].rolling(
            window=self.window_size,
            min_periods=self.min_data_points
        ).std()

        # Calculate Z-score
        df["z_score"] = (df["value"] - df["rolling_mean"]) / df["rolling_std"]

        # Detect anomalies (only in recent data, not historical)
        # We only care about the last few points
        recent_df = df.tail(3)  # last 3 days

        alerts = []
        for _, row in recent_df.iterrows():
            if pd.isna(row["z_score"]):
                continue

            abs_z = abs(row["z_score"])

            if abs_z > self.z_threshold:
                # Anomaly detected!
                baseline = row["rolling_mean"]
                current = row["value"]
                deviation = ((current - baseline) / baseline * 100) if baseline > 0 else 0

                # Determine severity
                severity = self._determine_severity(
                    metric_type, deviation, abs_z
                )

                # Calculate confidence (based on how far from threshold)
                confidence = min(100, (abs_z / self.z_threshold - 1) * 50 + 80)

                # Generate recommended actions
                actions = self._generate_actions(
                    metric_type, deviation, row.get("segment")
                )

                # Estimate impact
                impact = self._estimate_impact(
                    metric_type, current, baseline, deviation
                )

                alert = AnomalyAlert(
                    metric=metric_type.value,
                    severity=severity,
                    detected_at=row["date"].isoformat(),
                    baseline=float(baseline),
                    current=float(current),
                    deviation=float(deviation),
                    confidence=float(confidence),
                    segment=row.get("segment"),
                    recommended_actions=actions,
                    estimated_impact=impact,
                    method="z-score"
                )

                alerts.append(alert)

        return alerts

    def detect_iqr(
        self,
        data: List[TimeSeriesPoint],
        metric_type: MetricType,
    ) -> List[AnomalyAlert]:
        """
        IQR (Interquartile Range) anomaly detection

        More robust to outliers than Z-score.
        Detects points outside Q1 - 1.5*IQR to Q3 + 1.5*IQR range.
        """
        if len(data) < self.min_data_points:
            return []

        # Convert to pandas
        df = pd.DataFrame([
            {"date": p.date, "value": p.value, "segment": p.segment}
            for p in data
        ])
        df["date"] = pd.to_datetime(df["date"])
        df = df.sort_values("date")

        # Calculate rolling IQR
        def rolling_iqr_bounds(series):
            q1 = series.quantile(0.25)
            q3 = series.quantile(0.75)
            iqr = q3 - q1
            lower = q1 - self.iqr_multiplier * iqr
            upper = q3 + self.iqr_multiplier * iqr
            median = series.median()
            return pd.Series({
                "lower": lower,
                "upper": upper,
                "median": median,
                "iqr": iqr
            })

        # Calculate rolling IQR bounds
        rolling_stats = df["value"].rolling(
            window=self.window_size,
            min_periods=self.min_data_points
        ).apply(lambda x: pd.Series(rolling_iqr_bounds(x)), raw=False)

        df = pd.concat([df, rolling_stats], axis=1)

        # Detect anomalies in recent data
        recent_df = df.tail(3)

        alerts = []
        for _, row in recent_df.iterrows():
            if pd.isna(row["lower"]) or pd.isna(row["upper"]):
                continue

            value = row["value"]
            is_anomaly = value < row["lower"] or value > row["upper"]

            if is_anomaly:
                baseline = row["median"]
                deviation = ((value - baseline) / baseline * 100) if baseline > 0 else 0

                # Calculate confidence (based on how far outside bounds)
                if value < row["lower"]:
                    distance = (row["lower"] - value) / row["iqr"] if row["iqr"] > 0 else 0
                else:
                    distance = (value - row["upper"]) / row["iqr"] if row["iqr"] > 0 else 0

                confidence = min(100, distance * 30 + 70)

                severity = self._determine_severity(
                    metric_type, deviation, distance + self.iqr_multiplier
                )

                actions = self._generate_actions(
                    metric_type, deviation, row.get("segment")
                )

                impact = self._estimate_impact(
                    metric_type, value, baseline, deviation
                )

                alert = AnomalyAlert(
                    metric=metric_type.value,
                    severity=severity,
                    detected_at=row["date"].isoformat(),
                    baseline=float(baseline),
                    current=float(value),
                    deviation=float(deviation),
                    confidence=float(confidence),
                    segment=row.get("segment"),
                    recommended_actions=actions,
                    estimated_impact=impact,
                    method="iqr"
                )

                alerts.append(alert)

        return alerts

    def detect_combined(
        self,
        data: List[TimeSeriesPoint],
        metric_type: MetricType,
    ) -> List[AnomalyAlert]:
        """
        Combined detection using both Z-Score and IQR

        Returns anomalies detected by either method, with higher confidence
        for those detected by both.
        """
        zscore_alerts = self.detect_zscore(data, metric_type)
        iqr_alerts = self.detect_iqr(data, metric_type)

        # Merge alerts (deduplicate by date)
        alerts_by_date = {}

        for alert in zscore_alerts:
            alerts_by_date[alert.detected_at] = alert

        for alert in iqr_alerts:
            if alert.detected_at in alerts_by_date:
                # Detected by both methods - increase confidence
                existing = alerts_by_date[alert.detected_at]
                existing.confidence = min(100, existing.confidence + 10)
                existing.method = "z-score+iqr"
            else:
                alerts_by_date[alert.detected_at] = alert

        return list(alerts_by_date.values())

    def _determine_severity(
        self,
        metric_type: MetricType,
        deviation: float,
        score: float
    ) -> Severity:
        """Determine alert severity based on metric type and deviation"""

        # Traffic metrics (clicks, impressions) - drops are critical
        if metric_type in [MetricType.CLICKS, MetricType.IMPRESSIONS]:
            if deviation < -50 or score > 5:
                return Severity.CRITICAL
            elif deviation < -20 or score > 4:
                return Severity.WARNING
            else:
                return Severity.INFO

        # Position - getting worse (higher number) is bad
        elif metric_type == MetricType.POSITION:
            if deviation > 50 or score > 5:  # position increased 50%
                return Severity.CRITICAL
            elif deviation > 20 or score > 4:
                return Severity.WARNING
            else:
                return Severity.INFO

        # CTR - drops are concerning
        elif metric_type == MetricType.CTR:
            if deviation < -30 or score > 5:
                return Severity.CRITICAL
            elif deviation < -15 or score > 4:
                return Severity.WARNING
            else:
                return Severity.INFO

        # Core Web Vitals - increases are bad
        elif metric_type in [MetricType.CWV_LCP, MetricType.CWV_INP, MetricType.CWV_CLS]:
            if deviation > 30 or score > 5:
                return Severity.CRITICAL
            elif deviation > 15 or score > 4:
                return Severity.WARNING
            else:
                return Severity.INFO

        # Indexation - errors increasing is critical
        elif metric_type == MetricType.CRAWL_ERRORS:
            if deviation > 50 or score > 4:
                return Severity.CRITICAL
            elif deviation > 20 or score > 3:
                return Severity.WARNING
            else:
                return Severity.INFO

        # Default
        else:
            if score > 5:
                return Severity.CRITICAL
            elif score > 4:
                return Severity.WARNING
            else:
                return Severity.INFO

    def _generate_actions(
        self,
        metric_type: MetricType,
        deviation: float,
        segment: Optional[Dict[str, str]]
    ) -> List[str]:
        """Generate recommended actions based on anomaly"""

        actions = []

        # Traffic drops
        if metric_type == MetricType.CLICKS and deviation < -20:
            actions.append("🚨 Verificar Google Search Console para erros de indexação")
            actions.append("📊 Comparar com dados de anos anteriores (sazonalidade?)")
            actions.append("🔍 Verificar se houve update do algoritmo do Google")

            if segment and "country" in segment:
                country = segment["country"]
                actions.append(f"🌍 Verificar robots.txt e hreflang para {country}")
                actions.append(f"🔒 Verificar se servidor está bloqueando IPs de {country}")

            if segment and "device" in segment:
                device = segment["device"]
                actions.append(f"📱 Verificar problemas específicos de {device}")
                actions.append(f"⚡ Testar Core Web Vitals em {device}")

        # Position worsening
        elif metric_type == MetricType.POSITION and deviation > 20:
            actions.append("🔍 Analisar competidores no SERP")
            actions.append("📝 Verificar se conteúdo precisa de atualização")
            actions.append("🔗 Revisar backlinks (perdeu algum importante?)")
            actions.append("⚡ Verificar Core Web Vitals da página")

        # CTR drops
        elif metric_type == MetricType.CTR and deviation < -15:
            actions.append("✏️ Otimizar title e meta description")
            actions.append("⭐ Adicionar/melhorar structured data (rich snippets)")
            actions.append("📊 Comparar snippet com competidores")
            actions.append("🎯 Verificar se intent da keyword mudou")

        # Core Web Vitals degradation
        elif metric_type in [MetricType.CWV_LCP, MetricType.CWV_INP, MetricType.CWV_CLS]:
            actions.append("⚡ Executar PageSpeed Insights para diagnóstico detalhado")
            actions.append("🖼️ Otimizar imagens (Next.js Image, WebP, lazy loading)")
            actions.append("📦 Verificar bundle size e code splitting")
            actions.append("🔄 Revisar JavaScript executado no carregamento")

        # Indexation errors
        elif metric_type == MetricType.CRAWL_ERRORS and deviation > 20:
            actions.append("🔍 Usar URL Inspection API para detalhes dos erros")
            actions.append("📄 Verificar robots.txt e sitemaps")
            actions.append("🔗 Corrigir links quebrados (404s)")
            actions.append("♻️ Re-submeter páginas via Google Search Console")

        # Generic
        if not actions:
            actions.append("📊 Investigar causa raiz da anomalia")
            actions.append("📈 Monitorar métrica nas próximas 48h")

        return actions

    def _estimate_impact(
        self,
        metric_type: MetricType,
        current: float,
        baseline: float,
        deviation: float
    ) -> Dict[str, float]:
        """Estimate business impact of anomaly"""

        impact = {}

        if metric_type == MetricType.CLICKS:
            lost_clicks = baseline - current if deviation < 0 else 0
            impact["clicks_lost"] = lost_clicks
            # Assume $2-10 CPC depending on niche
            impact["estimated_revenue_impact"] = lost_clicks * 5

        elif metric_type == MetricType.IMPRESSIONS:
            lost_impressions = baseline - current if deviation < 0 else 0
            impact["impressions_lost"] = lost_impressions
            # Estimate potential clicks lost (assuming 3% CTR)
            impact["potential_clicks_lost"] = lost_impressions * 0.03

        elif metric_type == MetricType.POSITION:
            if deviation > 0:  # position got worse
                # Rough estimate: every 1 position = 3% CTR loss
                positions_lost = (current - baseline)
                impact["positions_lost"] = positions_lost
                impact["estimated_ctr_loss_percent"] = positions_lost * 3

        return impact


# Example usage
if __name__ == "__main__":
    # Sample data: clicks per day
    data = [
        TimeSeriesPoint("2026-01-01", 100),
        TimeSeriesPoint("2026-01-02", 105),
        TimeSeriesPoint("2026-01-03", 98),
        TimeSeriesPoint("2026-01-04", 102),
        TimeSeriesPoint("2026-01-05", 110),
        TimeSeriesPoint("2026-01-06", 95),
        TimeSeriesPoint("2026-01-07", 103),
        TimeSeriesPoint("2026-01-08", 107),
        TimeSeriesPoint("2026-01-09", 99),
        TimeSeriesPoint("2026-01-10", 30),  # ANOMALY: sudden drop
    ]

    detector = AnomalyDetector()
    alerts = detector.detect_combined(data, MetricType.CLICKS)

    for alert in alerts:
        print(f"🚨 ANOMALY DETECTED!")
        print(f"Metric: {alert.metric}")
        print(f"Severity: {alert.severity}")
        print(f"Baseline: {alert.baseline:.1f}")
        print(f"Current: {alert.current:.1f}")
        print(f"Deviation: {alert.deviation:.1f}%")
        print(f"Confidence: {alert.confidence:.1f}%")
        print(f"Recommended Actions:")
        for action in alert.recommended_actions:
            print(f"  - {action}")
        print()
