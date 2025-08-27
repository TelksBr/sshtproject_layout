
# DTunnel Layout — Guia de Estrutura e Padrões

Este documento apresenta a estrutura, padrões e principais convenções do projeto DTunnel, focando em escalabilidade, clareza e manutenção, com React, TypeScript e arquitetura modular.

---

## Estrutura de Pastas

```text
project/
  src/
    App.tsx                # Componente principal do app
    main.tsx               # Ponto de entrada da aplicação
    index.css              # Estilos globais (Tailwind)
    logo.svg               # Logo fallback
    components/            # Componentes React principais e reutilizáveis
      modals/              # Modais (Terms, Privacy, Support, etc.)
      Sidebar/             # Sidebar/menu lateral
      Header.tsx           # Cabeçalho (status VPN, IP, versão)
      ConnectionForm.tsx   # Formulário de autenticação
      NetworkStats.tsx     # Estatísticas de rede em tempo real
      ServerSelector.tsx   # Seletor de servidores/configs
      Tooltip.tsx          # Tooltip customizado
      AutoConnectModal.tsx # Modal de auto conexão
    context/               # Contextos globais (React Context API)
      ActiveConfigContext.tsx
    hooks/                 # Hooks customizados
      useNetworkStats.ts
      useAppLayout.ts
      useAutoConnect.ts
      ...
    types/                 # Tipos globais e interfaces (TypeScript)
      config.ts
      vpn.ts
      sales.ts
      Tutorial.ts
    utils/                 # Funções utilitárias e integração nativa
      appFunctions.ts
      autoConnectUtils.ts
      dtEvents.ts
      storageUtils.ts
      ...
    global.d.ts            # Tipos globais adicionais
    vite-env.d.ts          # Tipos do ambiente Vite
```

---

## Padrão de Tipos (`types/`)

- Todos os tipos globais ficam em `src/types/`.
- Tipos são exportados e reutilizados em todo o projeto.
- Exemplos:
  - `ConfigItem`, `ConfigCategory` em `types/config.ts`
  - `VpnState` em `types/vpn.ts`

---

## Funções Utilitárias (`utils/`)

- Funções de integração nativa (window.Dt*) e helpers.
- Todas as funções são exportadas individualmente e tipadas.
- Exemplos:
  - `getConnectionState`, `getAllConfigs`, `getUsername`, `getLocalIP` em `utils/appFunctions.ts`
  - Eventos globais: `onDtunnelEvent`, `emitDtunnelEvent` em `utils/dtEvents.ts`
  - Persistência: `getStorageItem`, `setStorageItem` em `utils/storageUtils.ts`

---

## Componentes (`components/`)

- Componentes React organizados por domínio e reutilização.
- **Principais**: `Header`, `ServerSelector`, `ConnectionForm`, `NetworkStats`, `Sidebar`, `AutoConnectModal`.
- **Modais**: Subpasta `modals/` (Terms, Privacy, Support, etc.).
- **Layout**: Todos os componentes são responsivos, com suporte a mobile, tablet e desktop.

---

## Convenções Gerais

- **TypeScript**: Tipagem forte em todo o projeto.
- **Extensibilidade**: Tipos e funções permitem campos dinâmicos quando necessário.
- **Documentação**: Tipos e funções principais possuem comentários explicativos.
- **Padrão de nomes**: PascalCase para componentes/tipos, camelCase para funções/variáveis.
- **Responsividade**: Tailwind CSS para visual moderno e responsivo.

---

## Documentação dos Componentes

### Header

Exibe status da VPN, IP local e versão do app.  
Recebe tudo via props, sem lógica interna de polling/eventos.

```tsx
<Header
  onMenuClick={() => setShowMenu(true)}
  version={version}
  localIP={localIP}
  vpnState={vpnState}
/>
```

---

### App

Componente principal, responsável por:
- Gerenciar IP local (`localIP`) via polling.
- Gerenciar status da VPN (`vpnState`) via eventos globais.
- Passar informações para Header e outros componentes.
- Controlar modais, layout e navegação.

---

### ConnectionForm

Exibe e gerencia campos de autenticação conforme a configuração ativa.
- Não faz polling nem busca direta de configuração.
- Reage ao evento global `DtConfigSelectedEvent`.
- Atualiza campos via funções centralizadas (`setUsername`, `setPassword`, `setUUID`).

---

### NetworkStats

Exibe estatísticas de rede em tempo real.
- Polling automático a cada 2 segundos.
- Usa hook `useNetworkStats`.
- Layout adaptativo para todos os tamanhos de tela.

---

### ServerSelector

Permite seleção de configurações/servidores.
- Lista configs por categoria.
- Integração com AutoConnect.
- Emite evento `DtConfigSelectedEvent` ao selecionar.

---

### Sidebar

Menu lateral com navegação e configurações.
- Overlay em mobile/tablet portrait, fixa em tablet landscape.
- Props: `isOpen`, `onClose`, `onNavigate`.

---

## Hooks Customizados

Exemplo: `useNetworkStats`
- Polling automático, cálculo de velocidades, formatação automática.
- Retorna: `{ downloadSpeed, uploadSpeed, totalDownloaded, totalUploaded, ... }`

---

## Layout Responsivo

- **Mobile Portrait**: Layout vertical, sidebar overlay, fontes compactas.
- **Tablet Portrait**: Layout centralizado, componentes maiores.
- **Tablet Landscape**: Layout horizontal, sidebar fixa, NetworkStats lateral.
- **Mobile Landscape**: Layout compacto, aproveitamento máximo da largura.

---

## Build e Compilação

### Build Padrão

```bash
bun run build
```
Gera arquivos otimizados em `dist/`.

### Build Inline

```bash
bun run build-inline.ts
```
Gera um único `index.html` com CSS e JS embutidos, ideal para distribuição simplificada.

---

## Como contribuir

- Siga os padrões de tipos e funções definidos.
- Sempre adicione comentários em novos tipos/funções.
- Prefira reutilizar tipos globais.
- Mantenha a estrutura de pastas e nomes consistente.

---

Este guia será atualizado conforme o projeto evoluir.
