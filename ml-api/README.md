# SEO ML API

Machine Learning API para insights acionáveis de SEO.

## 🚀 Features

### ✅ Implementado

- **Anomaly Detection**: Detecção de anomalias em métricas de SEO usando Z-Score + IQR
  - Detecta quedas de tráfego, erros de indexação, problemas de CWV
  - Gera ações recomendadas automaticamente
  - Estima impacto em receita

### 🔜 Roadmap

- **Predictive Ranking**: Prever oportunidades de ranking
- **Keyword Clustering**: Agrupar keywords por tópico
- **Content Decay**: Prever quando conteúdo vai "envelhecer"

## 📦 Setup

### 1. Instalar Python 3.11+

```bash
python --version  # Deve ser 3.11 ou superior
```

### 2. Criar ambiente virtual

```bash
cd ml-api
python -m venv venv

# Ativar (Windows)
venv\Scripts\activate

# Ativar (Linux/Mac)
source venv/bin/activate
```

### 3. Instalar dependências

```bash
pip install -r requirements.txt
```

### 4. Rodar servidor

```bash
# Modo desenvolvimento (com auto-reload)
python api/main.py

# Ou usando uvicorn diretamente
uvicorn api.main:app --reload --port 8000
```

O servidor estará disponível em: **http://localhost:8000**

## 📖 API Documentation

Acesse a documentação interativa em: **http://localhost:8000/docs**

## 🔌 Endpoints

### POST /api/ml/detect-anomalies

Detecta anomalias em time series data.

**Request:**
```json
{
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
```

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "metric": "clicks",
      "severity": "critical",
      "detected_at": "2026-01-23T00:00:00",
      "baseline": 101.0,
      "current": 30.0,
      "deviation": -70.3,
      "confidence": 98.5,
      "recommended_actions": [
        "🚨 Verificar Google Search Console para erros de indexação",
        "📊 Comparar com dados de anos anteriores (sazonalidade?)"
      ],
      "estimated_impact": {
        "clicks_lost": 71.0,
        "estimated_revenue_impact": 355.0
      },
      "method": "z-score+iqr"
    }
  ],
  "total_alerts": 1,
  "critical_count": 1,
  "warning_count": 0,
  "info_count": 0
}
```

## 🧪 Testes

### Testar modelo localmente

```bash
cd ml-api
python models/anomaly_detector.py
```

### Testar API com curl

```bash
curl -X POST "http://localhost:8000/api/ml/detect-anomalies" \
  -H "Content-Type: application/json" \
  -d '{
    "data": [
      {"date": "2026-01-01", "value": 100},
      {"date": "2026-01-02", "value": 105},
      {"date": "2026-01-03", "value": 98},
      {"date": "2026-01-04", "value": 102},
      {"date": "2026-01-05", "value": 110},
      {"date": "2026-01-06", "value": 95},
      {"date": "2026-01-07", "value": 103},
      {"date": "2026-01-08", "value": 107},
      {"date": "2026-01-09", "value": 99},
      {"date": "2026-01-10", "value": 30}
    ],
    "metric_type": "clicks",
    "window_size": 7,
    "z_threshold": 3.0,
    "method": "combined"
  }'
```

## 🔧 Configuração do Next.js

### 1. Adicionar variável de ambiente

```bash
# .env.local
ML_API_URL=http://localhost:8000
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
```

### 2. Usar o client

```typescript
import { detectAnomalies, historyToTimeSeries } from '@/lib/ml/anomaly-detection'

// Convert GSC data to time series
const clicksData = historyToTimeSeries(metrics.history, 'clicks')

// Detect anomalies
const results = await detectAnomalies({
  data: clicksData,
  metric_type: 'clicks',
  method: 'combined',
})

// Render alerts
<SEOAnomalyAlerts results={results} />
```

## 🐳 Deploy (Docker)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t seo-ml-api .
docker run -p 8000:8000 seo-ml-api
```

## 🌐 Deploy (Railway/Render)

### Railway

1. Conecte o repositório
2. Defina o comando de start: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
3. Configure as variáveis de ambiente se necessário

### Render

1. Crie um novo Web Service
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn api.main:app --host 0.0.0.0 --port $PORT`

## 📚 Referências

- [scikit-learn Anomaly Detection](https://scikit-learn.org/stable/modules/outlier_detection.html)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [ML for SEO - Research](https://www.searchviu.com/en/machine-learning-seo-predicting-rankings/)

## 🐛 Troubleshooting

### ModuleNotFoundError

```bash
# Certifique-se de estar no diretório ml-api
cd ml-api

# Reinstale as dependências
pip install -r requirements.txt
```

### CORS errors

Adicione o domínio do frontend em `api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://seu-dominio.vercel.app"
    ],
    ...
)
```

### API não responde

Verifique se o servidor está rodando:

```bash
curl http://localhost:8000/health
```

## 📝 License

MIT
