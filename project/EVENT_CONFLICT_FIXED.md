# EVENTO DtNewDefaultConfigEvent: CONFLITO RESOLVIDO

## 🐛 PROBLEMA IDENTIFICADO

O `ConnectionForm` não estava reagindo ao evento `DtNewDefaultConfigEvent` devido a **conflito de event listeners** entre App.tsx e ConnectionForm.

### 🔍 CAUSA RAIZ

**❌ Conflito de handlers:**
- **App.tsx** registrava: `onDtunnelEvent('DtNewDefaultConfigEvent', () => setNotification(...))`
- **ConnectionForm** registrava: `onDtunnelEvent('DtNewDefaultConfigEvent', handleConfigChanged)`

**Problema:** `onDtunnelEvent` não gerencia múltiplos listeners - ele **substitui** a função global no `window`. O último registrado sobrescreve o anterior.

## ✅ SOLUÇÃO IMPLEMENTADA

### **Removido do App.tsx:**
```tsx
// ❌ ANTES: App.tsx também capturava o evento
'DtNewDefaultConfigEvent',

// ✅ DEPOIS: Removido - deixar apenas no ConnectionForm
// Removido DtNewDefaultConfigEvent - será tratado pelo ConnectionForm
```

### **Mantido apenas no ConnectionForm:**
```tsx
onDtunnelEvent('DtNewDefaultConfigEvent', handleConfigChanged);
```

## 🔄 **FLUXO CORRIGIDO**

1. **Usuário seleciona servidor** → `ServerSelector`
2. **DTunnel dispara** → `DtNewDefaultConfigEvent`  
3. **ConnectionForm captura** → Único listener
4. **getActiveConfig()** → Busca nova configuração
5. **Inputs atualizam** → Instantaneamente

## 🎯 **COMPORTAMENTO ESPERADO**

- **SSH sem credenciais** → Inputs aparecem vazios
- **SSH com credenciais** → Inputs não aparecem
- **V2RAY sem UUID** → Input UUID aparece vazio
- **V2RAY com UUID** → Input não aparece

## 📝 **DEBUG ADICIONADO**

```tsx
console.log('DtNewDefaultConfigEvent capturado no ConnectionForm:', config.name);
```

## 🎉 **RESULTADO**

- ✅ **Evento funciona** corretamente
- ✅ **Inputs atualizam** instantaneamente  
- ✅ **Sem conflitos** de listeners
- ✅ **Build funcionando** perfeitamente

**ConnectionForm agora reage corretamente ao DtNewDefaultConfigEvent!** 🚀
