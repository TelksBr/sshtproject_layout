# 🚀 API Bot SSH – Guia Completo

API REST para vendas, renovações, exportações, consulta de usuários e gerenciamento de email, com integração ao Mercado Pago.

---

## 📋 Endpoints Principais

### Vendas (`/api/sales`)
- `GET /api/sales/plans` – Listar planos disponíveis
- `POST /api/sales/purchase` – Criar nova compra
- `GET /api/sales/status/:invoice_id` – Verificar status da compra
- `GET /api/sales/credentials/:payment_id` – Buscar credenciais por pagamento
- `POST /api/sales/recovery/request` – Solicitar recuperação de credenciais por email
- `GET /api/sales/recovery/:token` – Recuperar credenciais via token

### Renovações (`/api/renewals`)
- `POST /api/renewals/check` – Verificar usuário para renovação
- `POST /api/renewals/purchase` – Renovar usuário

### Exportações (`/export`)
- `GET /export/:type/:token` – Download de arquivos exportados
- `GET /export/status` – Status dos exports ativos

### Consulta de Usuário (`/check`)
- `GET /check/:user?deviceId=xxx` – Consultar usuário SSH ou V2Ray (por username ou UUID)

### Gerenciamento de Email (`/api/admin/email`)
- `GET /api/admin/email/config` – Obter configuração de email
- `POST /api/admin/email/config` – Atualizar configuração de email
- `POST /api/admin/email/test` – Testar envio de email
- `POST /api/admin/email/toggle` – Ativar/desativar serviço de email
- `GET /api/admin/email/status` – Status do serviço de email

---

## 🔧 Exemplos de Uso

### 1. Listar Planos Disponíveis
```bash
curl -X GET "http://localhost:3000/api/sales/plans"
```

### 2. Criar Nova Compra
```bash
curl -X POST "http://localhost:3000/api/sales/purchase" \
  -H "Content-Type: application/json" \
  -d '{ "plan_id": "plan_001", "customer_email": "cliente@email.com", "customer_name": "João Silva" }'
```

### 3. Verificar Status da Compra
```bash
curl -X GET "http://localhost:3000/api/sales/status/INVOICE_ID"
```

### 4. Buscar Credenciais por Pagamento
```bash
curl -X GET "http://localhost:3000/api/sales/credentials/PAYMENT_ID"
```

**Nota**: Para renovações, retorna as credenciais atualizadas com nova data de expiração.

### 5. Solicitar Recuperação de Credenciais
```bash
curl -X POST "http://localhost:3000/api/sales/recovery/request" \
  -H "Content-Type: application/json" \
  -d '{ "customer_email": "cliente@email.com" }'
```

### 6. Recuperar Credenciais via Token
```bash
curl -X GET "http://localhost:3000/api/sales/recovery/TOKEN"
```

### 7. Verificar Usuário para Renovação
```bash
curl -X POST "http://localhost:3000/api/renewals/check" \
  -H "Content-Type: application/json" \
  -d '{ "username": "user123" }'
```

### 8. Renovar Usuário
```bash
curl -X POST "http://localhost:3000/api/renewals/purchase" \
  -H "Content-Type: application/json" \
  -d '{ "username": "user123", "plan_id": "plan_001" }'
```

### 9. Exportar Dados
```bash
curl -X GET "http://localhost:3000/export/ssh_users/SEU_TOKEN"
curl -X GET "http://localhost:3000/export/status"
```

### 10. Consultar Usuário (CheckUser)
```bash
curl -X GET "http://localhost:3000/check/Talkera"
curl -X GET "http://localhost:3000/check/UUID-DO-V2RAY"
```
Parâmetro opcional: `?deviceId=SEU_DEVICE_ID`

### 11. Gerenciar Email (Admin)
```bash
curl -X GET "http://localhost:3000/api/admin/email/config"
curl -X POST "http://localhost:3000/api/admin/email/config" -d '{ ... }'
curl -X POST "http://localhost:3000/api/admin/email/test" -d '{ "to": "destino@email.com" }'
curl -X POST "http://localhost:3000/api/admin/email/toggle"
curl -X GET "http://localhost:3000/api/admin/email/status"
```

---

## � Exemplos de Resposta

### Renovação de Usuário (Success)

```json
{
  "success": true,
  "status": "completed",
  "message": "Renovação concluída com sucesso",
  "data": {
    "payment_id": 123456789,
    "invoice_id": "uuid-da-fatura",
    "type": "renovation",
    "status": "completed",
    "amount": 4.99,
    "approved_at": "2025-08-09T02:12:12.287Z",
    "credentials": {
      "ssh": {
        "username": "user123",
        "password": "pass123",
        "limit": 2,
        "expiration_date": "2025-09-15T10:30:00.000Z",
        "is_active": true
      },
      "v2ray": {
        "uuid": "uuid-v2ray",
        "limit": 2,
        "expiration_date": "2025-09-15T10:30:00.000Z",
        "is_active": true
      }
    }
  }
}
```

### Verificação de Usuário para Renovação

```json
{
  "success": true,
  "data": {
    "username": "user123",
    "current_expiration": "2025-08-15T10:30:00.000Z",
    "is_expired": false,
    "days_until_expiration": 7,
    "current_limit": 2,
    "can_renew": true
  }
}
```

---

## �📊 Status Possíveis

| Status      | Descrição                |
|-------------|-------------------------|
| `pending`   | Aguardando pagamento    |
| `completed` | Pagamento aprovado      |
| `expired`   | Pagamento expirado      |
| `cancelled` | Pagamento cancelado     |

---

## ⚡ Informações Importantes

- **Timeout:** Pagamentos expiram em 15 minutos
- **Processamento:** Automático via webhook do Mercado Pago
- **Identificação:** Email usado como ID do cliente
- **Criação:** Usuários SSH criados automaticamente após pagamento
- **CheckUser:** Endpoint público para consulta de status de usuário SSH/V2Ray
- **Renovação Simplificada:** Para renovar, basta fornecer `username` e `plan_id` - os dados do cliente são recuperados automaticamente
- **Compatibilidade V2Ray:** Sistema verifica automaticamente se o usuário possui V2Ray e valida compatibilidade do plano
- **Email Automático:** Credenciais são enviadas por email após aprovação do pagamento (se configurado)

---
