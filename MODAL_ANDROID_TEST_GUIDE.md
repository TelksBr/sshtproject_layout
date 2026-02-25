# 🧪 Guia de Teste e Debug: Modal Android Fix

**Data:** 25 de Fevereiro de 2026  
**Commit:** `731fb4a` - fix: resolver modal Terms não renderiza em alguns Android

---

## 1️⃣ Teste Manual em Dispositivos Reais

### **Teste #1: Abrir App - Modal de Termos Deve Aparecer**

**Dispositivos para testar:**
- ✅ Android 8 (Samsung A6 ou similar)
- ✅ Android 9 (Moto G7 ou similar)
- ✅ Android 10 (OnePlus 7 ou similar)
- ✅ Android 11+ (Samsung A12+ ou Google Pixel)

**Passos:**
1. Abrir app a primeira vez (sem terms aceitos)
2. Aguardar 1-2 segundos
3. **Esperado:** Modal com backdrop e conteúdo visível
4. **NÃO esperado:** Apenas blur/fundo preto

**Validação:**
- [ ] Modal aparece em Android 8
- [ ] Modal aparece em Android 9  
- [ ] Modal aparece em Android 10
- [ ] Modal aparece em Android 11+

---

### **Teste #2: Aceitar Termos → Privacidade**

**Passos:**
1. Clicar no botão "Aceitar Termos"
2. **Esperado:** Modal de privacidade abre
3. Clicar "Aceitar Privacidade"
4. **Esperado:** App carrega normalmente

**Validação:**
- [ ] Transição modal funciona
- [ ] Dados persistem (aceitar é permanente)
- [ ] App responsivo após aceitar

---

### **Teste #3: Landscape Mode**

**Passos:**
1. Abrir app com termos
2. Rotacionar para landscape
3. **Esperado:** Modal redimensiona corretamente
4. Conteúdo ainda visível e desrolável

**Validação:**
- [ ] Modal responsivo em landscape
- [ ] Altura máxima respeita safe area em landscape
- [ ] Teclado não corta modal (se houver input)

---

### **Teste #4: Outras Modais (Buy, Recovery, etc)**

**Passos:**
1. Aceitar termos/privacidade
2. Clicar em "Comprar" → PurchaseModal
3. Clicar em "Recuperar" → RecoveryModal
4. Clicar em "Velocidade" → SpeedTest
5. **Esperado:** Todas as modais aparecem com backdrop

**Validação:**
- [ ] PurchaseModal renderiza
- [ ] RecoveryModal renderiza
- [ ] SpeedTest renderiza
- [ ] Fechar modal volta ao estado anterior

---

## 2️⃣ Debug com Chrome DevTools (WebView)

### **Ativar Remote Debugging**

```bash
# Conectar dispositivo via USB
adb devices

# Ativar debugging (pode já estar ativo)
adb shell setprop debug.force_rtl 0

# Abrir Chrome DevTools para Android WebView
# 1. Abrir Chrome desktop
# 2. Acessar chrome://inspect
# 3. Selecionar WebView
# 4. Inspecionar elemento
```

### **Inspecionar Modal com DevTools**

**Developer Tools → Elements:**

```html
<!-- Esperado ver: -->
<div id="modal-root-container" style="position: fixed; top: 0; left: 0; z-index: 9999;">
  <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm opacity-100">
    <!-- Modal content -->
  </div>
</div>
```

**Verificar:**
- [ ] `modal-root-container` existe no DOM
- [ ] Está fora da árvore principal (em `<body>` diretamente)
- [ ] `z-index: 9999` está aplicado
- [ ] `position: fixed` está aplicado
- [ ] `opacity: 1` quando visível (não 0)

---

### **Verificar CSS com DevTools**

**DevTools → Styles:**

```css
/* Backdrop - Verificar se aplicado */
.fixed.inset-0.z-50.bg-black\/60.backdrop-blur-sm {
  opacity: 1;      /* Esperado: 1, não 0 */
  pointer-events: auto;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(6px);
}

/* Modal Container */
.relative.w-full.max-w-5xl {
  max-height: 450px; /* Calculado dinamicamente */
  opacity: 1;        /* Esperado: 1, não 0 */
}
```

**Verificar:**
- [ ] Backdrop tem `opacity: 1`
- [ ] Modal tem `max-height` definido (não undefined)
- [ ] Não há `display: none` aplicado
- [ ] Z-index é `z-50` (440 em Tailwind)

---

### **Console Debugging**

```javascript
// Executar no console do Chrome DevTools

// 1. Verificar se o modal root existe
console.log(document.getElementById('modal-root-container'));
// Esperado: <div id="modal-root-container">...</div>

// 2. Verificar quantos elementos há no portal
const modalRoot = document.getElementById('modal-root-container');
console.log('Modal children:', modalRoot?.children.length);
// Esperado: > 0 quando modal está aberto

// 3. Verificar viewport height detectado
console.log('window.innerHeight:', window.innerHeight);
console.log('visualViewport.height:', window.visualViewport?.height);
// Esperado: valores > 0 e semelhantes

// 4. Forçar recalcular viewport (útil para teste)
window.dispatchEvent(new Event('resize'));

// 5. Inspecionar estilos computados do modal
const modal = document.querySelector('[class*="max-w"]');
const styles = window.getComputedStyle(modal);
console.log({
  opacity: styles.opacity,
  maxHeight: styles.maxHeight,
  position: styles.position,
  zIndex: styles.zIndex
});
```

---

## 3️⃣ Teste em Simulador Android (Emulador)

### **Com GPU Desativada (Simular WebView Antigo)**

```bash
# Criar emulador com GPU desativada
avdmanager create avd \
  -n android-8-no-gpu \
  -k "system-images;android-26;google_apis;x86" \
  -d "Nexus 5" \
  -c 2048M

# Iniciar com GPU desativada
emulator -avd android-8-no-gpu -gpu off

# Verificar se GPU está desativada
adb logcat | grep -i "gpu\|opengl\|render"
```

### **Teste de Performance**

```bash
# Medir FPS durante abertura do modal
adb shell "dumpsys gfxinfo com.sshtproject" | grep "fps"

# Esperado: > 30 FPS durante animação
```

---

## 4️⃣ Teste de Regressão - Verificar Outras Funcionalidades

**Importante:** Garantir que fixes não quebram nada

- [ ] App inicia normalmente
- [ ] Sidebar abre/fecha
- [ ] Modais abrem/fecham suavemente
- [ ] Conteúdo é desrolável em modais
- [ ] Botões são clicáveis
- [ ] Animações são suaves (sem travamentos)
- [ ] Orientação landscape funciona
- [ ] SafeArea é respeitado (notches)
- [ ] Teclado não corta modal se houver input

---

## 5️⃣ Teste de Compatibilidade CSS

### **Verificar Suporte a Features**

```javascript
// No console do Chrome DevTools

// 1. Suporte a backdrop-filter
const el = document.createElement('div');
el.style.backdropFilter = 'blur(1px)';
const isSupported = el.style.backdropFilter !== '';
console.log('backdrop-filter suportado:', isSupported);

// 2. Suporte a env() (safe-area-inset)
const style = getComputedStyle(document.body);
const hasSafeArea = style.paddingTop.includes('env') || 
                    parseFloat(style.paddingTop) > 0;
console.log('safe-area-inset suportado:', hasSafeArea);

// 3. Suporte a visualViewport
console.log('visualViewport disponível:', !!window.visualViewport);

// 4. Suporte a createPortal (via React)
import { createPortal } from 'react-dom';
console.log('createPortal disponível:', typeof createPortal === 'function');
```

---

## 6️⃣ Teste de Stress

### **Abrir/Fechar Modal Múltiplas Vezes**

```javascript
// Simular múltiplas aberturas (executar no console)
for (let i = 0; i < 10; i++) {
  // Aguardar,  abrir modal
  setTimeout(() => {
    // Encontrar e clicar em botão que abre modal
    document.querySelector('[class*="modal"]')?.click?.();
  }, i * 500);
}
```

**Verificar:**
- [ ] Nenhum vazamento de memória (abrir/fechar 10x)
- [ ] Sem duplicação de portal containers
- [ ] Performance se mantém constante

---

## 7️⃣ Problemas Conhecidos & Soluções

### **Problema: Modal não aparece em Android 8 com GPU off**
**Solução:** ✅ Implementado - Remover `scale()` animations, usar apenas opacity

### **Problema: Modal cortado em landscape**
**Solução:** ✅ Implementado - `useSafeModalHeight()` com `useIsLandscape()`

### **Problema: BackdropFilter não funciona**
**Solução:** ✅ Implementado - Fallback para `background-color` opaco

### **Problema: Fixed positioning não funciona com soft keyboard**
**Solução:** ✅ Implementado - `env(safe-area-inset-*)` + `visualViewport`

---

## 8️⃣ Commands de Debug Úteis

```bash
# Log de renderização WebView
adb logcat | grep -i "webview\|render\|gpu\|compositing" | head -50

# Ver tamanho de viewport
adb shell "am shell dumpsys display" | grep "mRealSize"

# Ativar traçamento de performance
adb shell "atrace --trace_duration=5 app gfx view sched freq idle"

# Forçar sincronização de vsync
adb shell "setprop debug.hwui.target_cpu_time_percent 50"

# Listar erros de WebView
adb logcat | grep -E "Exception|Error|Crash" | grep -i webkit
```

---

## 9️⃣ Checklist Final de Qualidade

- [ ] Modal abre em Android 8
- [ ] Modal abre em Android 9
- [ ] Modal abre em Android 10
- [ ] Modal abre em Android 11+
- [ ] Funciona em landscape
- [ ] Funciona com notched devices
- [ ] Sem memory leaks
- [ ] Sem CPU overhead
- [ ] Sem jank/stutter
- [ ] Sem regressões em outras modais
- [ ] TypeScript compila sem erros
- [ ] CSS sem warnings

---

## 🔟 Próximas Steps (Opcional)

1. **Performance Optimization:**
   - Lazy load modal components
   - Memoize portal elements
   - Use React.memo para reduzir re-renders

2. **Acessibilidade:**
   - Adicionar focus trap (usar library como `focus-trap-react`)
   - Melhorar ARIA labels
   - Testar com screen readers

3. **Testes Automatizados:**
   - E2E tests com Cypress/Playwright
   - Visual regression tests
   - Performance benchmarks

---

**Última atualização:** 25 de Fevereiro de 2026
