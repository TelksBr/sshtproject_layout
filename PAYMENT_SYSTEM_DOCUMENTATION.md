# 💳 Sistema Robusto de Pagamento e Verificação

## 📋 Visão Geral

Sistema completo e persistente de pagamento que continua funcionando mesmo após reinicialização da WebView. O sistema salva compras pendentes e verifica automaticamente o status quando o app é reiniciado.

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      App.tsx (Main)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ useBackgroundMonitor() - Inicia monitoramento           │ │
│  │ usePurchaseNotifications() - Gerencia notificações      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► backgroundPurchaseMonitor (Singleton)
          │   ├─ checkPendingPurchases() - Verifica a cada 15s
          │   ├─ getCredentialsWithRetry() - Retry com exponential backoff
          │   └─ Callbacks onPurchaseCompleted, onError, etc
          │
          ├─► purchaseStorage (Singleton)
          │   ├─ getPendingPurchases() - Carrega do localStorage
          │   ├─ saveCredentials() - Salva credenciais obtidas
          │   └─ updatePurchaseStatus() - Atualiza status
          │
          ├─► paymentNotificationManager (Singleton)
          │   └─ notifyPaymentApproved() - Dispara notificação UI
          │
          ├─► paymentLogger (Singleton)
          │   └─ Logs para debug (localStorage)
          │
          └─► PaymentApprovedNotification Component
              └─ Popup animado com progresso
```

## 📁 Arquivos Criados/Modificados

### ✨ Novos Arquivos

1. **`src/utils/paymentNotificationManager.ts`**
   - Gerencia notificações de pagamento aprovado
   - Callbacks para renderizar UI
   - Tentativa de notificações nativas do Android

2. **`src/utils/paymentLogger.ts`**
   - Sistema de logging para debug
   - Suporta múltiplos níveis: DEBUG, INFO, WARN, ERROR
   - Exporta logs em JSON e CSV
   - Filtra por orderId, paymentId, nível, etc

3. **`src/components/modals/PaymentApprovedNotification.tsx`**
   - Componente de notificação com animação
   - Progress bar para auto-close
   - Design responsivo mobile/desktop

4. **`src/hooks/usePurchaseNotifications.ts`**
   - Hook para gerenciar notificações
   - Integra com paymentNotificationManager
   - Deve ser usado no App.tsx

### 🔄 Arquivos Modificados

1. **`src/utils/backgroundPurchaseMonitor.ts`**
   - ✅ Adicionado retry com exponential backoff
   - ✅ Adicionado logging completo
   - ✅ Melhorado tratamento de erros
   - ✅ Stats com informações de retry

2. **`src/hooks/useBackgroundMonitor.ts`**
   - ✅ Integração com paymentNotificationManager
   - ✅ Mostra notificação ao pagamento ser aprovado
   - ✅ Mantém notificações nativas do browser

3. **`src/App.tsx`**
   - ✅ Adicionado hook usePurchaseNotifications
   - ✅ Renderiza PaymentApprovedNotification
   - ✅ Componentes de notificação

## 🔄 Fluxo de Funcionamento

### Cenário: Usuário Compra Plano e Sai do App

```
1. COMPRA INICIADA
   └─ PurchaseModal.tsx
      ├─ Usuário seleciona plano
      ├─ Preenche email
      ├─ Compra criada na API
      └─ purchaseStorage.savePendingPurchase(purchase)
         └─ Salva em localStorage

2. PAGAMENTO INICIA
   └─ usePaymentPolling.ts
      ├─ Polling a cada 10s por até 15min
      └─ Se expirado ou user sai do app → polling para

3. USUÁRIO SAI DO APP (reabre webview)
   └─ App.tsx é remontado
      ├─ useBackgroundMonitor() inicia
      ├─ purchaseStorage.getPendingPurchases() carrega do localStorage
      └─ backgroundPurchaseMonitor.start()

4. MONITOR DETECTA COMPRA PENDENTE
   └─ backgroundPurchaseMonitor
      ├─ checkPendingPurchases() a cada 15s
      ├─ Para cada compra pendente:
      │  ├─ getCredentialsWithRetry(paymentId)
      │  │  └─ Retry com exponential backoff (2s, 4s, 8s, 16s, 32s)
      │  └─ Se credentials.status === 'completed':
      │     ├─ purchaseStorage.saveCredentials(credentials)
      │     ├─ paymentNotificationManager.notifyPaymentApproved()
      │     ├─ Browser Notification API (se permitido)
      │     └─ Callbacks onPurchaseCompleted

5. NOTIFICAÇÃO APARECE
   └─ PaymentApprovedNotification Component
      ├─ Popup animado
      ├─ Progress bar (5s auto-close)
      ├─ Mostra valor e nome do plano
      └─ Usuário pode fechar manualmente

6. CREDENCIAL ACESSÍVEL
   └─ CredentialsManager Modal
      ├─ useCredentialsManager() carrega
      └─ purchaseStorage.getSavedCredentials()
         └─ Credencial salva na etapa 4
```

## 🔐 Persistência e Recuperação

### O que é Salvo

**localStorage (@sshproject: prefix)**
- `@sshproject:pending_purchases` - Compras aguardando confirmação
- `@sshproject:saved_credentials` - Credenciais salvas (SSH + V2Ray)
- `@sshproject:last_check` - Timestamp da última verificação

### Como Funciona a Recuperação

1. **App Inicia** → `useBackgroundMonitor()` é chamado
2. **Carrega Pendentes** → `purchaseStorage.getPendingPurchases()`
   - Filtra expiradas (>24h)
   - Filtra completadas
   - Retorna apenas pendentes válidas
3. **Inicia Monitor** → `purchaseMonitor.start()`
   - Se há compras pendentes
   - Verifica a cada 15s
4. **Salva Credenciais** → Quando pagamento é detectado
   - `purchaseStorage.saveCredentials(credentials)`
   - Verifica duplicação por payment_id
   - Gera label automático

## 🔁 Retry com Exponential Backoff

**Estratégia:** Aumenta delay entre tentativas para evitar sobrecarregar servidor

```
Tentativa 1: 2s + jitter(0-1s) = ~2-3s
Tentativa 2: 4s + jitter(0-1s) = ~4-5s
Tentativa 3: 8s + jitter(0-1s) = ~8-9s
Tentativa 4: 16s + jitter(0-1s) = ~16-17s
Tentativa 5: 32s + jitter(0-1s) = ~32-33s
```

**Máximo de 5 tentativas** = ~62s total

Se falhar, remove da lista de pendentes após 3 erros consecutivos.

## 📊 Logging e Debug

### Como Acessar Logs

```javascript
// No console do browser
import { paymentLogger } from './utils/paymentLogger';

// Ver todos os logs
paymentLogger.getLogs();

// Ver logs de um pedido específico
paymentLogger.getLogsByOrderId('order_123');

// Ver apenas erros
paymentLogger.getLogsByLevel('ERROR');

// Exportar para análise
const json = paymentLogger.exportLogs();
const csv = paymentLogger.exportLogsAsCSV();

// Ver estatísticas
paymentLogger.getStats();
```

### Níveis de Log

- **DEBUG** - Informações detalhadas (desabilitado em produção)
- **INFO** - Eventos normais (início/fim de operações)
- **WARN** - Situações anormais (erros de retry)
- **ERROR** - Falhas críticas

## 🎯 Casos de Uso Cobertos

### ✅ Cenário 1: Pagamento Rápido
- Usuário abre app
- Compra plano
- Paga imediatamente
- `usePaymentPolling` detecta dentro de 15 minutos
- Credencial salva no modal

### ✅ Cenário 2: Pagamento com Saída do App
- Usuário abre app
- Compra plano
- Sai para fazer pagamento (abre banco, etc)
- Webview reinicia
- `useBackgroundMonitor` retoma e detecta
- Notificação pop-up aparece
- Credencial salva automaticamente

### ✅ Cenário 3: Pagamento com Atraso
- Usuário compra mas adia o pagamento
- Fecha app
- Reabre 2 horas depois e paga
- Monitor detecta na próxima verificação (15s)
- Notificação aparece
- Credencial acessível em "Minhas Credenciais"

### ✅ Cenário 4: Múltiplas Compras Pendentes
- 2+ compras pendentes ao mesmo tempo
- Monitor verifica todas em paralelo
- Cada uma tem seu retry independente
- Notificações aparecem para cada uma

### ✅ Cenário 5: Erros de Rede
- Falhas ao verificar status
- Retry com exponential backoff
- Se 3 erros consecutivos → remove
- Logging permite debug

## 🚀 Performance

- **Monitor Interval:** 15 segundos (otimizado para webview)
- **Polling no Modal:** 10 segundos (mais agressivo)
- **Max Attempts Polling:** 90 (15 minutos)
- **Max Retries Background:** 5 (com backoff = ~62s)
- **Storage Limit:** 100 logs mais recentes
- **Limpeza Automática:** Notificações >1h

## 🔧 Configuração

### Habilitar/Desabilitar Monitor

```tsx
// Em App.tsx
useBackgroundMonitor({
  enabled: true,  // Default: true se houver pendentes
  onPurchaseCompleted: (purchase, credentials) => {
    // Callback customizado
    console.log('Pagamento aprovado!', purchase);
  }
});
```

### Habilitar/Desabilitar Logging

```javascript
import { paymentLogger } from './utils/paymentLogger';

// Desabilitar logging
paymentLogger.setEnabled(false);

// Desabilitar console.log
paymentLogger.setConsoleLogging(false);
```

### Habilitar/Desabilitar Notificações

```javascript
import { paymentNotificationManager } from './utils/paymentNotificationManager';

// Customizar callbacks
paymentNotificationManager.setCallbacks({
  onNotification: (notification) => {
    // Customizar como notificação é exibida
  },
  onDismiss: (orderId) => {
    // Callback ao fechar notificação
  }
});
```

## 📱 Responsividade

- **Mobile (< 640px):** Notificação no topo, tamanho reduzido
- **Tablet (640px - 1024px):** Tamanho médio
- **Desktop (> 1024px):** Tamanho completo com animações

## 🐛 Troubleshooting

### Problema: Notificação não aparece
1. Verificar se `usePurchaseNotifications` está em App.tsx
2. Verificar `paymentLogger.getLogs()` para erros
3. Verificar localStorage `@sshproject:pending_purchases`

### Problema: Credencial não é salva
1. Verificar se API retorna `credentials.status === 'completed'`
2. Verificar se há `ssh_credentials` ou `v2ray_credentials`
3. Ver logs: `paymentLogger.getLogsByLevel('ERROR')`

### Problema: Monitor não inicia
1. Verificar se há compras pendentes: `purchaseStorage.getPendingPurchases()`
2. Verificar console para erros
3. Forçar verificação: `purchaseMonitor.forceCheck()`

### Problema: Retry não funciona
1. Verificar stats: `purchaseMonitor.getStats().retryStats`
2. Logs mostram tentativas: `paymentLogger.getLogsByLevel('WARN')`
3. Aumentar `maxRetries` se necessário

## 📈 Futuros Melhoramentos

- [ ] Persistir logs em IndexedDB (>100 entradas)
- [ ] Retry strategy customizável
- [ ] Notificações de renovação de credencial
- [ ] Dashboard de histórico de pagamentos
- [ ] Integração com webhook para pagamentos recebidos
- [ ] Suporte a múltiplos gateways de pagamento

## 📞 Support

Para debug e troubleshooting:

```javascript
// Exporte dados para análise
const debugData = {
  logs: paymentLogger.exportLogs(),
  stats: purchaseMonitor.getStats(),
  pending: purchaseStorage.getPendingPurchases(),
  saved: purchaseStorage.getSavedCredentials()
};

console.log(JSON.stringify(debugData, null, 2));
```
