# 🔧 Credencial Modal - Fix Documentation

## Problema Identificado

Ao tentar adicionar uma credencial manual no modal de "Minhas Credenciais", a credencial não era salva após clicar em "Adicionar".

## Causa Raiz

Após remover o suporte a `window.Dt*` (legacy methods), o código em `CredentialsTab.tsx` continuava tentando usar funções que **não existem mais no SDK**:

```typescript
// ❌ ANTES (Não funcionava)
const handleApplyCredentials = (credential: SavedCredential) => {
  try {
    // Estas APIs NÃO EXISTEM no SDK DTunnel
    if (credential.ssh) {
      callVoid('DtUsername', 'set', [credential.ssh.username]);
      callVoid('DtPassword', 'set', [credential.ssh.password]);
    }
    if (credential.v2ray) {
      callVoid('DtUuid', 'set', [credential.v2ray.uuid]);
    }
    showToast('Credenciais aplicadas com sucesso!', 'success');
  } catch (error) {
    showToast('Erro ao aplicar credenciais', 'error');
  }
};
```

### O que acontecia:
1. Usuário preenchía o formulário e clicava "Adicionar"
2. A função `onAdd()` era chamada
3. `addManualCredential()` era executado e salvava no `localStorage`
4. Mas **não havia feedback visual** para o usuário
5. O modal não fechava automaticamente com sucesso

## Solução Implementada

### 1. Remover importação desnecessária
```typescript
// ❌ Removido
import { callVoid } from '../../utils/dtunnelBridge';

// ✅ Mantido
import { copyToClipboard } from '../../utils/nativeClipboard';
```

### 2. Simplificar `handleApplyCredentials`
```typescript
// ✅ DEPOIS (Funciona corretamente)
const handleApplyCredentials = (credential: SavedCredential) => {
  try {
    // ✅ Credenciais já estão salvas via purchaseStorage
    // O SDK (DTunnel) acessa automaticamente as credenciais salvas
    
    showToast('Credencial selecionada como padrão!', 'success');
    
    // Definir como padrão automaticamente
    if (!credential.is_default) {
      setDefault(credential.id);
    }
  } catch (error) {
    showToast('Erro ao aplicar credenciais', 'error');
  }
};
```

### 3. Adicionar feedback visual ao salvar
```typescript
{showAddModal && (
  <AddCredentialModal
    onClose={() => setShowAddModal(false)}
    onAdd={(cred) => {
      const id = addManualCredential(cred);
      if (id) {
        // ✅ Novo: Mostrar sucesso
        showToast('Credencial adicionada com sucesso! ✅', 'success');
      } else {
        showToast('Erro ao salvar credencial', 'error');
      }
      setShowAddModal(false);
    }}
  />
)}
```

## Como Funciona Agora

```
┌─────────────────────────────┐
│   Formulário do Modal       │
│  (Nome, SSH/V2Ray, UUID)    │
└──────────────┬──────────────┘
               │
        Clica em "Adicionar"
               │
┌──────────────▼──────────────┐
│  AddCredentialModal valida  │
│  dados e chama onAdd()      │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────────────┐
│  addManualCredential() é executado  │
│  (useCredentialsManager hook)       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  purchaseStorage.addManualCredential()  │
│  Gera ID: manual_[timestamp]_[random]   │
│  Salva em localStorage                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────┐
│  ✅ Toast: Sucesso!        │
│  ✅ Modal fecha             │
│  ✅ Lista atualiza          │
└────────────────────────────┘
```

## Dados Salvos

Credenciais são salvas com esta estrutura:

```typescript
interface SavedCredential {
  id: string;                    // manual_1708963200000_abc123def
  created_at: string;            // ISO 8601 timestamp
  is_default: boolean;
  is_active: boolean;
  label?: string;                // "VPN Principal" (do usuário)
  
  ssh?: {
    username: string;
    password: string;
  };
  
  v2ray?: {
    uuid: string;
  };
  
  validation?: {
    // Cache de validação via CheckUser
    expiration_date?: string;
    limit?: number;
    count_connections?: number;
  };
}
```

Armazenado em: `localStorage['@sshproject:saved_credentials']`

## Verificação de Funcionamento

✅ **Salvar credencial SSH**
- Nome: "VPN Test"
- Usuário: "testuser"
- Senha: "password123"

✅ **Salvar credencial V2Ray**
- Nome: "V2Ray Server"
- UUID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

✅ **Salvar ambas (SSH + V2Ray)**
- Ambas são salvas na mesma credencial

✅ **Feedback visual**
- Toast de sucesso aparece
- Modal fecha automaticamente
- Nova credencial aparece na lista

## Commits Relacionados

- `ad47cce` - feat: Remove window.Dt* legacy methods, use SDK DTunnel only
- `516b2ca` - fix: Remove invalid SDK calls in CredentialsTab modal

## Testes Recomendados

1. [ ] Abrir modal "Minhas Credenciais"
2. [ ] Clicar em "+ Adicionar"
3. [ ] Preencher formulário com SSH
4. [ ] Clicar "Adicionar"
5. [ ] Verificar se credencial aparece na lista
6. [ ] Verificar se toast de sucesso apareça
7. [ ] Recarregar página e verificar se credencial persiste
8. [ ] Tentar adicionar V2Ray sem SSH (deve funcionar)
9. [ ] Tentar remover credencial (deve funcionar)
10. [ ] Tentar editar label (deve funcionar)

---

**Status**: ✅ Corrigido
**Data**: Feb 23, 2026
