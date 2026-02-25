# 📋 Análise Completa: Modal de Termos não Renderiza em Alguns Android

**Data:** 25 de Fevereiro de 2026  
**Status:** 🔴 Crítico - Afeta UX em múltiplos dispositivos  
**Sintoma:** Modal de termos mostra apenas backdrop/blur, conteúdo não aparece

---

## 1️⃣ Problemas Identificados

### **Problema #1: Z-Index não separado (Modal vs Backdrop)**
- **Localização:** `Modal.tsx` linha 26-30
- **Código problemático:**
  ```tsx
  <div className="fixed inset-0 z-[100] ... bg-black/60 backdrop-blur-sm ...">
    <div className="relative w-full z-[101] ...">
  ```
- **Causa:** Ambos têm z-index muito próximos. Em WebView antigos do Android, isso cria stacking context incorreto
- **Efeito:** Modal (z-101) pode ficar atrás do backdrop (z-100) em certos navegadores
- **Severity:** 🔴 ALTA

---

### **Problema #2: Fixed Positioning sem Safe Area Configuration**
- **Localização:** `index.html` meta tags + `Modal.tsx` linha 26
- **Código problemático:**
  ```html
  <!-- Falta safe-area-inset -->
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  ```
  ```tsx
  <div className="fixed inset-0 z-[100] ...">
  ```
- **Causa:** WebView Android 8-11 tem bug com `fixed` + viewport sem `viewport-fit=cover`
- **Efeito:** Modal pode renderizar fora da viewport ou ser cortado pela SafeArea
- **Severity:** 🔴 ALTA

---

### **Problema #3: Transform Scale em WebView com GPU Desligada**
- **Localização:** `Modal.tsx` linha 32-33
- **Código problemático:**
  ```tsx
  ${isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
  ${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
  ```
- **Causa:** WebView Android 8-9 com GPU desligada não renderiza `transform: scale()` corretamente
- **Efeito:** Modal fica invisible mesmo com `opacity-100` porque `scale-95` congela a renderização
- **Severity:** 🟡 MÉDIA

---

### **Problema #4: Overflow Hidden no Container Principal**
- **Localização:** `App.tsx` linha 123 + `index.css`
- **Código problemático:**
  ```tsx
  <main className="... overflow-hidden">
    <section className="... overflow-y-auto overflow-x-hidden ...">
  ```
- **Causa:** Se `position: fixed` com `overflow: hidden` no ancestral, modal pode ser clipped
- **Efeito:** Modal renderiza mas é invisível por estar fora do clip
- **Severity:** 🟡 MÉDIA

---

### **Problema #5: Max-Height 85vh em Android**
- **Localização:** `Modal.tsx` linha 43
- **Código problemático:**
  ```tsx
  max-h-[85vh] sm:max-h-[88vh] md:max-h-[90vh] landscape:max-h-[85vh]
  ```
- **Causa:** `vh` é bugado em Android WebView (não considera bottomSheet ou soft keyboard)
- **Efeito:** Modal pode ter altura 0 ou negativa, tornando-se invisível
- **Severity:** 🟡 MÉDIA

---

### **Problema #6: Backdrop Filter Sem Fallback**
- **Localização:** `Modal.tsx` linha 26 + múltiplos locais
- **Código problemático:**
  ```css
  backdrop-filter: blur(12px); /* CSS suportado? */
  -webkit-backdrop-filter: blur(12px); /* WebKit only */
  ```
- **Causa:** Alguns WebView Android antigos não suportam `backdrop-filter`
- **Efeito:** Se backdrop-filter falha, a renderização da camada pode falhar
- **Severity:** 🟢 BAIXA (estético, não funcional)

---

## 2️⃣ Raiz Provável

**Combinação de 3 problemas:**
1. ✅ WebView Android antigo (8-10) com GPU desligada
2. ✅ `transform: scale()` + `fixed` positioning = GPU glitch
3. ✅ Z-index/stacking context incorreto em navegador antigo

**Resultado:** Modal renderiza mas fica completamente invisível

---

## 3️⃣ Soluções Propostas

### **SOLUÇÃO 1: Refatorar Modal.tsx - Z-Index e Positioning**

**Objetivo:** Separar backdrop de modal para garantir stacking correto

**Mudanças:**
```tsx
// ANTES: Z-index together
<div className="fixed inset-0 z-[100] ... bg-black/60 ...">
  <div className="relative w-full z-[101] ...">

// DEPOIS: Z-index separado + será usado em container dedicado
<div className="fixed inset-0 z-50 ... bg-black/60 ...">
  <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none ...">
    <div className="relative w-full z-auto pointer-events-auto ...">
```

**Impacto:** Garante que backdrop e modal sempre ficam visíveis

---

### **SOLUÇÃO 2: Adicionar Viewport Meta Tags Corretos**

**Objetivo:** Configurar SafeArea e viewport-fit para Android

**Mudança em `index.html`:**
```html
<!-- ANTES -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

<!-- DEPOIS -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#2A0A3E" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<!-- Safe Area Inset Support -->
<style>
  body { 
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
</style>
```

**Impacto:** Modal respeitará SafeArea em notched devices

---

### **SOLUÇÃO 3: Remover Transform Scale - Usar Apenas Opacity**

**Objetivo:** Evitar GPU glitch em WebView antigos

**Mudança em `Modal.tsx`:**
```tsx
// ANTES
${isOpening ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
${isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}

// DEPOIS
${isOpening ? 'opacity-0' : 'opacity-100'}
${isClosing ? 'opacity-0' : 'opacity-100'}
```

**Impacto:** Animation mais simples, compatível com todos WebView

---

### **SOLUÇÃO 4: Usar Portal Pattern Para Modal**

**Objetivo:** Renderizar modal fora da árvore DOM principal

**Novo arquivo `src/utils/createPortal.ts`:**
```typescript
export function createModalRoot(): HTMLElement {
  let modalRoot = document.getElementById('modal-root');
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    modalRoot.style.position = 'fixed';
    modalRoot.style.top = '0';
    modalRoot.style.left = '0';
    modalRoot.style.width = '100%';
    modalRoot.style.height = '100%';
    modalRoot.style.pointerEvents = 'none';
    modalRoot.style.zIndex = '9999';
    document.body.appendChild(modalRoot);
  }
  return modalRoot;
}
```

**Mudança em `Modal.tsx`:**
```tsx
import { createPortal } from 'react-dom';
import { createModalRoot } from '../utils/createPortal';

export function Modal(...) {
  return createPortal(
    <div className="fixed inset-0 z-[100] ...">
      ...
    </div>,
    createModalRoot()
  );
}
```

**Impacto:** Modal totalmente isolado da árvore principal

---

### **SOLUÇÃO 5: Fix Viewport Height Bug em Android**

**Novo hook `useViewportHeight.ts`:**
```typescript
export function useViewportHeight() {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      // Usar visualViewport quando disponível (Android)
      const vh = window.visualViewport?.height || window.innerHeight;
      setHeight(vh);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.visualViewport?.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.visualViewport?.removeEventListener('resize', updateHeight);
    };
  }, []);

  return height;
}
```

**Uso em `Modal.tsx`:**
```tsx
const viewportHeight = useViewportHeight();
const maxHeight = Math.max(viewportHeight * 0.85, 300);

return (
  <div style={{ maxHeight: `${maxHeight}px` }} ...>
```

**Impacto:** Modal responsivo a mudanças real de viewport

---

### **SOLUÇÃO 6: Adicionar Fallback para Backdrop Filter**

**Mudança em `Modal.tsx`:**
```tsx
<style>{`
  .modal-backdrop {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    /* Fallback para navegadores sem suporte */
    background-color: rgba(0, 0, 0, 0.6);
  }

  @supports not (backdrop-filter: blur(12px)) {
    .modal-backdrop {
      background-color: rgba(0, 0, 0, 0.8) !important;
    }
  }
`}</style>
```

**Impacto:** Modal funciona mesmo em WebView sem backdrop-filter

---

## 4️⃣ Prioridade de Implementação

| # | Solução | Prioridade | Impacto | Tempo |
|---|---------|-----------|--------|-------|
| 1 | Remover scale animations | 🔴 CRÍTICA | 80% | 5 min |
| 2 | Refatorar Z-index | 🔴 CRÍTICA | 70% | 10 min |
| 3 | Portal Pattern | 🟠 ALTA | 60% | 15 min |
| 4 | Viewport meta tags | 🟠 ALTA | 50% | 5 min |
| 5 | useViewportHeight hook | 🟡 MÉDIA | 40% | 20 min |
| 6 | Backdrop filter fallback | 🟢 BAIXA | 20% | 5 min |

---

## 5️⃣ Checklist de Implementação

- [ ] **Passo 1:** Remover `scale-95/100` classes de Modal.tsx
- [ ] **Passo 2:** Refatorar Z-index para usar `z-50` em ambos
- [ ] **Passo 3:** Adicionar viewport meta tag com `viewport-fit=cover`
- [ ] **Passo 4:** Criar hook `useViewportHeight()` para Android
- [ ] **Passo 5:** Implementar Portal Pattern
- [ ] **Passo 6:** Adicionar fallback para backdrop-filter
- [ ] **Passo 7:** Testar em Android 8, 9, 10, 11
- [ ] **Passo 8:** Testar em diferentes resoluções (320px - 1080px)
- [ ] **Passo 9:** Testar com diferentes DPI
- [ ] **Passo 10:** Commit com detalhes da fix

---

## 6️⃣ Debug Commands para Android

```bash
# Ativar DevTools no WebView (se disponível)
adb shell "setprop debug.force_rtl 1"

# Ver logs de renderização
adb logcat | grep -i "webview\|render"

# Forçar GPU rendering
adb shell "setprop debug.hwui.renderer opengl"

# Desabilitar hardware acceleration (simular problema)
adb shell "setprop debug.hwui.profile true"
```

---

## 7️⃣ Arquivos Afetados

1. **`src/components/modals/Modal.tsx`** - Principal
2. **`index.html`** - Meta tags
3. **`src/utils/createPortal.ts`** - Novo
4. **`src/hooks/useViewportHeight.ts`** - Novo
5. **`tailwind.config.js`** - Possível ajuste

---

## 8️⃣ Estimativa

- **Desenvolvimento:** 45-60 minutos
- **Testes:** 30-45 minutos
- **Total:** ~2 horas

---

**Próximo passo:** Começar implementando a Solução #1 (remover scale animations)
