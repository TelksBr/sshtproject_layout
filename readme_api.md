# Bot SSH API - Documentação Completa

> **⚠️ IMPORTANTE**: A API foi refatorada para seguir padrões RESTful. Use `/api/v1/*` para as novas rotas com autenticação por token. As rotas legadas continuam funcionando, mas serão descontinuadas no futuro.

## Visão Geral

A API do Bot SSH fornece endpoints para vendas, renovações, consulta de usuários, testes gratuitos e gerenciamento administrativo.

## Base URL

```
https://ipa.sshtbotsystem.com.br
```

## Autenticação

### 🔑 Como Obter o Token

1. Ative a Sales API no menu do bot: `/admin → [08] → [07] → [02] Ativar vendas via API`
2. O token será gerado automaticamente e exibido no menu
3. **Guarde o token com segurança!**

### 📝 Como Usar o Token

Todas as rotas `/api/v1/*` requerem autenticação via token no header:

```
Authorization: Bearer sales-api_abc123def456...
```

**Exemplo:**
```bash
curl -X GET "https://seu-dominio.com/api/v1/sales/plans" \
  -H "Authorization: Bearer sales-api_abc123def456..."
```

> **Nota**: As rotas legadas (`/api/sales/*`, `/api/renewals/*`, etc.) ainda funcionam sem autenticação, mas **recomendamos migrar para `/api/v1/*`**.

## 📚 Versões da API

### ✅ API RESTful v1 (Recomendado)

**Base Path**: `/api/v1/*`

- ✅ Segue padrões RESTful
- ✅ Autenticação por token obrigatória
- ✅ Métodos HTTP corretos (GET, POST, PUT, PATCH)
- ✅ URLs semânticas (recursos ao invés de ações)
- ✅ Versionamento para compatibilidade futura

### ⚠️ API Legada (Descontinuada)

**Base Path**: `/api/*` (sem versionamento)

- ⚠️ Mantida apenas para compatibilidade
- ⚠️ Será descontinuada no futuro
- ⚠️ Não segue padrões RESTful

> **💡 Recomendação**: Migre para `/api/v1/*` o quanto antes. Consulte `API_MIGRATION_GUIDE.md` para o guia completo de migração.

---

## Endpoints RESTful v1 (Recomendado)

### 🛒 Vendas (Sales API)

#### Listar Planos Disponíveis
```
GET /api/v1/sales/plans
Authorization: Bearer {token}
```

#### Criar Nova Ordem
```
POST /api/v1/sales/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "plan_id": "plan_001",
  "customer_email": "cliente@email.com",
  "customer_name": "João Silva"
}
```

**Resposta (201 Created):**
```json
{
  "success": true,
  "message": "Ordem criada com sucesso",
  "data": {
    "order_id": "uuid-da-ordem",
    "payment_id": "123456789",
    "qr_code": "...",
    "amount": 29.90,
    "expires_in": 60,
    "provider": "mercado_pago"
  }
}
```

#### Buscar Invoice por ID
```
GET /api/v1/sales/invoices/:id?force_check=false
Authorization: Bearer {token}
```

#### Buscar Credenciais por Payment ID
```
GET /api/v1/sales/credentials/:payment_id
Authorization: Bearer {token}
```

#### Solicitar Recuperação de Credenciais
```
POST /api/v1/sales/credential-recovery-requests
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_email": "cliente@email.com"
}
```

#### Recuperar Credenciais via Token
```
GET /api/v1/sales/credentials/recovery/:token
Authorization: Bearer {token}
```

### 🔄 Renovações

#### Verificar Usuário para Renovação
```
GET /api/v1/renewals/users/:username/validation
Authorization: Bearer {token}
```

#### Criar Ordem de Renovação
```
POST /api/v1/renewals/orders
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "user123",
  "plan_id": "plan_001"
}
```

### 👥 Usuários (CheckUser)

#### Consultar Usuário SSH ou V2Ray
```
GET /api/v1/users/:identifier?deviceId=device001
Authorization: Bearer {token}
```

**Exemplos:**
- `GET /api/v1/users/user123` - Consultar usuário SSH
- `GET /api/v1/users/uuid-v2ray` - Consultar usuário V2Ray
- `GET /api/v1/users/user123?deviceId=device001` - Consultar e adicionar deviceId

### 🎯 Teste Gratuito

#### Gerar Credenciais de Teste
```
POST /api/v1/tests/credentials
Authorization: Bearer {token}
Content-Type: application/json

{
  "customer_email": "teste@email.com"
}
```

#### Verificar Cooldown
```
GET /api/v1/tests/cooldowns/:email
Authorization: Bearer {token}
```

### 📧 Admin - Email

#### Obter Configuração
```
GET /api/v1/admin/email/config
Authorization: Bearer {token}
```

#### Configurar Email (Substituir Completo)
```
PUT /api/v1/admin/email/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "service": "gmail",
  "auth": {
    "user": "bot@gmail.com",
    "pass": "senha_app"
  },
  "from": {
    "name": "SSH Bot",
    "email": "bot@gmail.com"
  }
}
```

#### Atualizar Configuração (Parcial)
```
PATCH /api/v1/admin/email/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "enabled": true
}
```

#### Enviar Email de Teste
```
POST /api/v1/admin/email/test-emails
Authorization: Bearer {token}
Content-Type: application/json

{
  "to_email": "destino@email.com"
}
```

### ⚙️ Admin - Webhooks

#### Obter Configuração
```
GET /api/v1/admin/webhooks/config
Authorization: Bearer {token}
```

#### Configurar Webhook (Substituir Completo)
```
PUT /api/v1/admin/webhooks/config
Authorization: Bearer {token}
Content-Type: application/json

{
  "mp_access_token": "APP_USR-...",
  "mp_webhook_secret": "...",
  "default_payment_provider": "mercado_pago"
}
```

#### Testar Webhook
```
POST /api/v1/admin/webhooks/validations
Authorization: Bearer {token}
Content-Type: application/json

{
  "payment_id": "123456789",
  "provider": "mercado_pago"
}
```

---

## Endpoints Legados (Descontinuados)

> ⚠️ **Atenção**: Estas rotas ainda funcionam, mas serão descontinuadas. Use `/api/v1/*` quando possível.

### 🛒 Vendas (Legado)

```
GET /api/sales/plans
POST /api/sales/purchase
GET /api/sales/status/:invoice_id
GET /api/sales/credentials/:payment_id
POST /api/sales/recovery/request
GET /api/sales/recovery/:token
```

### 🔄 Renovações (Legado)

```
POST /api/renewals/check
POST /api/renewals/purchase
```

### 👥 CheckUser (Legado)

```
GET /check/:user
GET /api/checkuser/:user
```

### 🎯 Teste Gratuito (Legado)

```
POST /api/test/generate
GET /api/test/status/:email
```

### 📂 Exportações

#### Download SSH Users
```
GET /export/ssh_users/:token
```

#### Download V2Ray Users
```
GET /export/v2ray_users/:token
```

#### Status dos Exports
```
GET /export/status
```

### 📧 Gerenciamento de Email

#### Obter Configuração de Email
```
GET /api/admin/email/config
```

#### Configurar Email Service
```
POST /api/admin/email/config
Body: {
  "service": "gmail",
  "auth": {
    "user": "bot@gmail.com",
    "pass": "senha_app"
  },
  "from": {
    "name": "SSH Bot",
    "email": "bot@gmail.com"
  }
}
```

#### Testar Envio de Email
```
POST /api/admin/email/test
Body: {
  "to_email": "destino@email.com"
}
```

#### Ativar/Desativar Email Service
```
POST /api/admin/email/toggle
Body: {
  "enabled": true
}
```

#### Status do Email Service
```
GET /api/admin/email/status
```

### ⚙️ Administração de Webhooks

#### Obter Configuração do Webhook
```
GET /api/admin/webhook/config
```

#### Configurar Webhook Mercado Pago
```
POST /api/admin/webhook/config
Body: {
  "mp_access_token": "APP_USR-...",
  "mp_webhook_secret": "..."
}
```

#### Testar Webhook Manualmente
```
POST /api/admin/webhook/test/:payment_id
```

### 🔗 Webhooks (Recebimento)

#### Webhook Mercado Pago
```
POST /webhooks/mercado-pago
Headers: {
  "x-signature": "ts=...,v1=...",
  "x-request-id": "req-..."
}
```

#### Webhook Asaas
```
POST /webhooks/asaas
Headers: {
  "asaas-access-token": "..."
}
```

### 🏥 Health Check

#### Health Check
```
GET /health
```

## Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Token inválido ou ausente
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro interno do servidor

## Exemplos de Resposta

### Sucesso
```json
{
  "message": "Operação realizada com sucesso",
  "data": { ... }
}
```

### Erro
```json
{
  "error": "Mensagem de erro",
  "details": "Detalhes adicionais (opcional)"
}
```

## Collection Postman

Para testes completos, importe a collection do Postman disponível em:
- `postman_collection.json`

## Suporte

Para mais informações, consulte a documentação completa ou entre em contato com o suporte.

