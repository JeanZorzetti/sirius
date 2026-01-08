# 🚀 Guia de Integração - API Sirius CRM

## Para Desenvolvedores Externos

Este guia explica como integrar seu site/aplicação com o Sirius CRM para enviar leads automaticamente.

---

## 📋 Passo 1: Gerar API Key

1. Acesse: https://sirius.roilabs.com.br/dashboard/settings
2. Clique em **"API Keys"**
3. Clique em **"Criar Nova API Key"**
4. Dê um nome (ex: "Integração Site")
5. Copie a chave gerada (começa com `sk_live_` ou `sk_test_`)

⚠️ **Importante**: Guarde a chave em local seguro. Ela só é mostrada uma vez!

---

## 🔗 Passo 2: Endpoint para Criar Contatos (Leads)

### URL Base
```
https://sirius.roilabs.com.br/api/v1
```

### Endpoint: Criar Contato
```
POST /contacts
```

### Headers Obrigatórios
```http
Authorization: Bearer SUA_API_KEY
Content-Type: application/json
```

### Corpo da Requisição (JSON)
```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+55 11 99999-9999",
  "company": "Empresa X"
}
```

### Campos
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `name` | string | ✅ Sim | Nome do contato |
| `email` | string | ❌ Não | Email do contato |
| `phone` | string | ❌ Não | Telefone do contato |
| `company` | string | ❌ Não | Empresa do contato |

---

## 💻 Exemplos de Código

### JavaScript (Fetch API)
```javascript
async function enviarLeadParaSirius(dados) {
  const response = await fetch('https://sirius.roilabs.com.br/api/v1/contacts', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sk_live_SUA_CHAVE_AQUI',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: dados.nome,
      email: dados.email,
      phone: dados.telefone,
      company: dados.empresa
    })
  });

  const resultado = await response.json();

  if (resultado.success) {
    console.log('✅ Lead criado com sucesso!', resultado.data.contact);
    return resultado.data.contact;
  } else {
    console.error('❌ Erro ao criar lead:', resultado.error);
    throw new Error(resultado.error.message);
  }
}

// Exemplo de uso
enviarLeadParaSirius({
  nome: 'João Silva',
  email: 'joao@empresa.com',
  telefone: '11999999999',
  empresa: 'Empresa X'
});
```

### PHP (cURL)
```php
<?php
function enviarLeadParaSirius($dados) {
    $apiKey = 'sk_live_SUA_CHAVE_AQUI';
    $url = 'https://sirius.roilabs.com.br/api/v1/contacts';

    $payload = json_encode([
        'name' => $dados['nome'],
        'email' => $dados['email'],
        'phone' => $dados['telefone'],
        'company' => $dados['empresa']
    ]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $resultado = json_decode($response, true);

    if ($httpCode === 201 && $resultado['success']) {
        return $resultado['data']['contact'];
    } else {
        throw new Exception($resultado['error']['message']);
    }
}

// Exemplo de uso
try {
    $lead = enviarLeadParaSirius([
        'nome' => 'João Silva',
        'email' => 'joao@empresa.com',
        'telefone' => '11999999999',
        'empresa' => 'Empresa X'
    ]);
    echo "✅ Lead criado: " . $lead['id'];
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage();
}
?>
```

### Python (requests)
```python
import requests

def enviar_lead_para_sirius(dados):
    api_key = 'sk_live_SUA_CHAVE_AQUI'
    url = 'https://sirius.roilabs.com.br/api/v1/contacts'

    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }

    payload = {
        'name': dados['nome'],
        'email': dados.get('email'),
        'phone': dados.get('telefone'),
        'company': dados.get('empresa')
    }

    response = requests.post(url, json=payload, headers=headers)
    resultado = response.json()

    if response.status_code == 201 and resultado['success']:
        print(f"✅ Lead criado com sucesso: {resultado['data']['contact']['id']}")
        return resultado['data']['contact']
    else:
        print(f"❌ Erro ao criar lead: {resultado['error']['message']}")
        raise Exception(resultado['error']['message'])

# Exemplo de uso
enviar_lead_para_sirius({
    'nome': 'João Silva',
    'email': 'joao@empresa.com',
    'telefone': '11999999999',
    'empresa': 'Empresa X'
})
```

### Node.js (Axios)
```javascript
const axios = require('axios');

async function enviarLeadParaSirius(dados) {
  try {
    const response = await axios.post(
      'https://sirius.roilabs.com.br/api/v1/contacts',
      {
        name: dados.nome,
        email: dados.email,
        phone: dados.telefone,
        company: dados.empresa
      },
      {
        headers: {
          'Authorization': 'Bearer sk_live_SUA_CHAVE_AQUI',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Lead criado:', response.data.data.contact);
      return response.data.data.contact;
    }
  } catch (error) {
    console.error('❌ Erro ao criar lead:', error.response?.data || error.message);
    throw error;
  }
}

// Exemplo de uso
enviarLeadParaSirius({
  nome: 'João Silva',
  email: 'joao@empresa.com',
  telefone: '11999999999',
  empresa: 'Empresa X'
});
```

---

## ✅ Resposta de Sucesso (201)

```json
{
  "success": true,
  "data": {
    "contact": {
      "id": "cm7x8y9z0000abc123def456",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "phone": "+55 11 99999-9999",
      "company": "Empresa X",
      "createdAt": "2026-01-08T12:00:00.000Z",
      "updatedAt": "2026-01-08T12:00:00.000Z"
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-08T12:00:00.000Z"
  }
}
```

---

## ❌ Possíveis Erros

### 401 - API Key Inválida
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired API key"
  }
}
```
**Solução**: Verifique se a API Key está correta e ativa.

---

### 400 - Validação Falhou
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validação falhou",
    "details": {
      "name": "Campo obrigatório"
    }
  }
}
```
**Solução**: O campo `name` é obrigatório. Verifique se está sendo enviado.

---

### 429 - Rate Limit Excedido
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 30 seconds."
  }
}
```
**Solução**: Aguarde alguns segundos e tente novamente.
- **FREE**: 60 requisições/minuto
- **PRO**: 300 requisições/minuto

---

## 📚 Documentação Completa

Para ver todos os endpoints disponíveis (deals, pipelines, analytics, webhooks):

👉 https://sirius.roilabs.com.br/api/docs

A documentação é interativa e permite testar os endpoints diretamente pelo navegador!

---

## 🧪 Testando a Integração

### 1. Teste via cURL
```bash
curl -X POST https://sirius.roilabs.com.br/api/v1/contacts \
  -H "Authorization: Bearer sk_live_SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Lead",
    "email": "teste@email.com",
    "phone": "11999999999"
  }'
```

### 2. Teste via Postman
1. Importe a coleção: https://sirius.roilabs.com.br/api/openapi.json
2. Configure o header `Authorization: Bearer SUA_CHAVE`
3. Execute a requisição

---

## 🔒 Segurança

1. **Nunca exponha sua API Key** no frontend (JavaScript do navegador)
2. **Sempre use HTTPS** em produção
3. **Armazene a chave em variáveis de ambiente** (`.env`)
4. **Revogue chaves antigas** quando não forem mais necessárias
5. **Use chaves diferentes** para desenvolvimento (`sk_test_`) e produção (`sk_live_`)

---

## 📞 Suporte

Dúvidas ou problemas com a integração?

- **Email**: contato@roilabs.com.br
- **Dashboard**: https://sirius.roilabs.com.br/dashboard
- **Documentação**: https://sirius.roilabs.com.br/api/docs

---

## 📊 Exemplo: Formulário de Contato → Sirius CRM

```html
<!DOCTYPE html>
<html>
<head>
  <title>Formulário de Contato</title>
</head>
<body>
  <form id="formContato">
    <input type="text" name="nome" placeholder="Nome" required>
    <input type="email" name="email" placeholder="Email">
    <input type="tel" name="telefone" placeholder="Telefone">
    <input type="text" name="empresa" placeholder="Empresa">
    <button type="submit">Enviar</button>
  </form>

  <script>
    document.getElementById('formContato').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);

      try {
        const response = await fetch('https://seu-backend.com/api/enviar-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.get('nome'),
            email: formData.get('email'),
            telefone: formData.get('telefone'),
            empresa: formData.get('empresa')
          })
        });

        if (response.ok) {
          alert('✅ Contato enviado com sucesso!');
          e.target.reset();
        } else {
          alert('❌ Erro ao enviar contato');
        }
      } catch (error) {
        console.error(error);
        alert('❌ Erro ao enviar contato');
      }
    });
  </script>
</body>
</html>
```

**Backend (exemplo Node.js/Express)**:
```javascript
app.post('/api/enviar-lead', async (req, res) => {
  const { nome, email, telefone, empresa } = req.body;

  try {
    const response = await fetch('https://sirius.roilabs.com.br/api/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SIRIUS_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: nome,
        email,
        phone: telefone,
        company: empresa
      })
    });

    const resultado = await response.json();

    if (resultado.success) {
      res.json({ success: true });
    } else {
      res.status(400).json({ success: false, error: resultado.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

✨ **Pronto! Sua integração está completa!**
