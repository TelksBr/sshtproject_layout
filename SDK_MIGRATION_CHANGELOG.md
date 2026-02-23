# 🔄 SDK Migration Changelog

## Resumo
Removemos completamente o suporte a `window.Dt*` (legacy DTunnel methods) e mantemos **apenas SDK DTunnel + fallbacks seguros do browser**.

---

## ✅ O que foi removido

### 1. **dtunnelBridge.ts**
- ❌ Removido: Flag `useWindowDtFallback`
- ❌ Removido: Funções `disableWindowDtFallback()`, `enableWindowDtFallback()`, `isWindowDtFallbackEnabled()`
- ❌ Removido: Fallback para `window.Dt*` em `call()` e `callVoid()`
- ✅ Mantido: Chamadas diretas ao SDK via `getSdk()`

### 2. **nativeClipboard.ts**
- ❌ Removido: Suporte a `window.DtClipboard`
- ✅ Mantido: `navigator.clipboard` (moderno)
- ✅ Mantido: `document.execCommand` (fallback legado)

### 3. **nativeStorage.ts**
- ❌ Removido: Suporte a `window.DtStorage`
- ✅ Mantido: `localStorage` (browser API padrão)

### 4. **nativeNavigation.ts**
- ❌ Removido: Suporte a `window.DtStartWebViewActivity`, `window.DtReloadApp`, `window.DtCloseApp`
- ✅ Mantido: SDK `sdk.app.startWebViewActivity()`, `sdk.android.closeApp()`
- ✅ Mantido: `window.open()` e `window.location.reload()` como fallback

### 5. **nativeLayout.ts**
- ❌ Removido: Suporte a `window.DtGetStatusBarHeight`, `window.DtGetNavigationBarHeight`
- ✅ Mantido: SDK `sdk.android.getStatusBarHeight()`, `sdk.android.getNavigationBarHeight()`

### 6. **Arquivos deletados**
- ❌ `src/utils/debugSDKOnly.ts` (modo SDK-only debug removido)
- ❌ `SDK_ONLY_DEBUG_GUIDE.md` (guia de debug)
- ❌ `COMPATIBILITY_DTUNNEL_SDK.md` (documentação de compatibilidade)
- ❌ `.env.example` (variáveis de ambiente de debug)

### 7. **main.tsx**
- ❌ Removido: Import de `initializeSDKOnlyModeIfNeeded`
- ❌ Removido: Chamada a `initializeSDKOnlyModeIfNeeded()`

---

## 🏗️ Arquitetura atual

```
┌─────────────────────────────────────────┐
│         React Components                 │
│    (PurchaseModal, CredentialsTab, etc)  │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Native Utils       │
        ├─────────────────────┤
        │ nativeClipboard     │
        │ nativeStorage       │
        │ nativeNavigation    │
        │ nativeLayout        │
        │ sdkInstance         │
        └──────────────────────┘
                   │
        ┌──────────▼──────────┐
        │   SDK DTunnel       │
        │  (+ Browser APIs)   │
        │                      │
        │ ✅ sdk.app          │
        │ ✅ sdk.android      │
        │ ✅ navigator.*      │
        │ ✅ localStorage     │
        │ ❌ window.Dt* (REMOVIDO)
        └─────────────────────┘
```

---

## 📋 Mapeamento de Substituições

| Função Antiga | Substituição |
|---------------|--------------|
| `window.DtClipboard.copy()` | `navigator.clipboard.writeText()` |
| `window.DtClipboard.paste()` | `navigator.clipboard.readText()` |
| `window.DtStorage.*` | `localStorage` |
| `window.DtStartWebViewActivity()` | `sdk.app.startWebViewActivity()` |
| `window.DtReloadApp.execute()` | `window.location.reload()` |
| `window.DtCloseApp.execute()` | `sdk.android.closeApp()` |
| `window.DtGetStatusBarHeight()` | `sdk.android.getStatusBarHeight()` |
| `window.DtGetNavigationBarHeight()` | `sdk.android.getNavigationBarHeight()` |

---

## ⚠️ Importações a revisar

Se seus componentes usavam `window.Dt*` diretamente, atualize para:

### ❌ Antes
```typescript
import { disableWindowDtFallback } from './utils/dtunnelBridge';

// Em um componente
disableWindowDtFallback();
const data = call('DtStorage', 'load', ['key']);
```

### ✅ Depois
```typescript
import { saveData, loadData } from './utils/nativeStorage';

// Em um componente
const data = loadData('key');
```

---

## 🧪 Testando a Mudança

1. **Verificar se o app ainda inicia**
   ```bash
   npm run dev
   ```

2. **Verificar se as funcionalidades continuam**
   - Copiar credencial para clipboard ✅
   - Salvar/carregar dados persistentes ✅
   - Navegar em WebView ✅
   - Recarregar app ✅
   - Obter dimensões do layout ✅

3. **Verificar console para erros**
   - Não deve haver mensagens de `window.Dt* não encontrado`

---

## 📝 Notas de Desenvolvimento

- **O SDK é a única fonte de verdade** para chamadas nativas
- **Browser APIs** servem como fallback seguro quando SDK não está disponível
- **localStorage** é persistente mesmo após reboot do WebView
- **navigator.clipboard** requer contexto seguro (HTTPS ou localhost)

---

## 🔄 Se precisar reativar window.Dt* no futuro

Você pode fazer checkout da versão anterior do repositório ou restaurar as funções partir de:
- `dtunnelBridge.ts` (commit anterior)
- Documentação histórica em `readme_dtunnel_functions.md`

---

**Status**: ✅ Migração completa para SDK-only + Browser APIs
**Data**: Feb 23, 2026
