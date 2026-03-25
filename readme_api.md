# Bot SSH T Project - API v1

**Versão:** 1.0.0  
**Última atualização:** 23/03/2026

## 📋 Visão Geral

API RESTful para gerenciamento de vendas, renovações e testes gratuitos de credenciais SSH e V2Ray.

- ✅ Padrão REST com versionamento
- ✅ Autenticação via Bearer Token
- ✅ Respostas JSON padronizadas
- ✅ Suporte a Mercado Pago e Asaas

## 🌐 Base URL

```
https://bot.sshtproject.com
```

> ⚠️ **Importante:** Sempre use HTTPS em produção.

## 🔐 Autenticação

### Como Obter o Token

1. Acesse o bot no Telegram
2. Navegue: `/start → [06] → [02] Ativar vendas via API`
3. O token será gerado automaticamente
4. Copie e guarde com segurança

### Como Usar

Adicione o header em todas as rotas `/api/v1/*` (exceto rotas públicas):

```
Authorization: Bearer sales-api_seu_token_aqui
```

**Exemplo com cURL:**
```bash
curl -X GET "https://bot.sshtproject.com/api/v1/sales/plans" \
  -H "Authorization: Bearer sales-api_8c28c7dd151694afab5cb0958f1c443bb7e45315ed4cfeb1ea1569093287ca0d"
```

### Rotas Públicas (sem autenticação)

- `GET /api/v1/tests/health`
- `GET /check/:identifier`
- `GET /health`
- `GET /webhooks/mercado-pago` (diagnóstico)
- `GET /webhooks/asaas` (diagnóstico)
- `POST /webhooks/*`
- `GET /export/:type/:token` (download com token temporário)
- `GET /export/status` (debug)

## 📦 Formato de Resposta

### Resposta de Sucesso

```json
{
  "success": true,
  "message": "Mensagem opcional descritiva",
  "data": {
    "...": "dados da resposta"
  }
}
```

### Resposta de Erro

```json
{
  "success": false,
  "message": "Descrição do erro",
  "code": "CODIGO_ERRO",
  "details": {
    "...": "detalhes opcionais"
  }
}
```

---

## 🛒 Sales API

### Listar Planos Disponíveis

Retorna lista de planos ativos para venda.

**Endpoint:** `GET /api/v1/sales/plans`

**Autenticação:** Bearer Token obrigatório

**Parâmetros:** Nenhum

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "monthly_1dev",
      "name": "PREMIUM - 30D 1 DISPOSITIVO(S) - R$: 4,00",
      "price": 4,
      "limit": 1,
      "validate": 31,
      "description": null,
      "active": true
    },
    {
      "id": "monthly_2dev",
      "name": "PREMIUM - 30D 2 DISPOSITIVO(S) - R$: 7,00",
      "price": 7,
      "limit": 2,
      "validate": 31,
      "description": null,
      "active": true
    }
  ]
}
```

**Códigos de Erro:**

- `401` - Token inválido ou ausente
- `503` - Vendas desabilitadas (`SALES_DISABLED`)

---

### Criar Nova Ordem de Compra

Cria uma nova ordem de compra gerando pagamento via Mercado Pago ou Asaas.

**Endpoint:** `POST /api/v1/sales/orders`

**Autenticação:** Bearer Token obrigatório

**Content-Type:** `application/json`

**Body:**

```json
{
  "plan_id": "monthly_1dev",
  "customer_email": "cliente@exemplo.com",
  "customer_name": "João Silva"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `plan_id` | string | Sim | ID do plano (obtido em `/plans`) |
| `customer_email` | string | Sim | Email válido do cliente |
| `customer_name` | string | Sim | Nome do cliente |

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "message": "Ordem criada com sucesso",
  "data": {
    "order_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "payment_id": 3948347392,
    "qr_code": "00020126580014br.gov.bcb.pix...",
    "qr_code_base64": "data:image/png;base64,iVBORw0KGgo...",
    "ticket_url": "https://www.mercadopago.com.br/payments/123456/ticket",
    "amount": 4,
    "expires_in": 60,
    "provider": "mercado_pago"
  }
}
```

**Campos da Resposta:**

- `order_id`: ID único da ordem
- `invoice_id`: ID da fatura (mesmo que order_id)
- `payment_id`: ID do pagamento no gateway (número ou string)
- `qr_code`: Código PIX copia e cola
- `qr_code_base64`: QR Code em base64 para exibição
- `ticket_url`: URL do boleto (quando disponível)
- `amount`: Valor da compra
- `expires_in`: Tempo de expiração em minutos
- `provider`: Gateway utilizado (`mercado_pago` ou `asaas`)

**Códigos de Erro:**

- `400` - Dados inválidos
  - `MISSING_REQUIRED_FIELDS` - Campos obrigatórios ausentes
  - `EMAIL_REQUIRED` - Email não fornecido
  - `INVALID_EMAIL_FORMAT` - Email em formato inválido
  - `PLAN_NOT_FOUND` - Plano não existe
- `401` - Token inválido ou ausente
- `500` - Erro no servidor ou gateway
  - `CONFIG_NOT_FOUND` - Configuração não encontrada
  - `MP_TOKEN_NOT_CONFIGURED` - Token Mercado Pago não configurado
  - `ASAAS_TOKEN_NOT_CONFIGURED` - Token Asaas não configurado
  - `GATEWAY_INIT_ERROR` - Erro ao inicializar gateway
- `503` - Vendas desabilitadas (`SALES_DISABLED`)

---

### Consultar Status da Invoice

Retorna o status de uma invoice (fatura). Quando o status é `approved` ou `completed` e existem credenciais SSH vinculadas, elas são incluídas automaticamente na resposta.

**Endpoint:** `GET /api/v1/sales/invoices/:id`

**Autenticação:** Bearer Token obrigatório

**Parâmetros de URL:**

- `:id` - ID da invoice (obtido ao criar ordem)

**Parâmetros de Query (opcionais):**

- `force_check=true` - Força consulta no gateway de pagamento

**Resposta - Pendente (200):**

```json
{
  "success": true,
  "data": {
    "id": "df8e4e40-836d-4ded-8118-b9ae954da65b",
    "invoice_id": "df8e4e40-836d-4ded-8118-b9ae954da65b",
    "status": "pending",
    "amount": 4,
    "created_at": "2026-01-04T21:06:26.884Z",
    "expires_at": "2026-01-04T22:06:26.884Z",
    "payment_id": "139999970955",
    "type": "login",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva"
  }
}
```

**Resposta - Aprovada com Credenciais (200):**

Quando `status` é `approved` ou `completed` e existem credenciais SSH vinculadas, o campo `credentials` é incluído:

```json
{
  "success": true,
  "data": {
    "id": "df8e4e40-836d-4ded-8118-b9ae954da65b",
    "invoice_id": "df8e4e40-836d-4ded-8118-b9ae954da65b",
    "status": "approved",
    "amount": 4,
    "created_at": "2026-01-04T21:06:26.884Z",
    "expires_at": "2026-01-04T22:06:26.884Z",
    "payment_id": "139999970955",
    "type": "login",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva",
    "credentials": {
      "username": "ssh_user01",
      "password": "Pass@123",
      "limit": 1,
      "expiration_date": "2026-02-04T12:15:00.000Z",
      "servers": [
        {
          "name": "Servidor BR-01",
          "host": "br01.sshtproject.com",
          "port": 22
        }
      ]
    }
  }
}
```

> **💡 Dica:** Para buscar credenciais por `payment_id` (em vez de `invoice_id`), use `GET /api/v1/sales/credentials/:payment_id`.

**Status Possíveis:**

- `pending` - Aguardando pagamento
- `approved` - Pagamento aprovado, credenciais disponíveis
- `completed` - Processamento concluído
- `cancelled` - Pagamento cancelado
- `expired` - Pagamento expirado

**Códigos de Erro:**

- `401` - Token inválido ou ausente
- `404` - Invoice não encontrada (`INVOICE_NOT_FOUND`)

---

### Buscar Credenciais por Payment ID

Busca credenciais usando o ID do pagamento do gateway (Mercado Pago ou Asaas).

**Endpoint:** `GET /api/v1/sales/credentials/:payment_id`

**Autenticação:** Bearer Token obrigatório

**Parâmetros de URL:**

- `:payment_id` - ID do pagamento no gateway

**Cenário 1 - Pagamento Pendente (200):**

```json
{
  "success": true,
  "message": "Pagamento ainda está sendo processado",
  "data": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "status": "pending",
    "amount": 4,
    "created_at": "2026-01-04T12:00:00.000Z",
    "expires_at": "2026-01-04T13:00:00.000Z"
  }
}
```

**Cenário 2 - Nova Compra Aprovada (200):**

```json
{
  "success": true,
  "message": "Credenciais encontradas com sucesso",
  "data": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "status": "completed",
    "amount": 4,
    "processed_at": "2026-01-04T12:15:00.000Z",
    "plan": {
      "name": "PREMIUM - 30D 1 DISPOSITIVO(S) - R$: 4,00",
      "price": 4,
      "validate_days": 31
    },
    "ssh_credentials": {
      "username": "ssh_user01",
      "password": "Pass@123",
      "limit": 1,
      "expiration_date": "2026-02-04T12:15:00.000Z",
      "created_at": "2026-01-04T12:15:00.000Z"
    },
    "v2ray_credentials": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "limit": 1,
      "expiration_date": "2026-02-04T12:15:00.000Z",
      "created_at": "2026-01-04T12:15:00.000Z"
    }
  }
}
```

**Cenário 3 - Renovação Concluída (200):**

```json
{
  "success": true,
  "message": "Renovação concluída com sucesso",
  "data": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "type": "renovation",
    "status": "completed",
    "amount": 4,
    "approved_at": "2026-01-04T12:15:00.000Z",
    "credentials": {
      "ssh": {
        "username": "ssh_user01",
        "password": "Pass@123",
        "limit": 1,
        "expiration_date": "2026-02-04T12:15:00.000Z",
        "is_active": true
      },
      "v2ray": {
        "uuid": "550e8400-e29b-41d4-a716-446655440000",
        "limit": 1,
        "expiration_date": "2026-02-04T12:15:00.000Z",
        "is_active": true
      }
    }
  }
}
```

**Cenário 4 - Processando (200):**

```json
{
  "success": true,
  "message": "Pagamento aprovado. Credenciais sendo criadas...",
  "data": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "status": "processing",
    "amount": 4,
    "approved_at": "2026-01-04T12:15:00.000Z"
  }
}
```

**Cenário 5 - Pagamento Expirado/Cancelado (400):**

```json
{
  "success": false,
  "message": "Pagamento expirou",
  "code": "PAYMENT_EXPIRED",
  "details": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "status": "expired",
    "amount": 4
  }
}
```

**Códigos de Erro:**

- `400` - Pagamento cancelado ou expirado (`PAYMENT_CANCELLED`, `PAYMENT_EXPIRED`)
- `401` - Token inválido ou ausente
- `404` - Pagamento não encontrado (`PAYMENT_NOT_FOUND`)
- `500` - Credenciais não encontradas (`CREDENTIALS_NOT_FOUND`)

---

### Solicitar Recuperação de Credenciais

Envia email com todas as credenciais ativas e expiradas do cliente.

**Endpoint:** `POST /api/v1/sales/credential-recovery-requests`

**Autenticação:** Bearer Token obrigatório

**Content-Type:** `application/json`

**Body:**

```json
{
  "customer_email": "cliente@exemplo.com"
}
```

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "message": "2 credencial(is) ativa(s) enviada(s) para seu email",
  "data": {
    "email": "cliente@exemplo.com",
    "sent_at": "2026-01-04T12:00:00.000Z"
  }
}
```

**Possíveis Mensagens:**

- `"X credencial(is) ativa(s) enviada(s) para seu email"`
- `"X credencial(is) ativa(s) e Y expirada(s) enviadas para seu email"`
- `"X credencial(is) expirada(s) encontrada(s) - verifique seu email para renovação"`

**Códigos de Erro:**

- `400` - Email inválido ou sem compras
  - `EMAIL_REQUIRED` - Email não fornecido
  - `INVALID_EMAIL_FORMAT` - Email em formato inválido
  - Mensagem: "Nenhuma compra encontrada para este email"
  - Mensagem: "Serviço de email não está disponível"
- `401` - Token inválido ou ausente

---

### Recuperar Credenciais via Token

Recupera credenciais usando token recebido no email (link único, usado apenas uma vez).

**Endpoint:** `GET /api/v1/sales/credentials/recovery/:token`

**Autenticação:** Bearer Token obrigatório

**Parâmetros de URL:**

- `:token` - Token de recuperação recebido por email

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "message": "Credenciais recuperadas com sucesso",
  "data": {
    "payment_id": 3948347392,
    "invoice_id": "7b1c4a2d-8e3f-4b9c-a1d5-e6f7g8h9i0j1",
    "customer_name": "João Silva",
    "customer_email": "cliente@exemplo.com",
    "amount": 4,
    "processed_at": "2026-01-04T12:15:00.000Z",
    "plan": {
      "name": "PREMIUM - 30D 1 DISPOSITIVO(S) - R$: 4,00",
      "price": 4,
      "validate_days": 31
    },
    "ssh_credentials": {
      "username": "ssh_user01",
      "password": "Pass@123",
      "limit": 1,
      "expiration_date": "2026-02-04T12:15:00.000Z",
      "created_at": "2026-01-04T12:15:00.000Z",
      "servers": [
        {
          "name": "Servidor BR-01",
          "host": "br01.sshtproject.com",
          "port": 22
        }
      ]
    },
    "v2ray_credentials": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "limit": 1,
      "expiration_date": "2026-02-04T12:15:00.000Z",
      "created_at": "2026-01-04T12:15:00.000Z",
      "servers": [
        {
          "name": "Servidor BR-01",
          "host": "br01.sshtproject.com",
          "port": 22
        }
      ]
    },
    "recovered_at": "2026-01-04T12:20:00.000Z"
  }
}
```

**Códigos de Erro:**

- `400` - Token inválido ou outros erros
  - `TOKEN_REQUIRED` - Token não fornecido
  - `INVOICE_NOT_FOUND` - Compra não encontrada
  - `CREDENTIALS_NOT_FOUND` - Credenciais não encontradas
- `401` - Token de autenticação inválido
- `404` - Token de recuperação inválido ou expirado
  - `INVALID_TOKEN` - Token inválido ou expirado
  - `EXPIRED_TOKEN` - Token expirou

---

## 🔄 Renewals API

### Validar Usuário para Renovação

Verifica se um usuário (SSH ou V2Ray) existe e pode ser renovado.

**Endpoint:** `GET /api/v1/renewals/users/:identifier/validation`

**Autenticação:** Bearer Token obrigatório

**Parâmetros de URL:**

- `:identifier` - Username SSH ou UUID V2Ray

**Resposta de Sucesso (200):**

```json
{
  "success": true,
  "data": {
    "user_type": "both",
    "current_expiration": "2026-02-04T12:00:00.000Z",
    "is_expired": false,
    "days_until_expiration": 31,
    "can_renew": true,
    "ssh": {
      "username": "ssh_user01",
      "limit": 1
    },
    "v2ray": {
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "limit": 1
    }
  }
}
```

**Campos da Resposta:**

- `user_type`: Tipo de credencial encontrada (`ssh`, `v2ray` ou `both`)
- `current_expiration`: Data de expiração atual
- `is_expired`: Se já expirou
- `days_until_expiration`: Dias restantes (0 se expirado)
- `can_renew`: Sempre true quando usuário existe
- `ssh`: Dados SSH (presente apenas se existe credencial SSH)
  - `username`: Nome de usuário
  - `limit`: Limite de dispositivos
- `v2ray`: Dados V2Ray (presente apenas se existe credencial V2Ray)
  - `uuid`: UUID do V2Ray
  - `limit`: Limite de dispositivos

**Códigos de Erro:**

- `400` - Identificador não fornecido (`IDENTIFIER_REQUIRED`)
- `401` - Token inválido ou ausente
- `404` - Usuário não encontrado (`USER_NOT_FOUND`)

---

### Criar Ordem de Renovação

Cria ordem de renovação para um usuário existente. Aceita identificação por username SSH ou UUID V2Ray. Suporta upgrades (adicionar V2Ray ou SSH) e downgrades (remover V2Ray).

**Endpoint:** `POST /api/v1/renewals/orders`

**Autenticação:** Bearer Token obrigatório

**Content-Type:** `application/json`

**Body:**

```json
{
  "identifier": "ssh_user01",
  "plan_id": "monthly_1dev",
  "customer_name": "João Silva"
}
```

**Parâmetros:**

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `identifier` | string | Sim | Username SSH ou UUID V2Ray |
| `plan_id` | string | Sim | ID do plano (pode ser diferente do original) |
| `customer_name` | string | Não | Nome do cliente (opcional) |
| `username` | string | Não | **Deprecated** - Use `identifier` no lugar |

> **⚠️ Nota:** O campo `username` ainda é aceito por compatibilidade, mas será removido em versões futuras. Use `identifier` que aceita tanto username SSH quanto UUID V2Ray.

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "message": "Ordem de renovação criada com sucesso",
  "data": {
    "order_id": "0f9c7a3d-2e5f-4b8c-a9d6-e1f2g3h4i5j6",
    "invoice_id": "0f9c7a3d-2e5f-4b8c-a9d6-e1f2g3h4i5j6",
    "payment_id": 9876543210,
    "qr_code": "00020126580014br.gov.bcb.pix...",
    "qr_code_base64": "data:image/png;base64,iVBORw0KGgo...",
    "ticket_url": "https://www.mercadopago.com.br/payments/123456/ticket",
    "amount": 4,
    "identifier": "ssh_user01",
    "username": "ssh_user01",
    "uuid": null,
    "current_expiration": "2026-02-04T12:00:00.000Z",
    "has_ssh": true,
    "will_create_ssh": false,
    "will_renew_ssh": true,
    "ssh_message": null,
    "has_v2ray": true,
    "will_create_v2ray": false,
    "will_renew_v2ray": true,
    "will_skip_v2ray": false,
    "v2ray_message": null,
    "expires_in": 60,
    "provider": "mercado_pago"
  }
}
```

**Campos da Resposta:**

- `order_id` / `invoice_id`: ID único da ordem/fatura
- `payment_id`: ID do pagamento no gateway
- `qr_code`: Código PIX copia e cola
- `qr_code_base64`: QR Code em base64 para exibição
- `ticket_url`: URL do boleto (quando disponível)
- `amount`: Valor da renovação
- `identifier`: Identificador usado na requisição
- `username`: Username SSH (null se identificado por V2Ray sem SSH vinculado)
- `uuid`: UUID V2Ray (null se identificado por SSH sem V2Ray vinculado)
- `current_expiration`: Data de expiração atual antes da renovação
- `has_ssh` / `will_create_ssh` / `will_renew_ssh`: Status do SSH
- `ssh_message`: Mensagem informativa sobre SSH (null quando sem observações)
- `has_v2ray` / `will_create_v2ray` / `will_renew_v2ray` / `will_skip_v2ray`: Status do V2Ray
- `v2ray_message`: Mensagem informativa sobre V2Ray (null quando sem observações)
- `expires_in`: Tempo de expiração do pagamento em minutos
- `provider`: Gateway utilizado (`mercado_pago` ou `asaas`)

**Cenários de Renovação:**

| Situação | Resultado | Mensagem |
|----------|-----------|----------|
| **SSH sem V2Ray + Plano SSH+V2Ray** | ✅ Renova SSH + **CRIA novo V2Ray** | `v2ray_message`: `"Um login V2Ray será criado automaticamente após a aprovação do pagamento"` |
| **SSH com V2Ray + Plano SSH+V2Ray** | ✅ Renova SSH + Renova V2Ray | `null` |
| **SSH sem V2Ray + Plano SSH** | ✅ Renova apenas SSH | `v2ray_message`: `"Nenhum login V2Ray foi encontrado atrelado a essas credenciais"` |
| **SSH com V2Ray + Plano SSH** | ✅ Renova apenas SSH (downgrade) | `v2ray_message`: `"Este plano não inclui V2Ray. Seu login V2Ray existente não será renovado"` |
| **V2Ray sem SSH + Plano SSH+V2Ray** | ✅ Renova V2Ray + **CRIA novo SSH** | `ssh_message`: mensagem sobre criação de SSH |
| **V2Ray sem SSH + Plano V2Ray** | ✅ Renova apenas V2Ray | `ssh_message`: mensagem informativa |

**Códigos de Erro:**

- `400` - Dados inválidos
  - `MISSING_REQUIRED_FIELDS` - `plan_id` ausente
  - `IDENTIFIER_REQUIRED` - Identificador (username ou UUID) ausente
- `401` - Token inválido ou ausente
- `404` - Recursos não encontrados
  - `USER_NOT_FOUND` - Usuário não encontrado
  - `PLAN_NOT_FOUND` - Plano não encontrado
- `500` - Erro no servidor ou gateway (mesmos códigos do `/sales/orders`)
- `503` - Vendas desabilitadas (`SALES_DISABLED`)

**Observações Importantes:**

- ✅ **Upgrade:** Se o login não tem V2Ray/SSH mas o plano inclui, será criado automaticamente
- ⚠️ **Downgrade:** Se o login tem V2Ray mas o plano não inclui, apenas o SSH será renovado
- 🔗 **Vinculação:** Quando uma nova credencial é criada, é automaticamente vinculada no banco de dados
- 📧 **Notificações:** O usuário receberá as novas credenciais por notificação após aprovação do pagamento

---

## 🎯 Tests API

### Health Check (Público)

Verifica se a API de testes está funcionando. **Não requer autenticação.**

**Endpoint:** `GET /api/v1/tests/health`

**Autenticação:** Não requerida

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "message": "Test API is running",
    "timestamp": "2026-01-04T12:00:00.000Z"
  }
}
```

---

### Validar Token de Autenticação

Valida se o token está ativo e retorna suas informações.

**Endpoint:** `GET /api/v1/tests/auth`

**Autenticação:** Bearer Token obrigatório

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "service_name": "sales-api",
    "token_created_at": "2026-01-01T10:00:00.000Z",
    "message": "Token válido e autenticado com sucesso"
  }
}
```

**Códigos de Erro:**

- `401` - Token inválido ou ausente

---

### Gerar Credenciais de Teste

Gera credenciais de teste válidas por 24 horas e envia por email.

**Endpoint:** `POST /api/v1/tests/credentials`

**Autenticação:** Bearer Token obrigatório

**Content-Type:** `application/json`

**Body:**

```json
{
  "customer_email": "teste@exemplo.com"
}
```

**Resposta de Sucesso (201):**

```json
{
  "success": true,
  "message": "Credenciais de teste enviadas por email com sucesso",
  "data": {
    "email": "teste@exemplo.com",
    "expires_in_hours": 24,
    "expiration_date": "2026-01-05T12:00:00.000Z",
    "sent_at": "2026-01-04T12:00:00.000Z",
    "credentials_type": ["SSH", "V2Ray"]
  }
}
```

**Resposta - Em Cooldown (429):**

```json
{
  "success": false,
  "message": "Este email já gerou um teste recentemente. Aguarde 12 horas",
  "code": "TOO_MANY_REQUESTS",
  "retry_after": 43200
}
```

**Campos da Resposta:**

- `email`: Email do cliente
- `expires_in_hours`: Duração do teste em horas
- `expiration_date`: Data/hora de expiração
- `sent_at`: Timestamp do envio
- `credentials_type`: Tipos de credenciais geradas
- `retry_after`: (no 429) Segundos até poder gerar novamente

**Códigos de Erro:**

- `400` - Dados inválidos
  - `EMAIL_REQUIRED` - Email não fornecido
  - `INVALID_EMAIL_FORMAT` - Email em formato inválido
  - `TEST_GENERATION_FAILED` - Falha ao gerar teste
- `401` - Token inválido ou ausente
- `429` - Rate limit atingido (`TOO_MANY_REQUESTS`)
- `500` - Erro ao enviar email (`EMAIL_SEND_FAILED`)

---

### Verificar Status de Cooldown

Verifica se um email pode gerar novo teste ou está em cooldown.

**Endpoint:** `GET /api/v1/tests/cooldowns/:email`

**Autenticação:** Bearer Token obrigatório

**Parâmetros de URL:**

- `:email` - Email a verificar

**Resposta - Pode Gerar (200):**

```json
{
  "success": true,
  "data": {
    "can_generate": true,
    "hours_remaining": 0,
    "message": "Pode gerar novo teste"
  }
}
```

**Resposta - Em Cooldown (200):**

```json
{
  "success": true,
  "data": {
    "can_generate": false,
    "hours_remaining": 8,
    "retry_after": 28800,
    "message": "Este email já gerou um teste recentemente. Aguarde 8 horas"
  }
}
```

**Códigos de Erro:**

- `400` - Email em formato inválido (`INVALID_EMAIL_FORMAT`)
- `401` - Token inválido ou ausente

---

## 👤 CheckUser API (Público)

### Verificar Usuário SSH ou V2Ray

Verifica se credenciais são válidas e retorna informações. **Não requer autenticação.**

Usado por aplicativos VPN para validar acesso de usuários.

**Endpoint:** `GET /check/:identifier`

**Autenticação:** Não requerida (rota pública)

**Parâmetros de URL:**

- `:identifier` - Username SSH ou UUID V2Ray

**Parâmetros de Query (opcionais):**

- `deviceId` - ID do dispositivo (para controle de limite)

**Formatos Aceitos:**

```bash
# Formato padrão
GET /check/ssh_user01

# Com device ID no query
GET /check/ssh_user01?deviceId=device-abc-123

# Com device ID no path (formato alternativo)
GET /check/ssh_user01&deviceid=device-abc-123

# UUID V2Ray
GET /check/550e8400-e29b-41d4-a716-446655440000
```

**Resposta - Usuário Ativo (200):**

```json
{
  "username": "ssh_user01",
  "count_connections": 1,
  "limit_connections": 1,
  "expiration_days": 31,
  "expiration_date": "04/02/2026"
}
```

**Campos da Resposta:**

- `username`: Username SSH ou UUID V2Ray
- `count_connections`: Dispositivos conectados atualmente
- `limit_connections`: Limite máximo de dispositivos
- `expiration_days`: Dias restantes até expirar
- `expiration_date`: Data de expiração (formato brasileiro)

> **Nota:** Esta rota retorna o objeto diretamente (formato DTunnel), sem o wrapper `ApiResponse`.

**Resposta - Usuário Não Encontrado ou Expirado (404):**

```json
{
  "success": false,
  "message": "User not found",
  "code": "USER_NOT_FOUND"
}
```

**Resposta - Parâmetro Inválido (400):**

```json
{
  "success": false,
  "message": "Invalid user identifier",
  "code": "INVALID_USER_PARAM"
}
```

**Comportamento:**

1. Busca usuário localmente
2. Se não encontrar e MultiCheck ativo, busca em servidores externos
3. Adiciona `deviceId` à lista de dispositivos do usuário (se fornecido)
4. Retorna dados atualizados

---

## 🔔 Webhooks (Diagnóstico)

### Status do Webhook Mercado Pago

Rota diagnóstica que confirma se o webhook está ativo. **Não requer autenticação.**

**Endpoint:** `GET /webhooks/mercado-pago`

**Autenticação:** Não requerida

**Resposta (200):**

```json
{
  "message": "Webhook Mercado Pago está ativo",
  "endpoint": "/webhooks/mercado-pago",
  "method": "POST",
  "note": "Esta rota só aceita POST com assinatura válida do Mercado Pago",
  "docs": "https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks"
}
```

---

### Status do Webhook Asaas

Rota diagnóstica que confirma se o webhook está ativo e lista IPs autorizados. **Não requer autenticação.**

**Endpoint:** `GET /webhooks/asaas`

**Autenticação:** Não requerida

**Resposta (200):**

```json
{
  "message": "Webhook Asaas está ativo",
  "endpoint": "/webhooks/asaas",
  "method": "POST",
  "official_ips": ["52.67.12.206", "18.230.8.159", "54.94.136.112", "54.94.183.101"],
  "accepted_events": [
    "PAYMENT_CONFIRMED",
    "PAYMENT_RECEIVED",
    "PAYMENT_OVERDUE",
    "PAYMENT_REFUNDED",
    "PAYMENT_DELETED",
    "PAYMENT_REPROVED_BY_RISK_ANALYSIS"
  ]
}
```

---

## 📤 Export API (Público com Token Temporário)

### Download de Exportação

Faz download de um arquivo de exportação usando token temporário (gerado internamente pelo bot admin, válido por 5 minutos).

**Endpoint:** `GET /export/:type/:token`

**Autenticação:** Não requerida (token temporário na URL)

**Parâmetros de URL:**

- `:type` - Tipo de exportação: `ssh_users`, `v2ray_users`, `ssh_resellers`, `all_users`
- `:token` - Token de autenticação temporário (gerado internamente, válido por 5 min)

**Resposta de Sucesso:** Download do arquivo (o arquivo é removido após o download)

**Resposta de Erro (404):** Token expirado ou tipo inválido

> **Nota:** Requisições de bots/Cloudflare são detectadas para evitar consumir o token acidentalmente.

---

### Status das Exportações (Debug)

Lista exportações ativas para fins de debug/admin.

**Endpoint:** `GET /export/status`

**Autenticação:** Não requerida

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "total": 2,
    "exports": [
      {
        "token": "abc123...",
        "type": "ssh_users",
        "filePath": "/tmp/export_xyz.txt",
        "exists": true
      }
    ]
  }
}
```

---

## 🏥 Health Check Global

### Status do Servidor

Verifica se o servidor está online. **Não requer autenticação.**

**Endpoint:** `GET /health`

**Autenticação:** Não requerida

**Resposta (200):**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-01-04T12:00:00.000Z",
    "server": "HTTP",
    "port": 3000
  }
}
```

---

## 📊 Códigos de Status HTTP

### Sucesso

- `200 OK` - Requisição processada com sucesso
- `201 Created` - Recurso criado com sucesso

### Erros do Cliente

- `400 Bad Request` - Dados inválidos ou requisição malformada
- `401 Unauthorized` - Token ausente ou inválido
- `403 Forbidden` - Acesso negado
- `404 Not Found` - Recurso não encontrado
- `429 Too Many Requests` - Rate limit atingido ou em cooldown

### Erros do Servidor

- `500 Internal Server Error` - Erro interno do servidor
- `503 Service Unavailable` - Serviço temporariamente indisponível

---

## 🔴 Códigos de Erro Comuns

### Autenticação

- `MISSING_TOKEN` - Token não fornecido
- `INVALID_TOKEN_FORMAT` - Formato do token inválido (use: Bearer {token})
- `EMPTY_TOKEN` - Token vazio
- `INVALID_TOKEN` - Token não existe ou inválido
- `INACTIVE_TOKEN` - Token desativado

### Validação

- `MISSING_REQUIRED_FIELDS` - Campos obrigatórios ausentes
- `EMAIL_REQUIRED` - Email obrigatório
- `INVALID_EMAIL_FORMAT` - Formato de email inválido
- `USERNAME_REQUIRED` - Username obrigatório
- `IDENTIFIER_REQUIRED` - Identificador (username ou UUID) obrigatório
- `TOKEN_REQUIRED` - Token obrigatório

### Recursos Não Encontrados

- `ROUTE_NOT_FOUND` - Rota não existe
- `PLAN_NOT_FOUND` - Plano não encontrado
- `USER_NOT_FOUND` - Usuário não encontrado
- `INVOICE_NOT_FOUND` - Invoice não encontrada
- `PAYMENT_NOT_FOUND` - Pagamento não encontrado
- `CREDENTIALS_NOT_FOUND` - Credenciais não encontradas
- `LOGIN_SALE_NOT_FOUND` - Venda original não encontrada

### Negócio

- `SALES_DISABLED` - Vendas temporariamente desabilitadas
- `PAYMENT_CANCELLED` - Pagamento cancelado
- `PAYMENT_EXPIRED` - Pagamento expirado
- `INCOMPATIBLE_PLAN` - Plano incompatível com usuário
- `TOO_MANY_REQUESTS` - Rate limit ou cooldown ativo

### Configuração/Gateway

- `CONFIG_NOT_FOUND` - Configuração não encontrada
- `MP_TOKEN_NOT_CONFIGURED` - Token Mercado Pago não configurado
- `ASAAS_TOKEN_NOT_CONFIGURED` - Token Asaas não configurado
- `GATEWAY_INIT_ERROR` - Erro ao inicializar gateway
- `GATEWAY_CHECK_ERROR` - Erro ao verificar gateway
- `CONFIG_CHECK_ERROR` - Erro ao verificar configuração

### Sistema

- `SERVICE_UNAVAILABLE` - Serviço não disponível
- `EMAIL_SEND_FAILED` - Falha ao enviar email
- `TEST_GENERATION_FAILED` - Falha ao gerar teste
- `INTERNAL_ERROR` - Erro interno
- `UNKNOWN_STATUS` - Status desconhecido

---

## 📚 Exemplos de Requisições

### cURL

**Listar Planos:**
```bash
curl -X GET "https://bot.sshtproject.com/api/v1/sales/plans" \
  -H "Authorization: Bearer sales-api_seu_token_aqui"
```

**Criar Compra:**
```bash
curl -X POST "https://bot.sshtproject.com/api/v1/sales/orders" \
  -H "Authorization: Bearer sales-api_seu_token_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "monthly_1dev",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva"
  }'
```

**Verificar Usuário (CheckUser - sem token):**
```bash
curl -X GET "https://bot.sshtproject.com/check/ssh_user01"
```

### JavaScript (Fetch)

```javascript
// Listar planos
const response = await fetch('https://bot.sshtproject.com/api/v1/sales/plans', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer sales-api_seu_token_aqui'
  }
});
const data = await response.json();

// Criar compra
const order = await fetch('https://bot.sshtproject.com/api/v1/sales/orders', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sales-api_seu_token_aqui',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    plan_id: 'monthly_1dev',
    customer_email: 'cliente@exemplo.com',
    customer_name: 'João Silva'
  })
});
const orderData = await order.json();
```

### Python (Requests)

```python
import requests

# Configuração
BASE_URL = "https://bot.sshtproject.com"
TOKEN = "sales-api_seu_token_aqui"
headers = {"Authorization": f"Bearer {TOKEN}"}

# Listar planos
response = requests.get(f"{BASE_URL}/api/v1/sales/plans", headers=headers)
plans = response.json()

# Criar compra
order_data = {
    "plan_id": "monthly_1dev",
    "customer_email": "cliente@exemplo.com",
    "customer_name": "João Silva"
}
response = requests.post(
    f"{BASE_URL}/api/v1/sales/orders",
    headers={**headers, "Content-Type": "application/json"},
    json=order_data
)
order = response.json()
```

---

## 📝 Notas Importantes

### Segurança

1. **Nunca exponha seu token publicamente**
2. Use HTTPS em produção
3. Armazene o token de forma segura
4. Regenere o token se comprometido

### Webhooks

- Mercado Pago: `POST /webhooks/mercado-pago` (HMAC-SHA256)
- Asaas: `POST /webhooks/asaas` (IP whitelist + token)
- Diagnóstico: `GET /webhooks/mercado-pago` e `GET /webhooks/asaas`
- Configuração de secrets: via painel admin do bot (Menu Admin → Configurações)

### Rate Limiting

- Testes gratuitos: 1 por email a cada 12-24 horas
- Outras rotas: sem limite definido

### Suporte

- Documentação adicional: `postman_collection.json`
- Issues: Entre em contato via Telegram

---

## 📋 Changelog

### v1.1.0 - 23/03/2026

- 🔄 Corrigido: Rota de validação de renovação agora documenta `:identifier` (não `:username`)
- 🔄 Corrigido: Response de validação inclui `user_type`, objetos `ssh`/`v2ray` separados
- 🔄 Corrigido: Ordem de renovação aceita `identifier` (depreca `username`), documenta todos os campos retornados
- 🔄 Corrigido: Invoice GET retorna `credentials` quando status é approved/completed (nota incorreta removida)
- ➕ Adicionado: Seção Webhooks Diagnóstico (GET routes)
- ➕ Adicionado: Seção Export API (`/export/:type/:token` e `/export/status`)
- ➕ Adicionado: Lista de rotas públicas atualizada
- ➕ Adicionado: Cenários de renovação V2Ray→SSH (upgrade reverso)
- 🔒 Atualizado: Notas de webhooks com métodos de segurança e configuração via bot admin

### v1.0.0 - 04/01/2026

- ✅ Documentação completa criada do zero
- ✅ Todas as rotas API v1 documentadas com exemplos reais
- ✅ Estrutura organizada por seções
- ✅ Códigos de erro detalhados
- ✅ Exemplos em múltiplas linguagens
- ✅ Baseado no código fonte da API v1

---

**© 2026 SSHTBotSystem. Todos os direitos reservados.**
