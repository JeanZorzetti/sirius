# AGI Sirius - Deployment Architecture

## Current Stack

- **Frontend/API**: Vercel (Serverless/Edge Functions)
- **Database**: VPS Easypanel (PostgreSQL)
- **Ollama**: Local (development only)

## Problem

Vercel serverless functions cannot run Ollama directly. We need Ollama accessible via HTTP.

## Solution Options

### Option A: Install Ollama on VPS (Recommended) ✅

**Setup:**
1. Install Ollama on your VPS (Easypanel)
2. Expose Ollama HTTP API (port 11434)
3. Configure firewall to allow Vercel → VPS Ollama
4. Set `AGI_OLLAMA_HOST=https://your-vps-ip:11434` in Vercel env vars

**Pros:**
- ✅ Total privacy (data stays on your infrastructure)
- ✅ No usage costs (free)
- ✅ Full control over models
- ✅ Consistent with user's original vision

**Cons:**
- ⚠️ Requires VPS disk space (~4-6GB per model)
- ⚠️ Requires VPS RAM (~4-8GB during inference)
- ⚠️ Need to manage Ollama updates

**VPS Requirements:**
- RAM: 8GB+ (16GB recommended)
- Disk: 20GB+ free
- CPU: 4+ cores
- OS: Ubuntu/Debian recommended

### Option B: Use Cloud LLM (OpenAI/Anthropic)

**Setup:**
1. Get API key from OpenAI or Anthropic
2. Update `lib/agi/brain.ts` to support both Ollama and OpenAI
3. Set env var `AGI_PROVIDER=openai` and `OPENAI_API_KEY=sk-...`

**Pros:**
- ✅ No infrastructure management
- ✅ Better performance (faster responses)
- ✅ Works immediately from Vercel

**Cons:**
- ❌ Monthly costs (~$20-100/month depending on usage)
- ❌ Data sent to external service
- ❌ Not aligned with original local/private vision

### Option C: Hybrid Approach

Use Ollama for PRO users (private, on VPS) and OpenAI for FREE users (fast, low volume).

---

## Recommended Implementation Plan

### Phase 2A: VPS Ollama Setup (If Option A)

1. **SSH into your VPS**
   ```bash
   # Install Ollama
   curl -fsSL https://ollama.com/install.sh | sh
   
   # Pull models
   ollama pull llama3.2:1b
   ollama pull llama3.2:3b
   ollama pull gemma2:2b
   
   # Start Ollama as service
   sudo systemctl enable ollama
   sudo systemctl start ollama
   ```

2. **Configure Network**
   ```bash
   # Allow external connections (edit /etc/systemd/system/ollama.service)
   Environment="OLLAMA_HOST=0.0.0.0:11434"
   
   # Restart
   sudo systemctl daemon-reload
   sudo systemctl restart ollama
   
   # Test
   curl http://localhost:11434/api/tags
   ```

3. **Firewall/Security**
   ```bash
   # Option 1: Open to Vercel IPs only (recommended)
   # Get Vercel IPs from: https://vercel.com/docs/edge-network/ip-addresses
   
   # Option 2: Use Cloudflare Tunnel (zero-trust, recommended)
   # Install cloudflared and create tunnel
   
   # Option 3: VPN/Tailscale (most secure)
   ```

4. **Vercel Environment Variables**
   ```bash
   AGI_OLLAMA_HOST="http://YOUR_VPS_IP:11434"
   # or
   AGI_OLLAMA_HOST="https://ollama.yourdomain.com"  # if using tunnel/proxy
   ```

### Phase 2B: API Implementation (Works with Both Options)

I'll create the API routes to:
- Support both Ollama and OpenAI/Anthropic
- Auto-detect provider from env vars
- Handle streaming properly in serverless
- Implement proper error handling for network timeouts

---

## Security Considerations

### If exposing Ollama on VPS:

1. **Use HTTPS** (Cloudflare Tunnel or nginx proxy)
2. **Rate Limiting** (already in CRM)
3. **IP Allowlist** (Vercel IPs only)
4. **API Authentication** (check JWT/session before proxying to Ollama)

### If using Cloud LLM:

1. **Rotate API keys** monthly
2. **Monitor costs** (set billing alerts)
3. **Sanitize inputs** (prevent prompt injection)

---

## Next Steps

**Please confirm which option you prefer:**

**Option A (VPS Ollama)?**
- I'll help you set up Ollama on Easypanel
- Provide detailed security configuration
- Update API routes to connect to VPS

**Option B (Cloud LLM)?**
- I'll add OpenAI/Anthropic support to brain.ts
- Update environment variables
- Continue with API implementation immediately

**Option C (Hybrid)?**
- Implement both providers
- PRO → Ollama (VPS)
- FREE → OpenAI (cloud)
