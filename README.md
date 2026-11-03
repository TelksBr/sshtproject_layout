
# DTunnel Layout — Guia de Estrutura e Padrões

Este documento apresenta a estrutura, padrões e principais convenções do projeto DTunnel, focando em escalabilidade, clareza e manutenção, com React, TypeScript e arquitetura modular.

## Países e idiomas

Os filtros de servidores e do Auto Conect reconhecem automaticamente a bandeira no nome de cada categoria (por exemplo, `🇿🇦 Mobile`). Todos os 249 países e territórios ISO 3166-1 possuem nomes locais para uso offline e em WebViews sem `Intl.DisplayNames`. O filtro mostra os países que possuem configurações disponíveis, sem exigir cadastro manual no layout.

O idioma da interface é escolhido pelo botão de globo no cabeçalho, com busca por nome nativo, nome traduzido ou código, e salvo no dispositivo. Alterar o país dos servidores não altera o idioma.

São 12 línguas em 14 opções: português brasileiro e português compartilhado por Portugal/África, espanhol, inglês, francês, alemão, italiano, árabe, russo, hindi, indonésio, suaíli e chinês simplificado/tradicional. Um mesmo dicionário atende aos países que compartilham uma língua; isso não representa tradução de todas as línguas existentes nesses países.

### Detecção, variantes e compatibilidade

A ordem de escolha é: preferência manual salva, primeiro idioma compatível da lista do aparelho, idioma regional de fallback e inglês. Sem qualquer indicação de país/idioma, mantém-se português brasileiro. O país funciona como sugestão inicial: não define a língua de todos os habitantes, especialmente em países multilíngues. Uma língua sem região, como `fr`, não inventa um país para o filtro de servidores.

O resolvedor trata tags BCP 47, scripts, extensões e variantes regionais sem uma biblioteca ou polyfill. Por exemplo, `fr-CA` e `fr-SN` usam `fr`; `es-AR` e `es-MX` usam `es`; `pt-AO`, `pt-MZ` e `pt-PT` usam `pt-PT`, preservando o país original. Preferências antigas `pt-AO` são normalizadas automaticamente. Chinês distingue explicitamente `Hans`/`Hant`, incluindo Taiwan e Hong Kong.

O português de Portugal/África herda o brasileiro e armazena somente diferenças. Novas variantes devem usar `extendLocale`, sem copiar um dicionário inteiro. O idioma escolhido atualiza `lang` e `dir` no documento; árabe usa RTL, e IPs, senhas e UUIDs mantêm LTR.

### Peso e extensão

O Vite usa `inlineDynamicImports` porque o app utiliza HTML inline no WebView. Todos os textos seguem no único bundle e funcionam offline; importar dicionários dinamicamente não reduziria esse HTML. Não foram adicionadas dependências de i18n, fontes, serviços de tradução ou solicitações de rede. Os nomes dos países usam o `Intl.DisplayNames` do dispositivo, com cache; em aparelhos antigos, os catálogos locais continuam disponíveis em português, espanhol e inglês, usando inglês para as demais línguas. Evita-se multiplicar 249 nomes de países por cada nova língua.

Para incluir uma tradução, crie o dicionário em `src/i18n/locales/` seguindo `TranslationSchema` e registre-o em `src/i18n/registry.ts`. O tipo de idioma e as opções do seletor são derivados desse registro; as chaves de `t()` também são verificadas pelo TypeScript. Atualize o resolvedor apenas se a nova língua precisar de uma regra regional ou de script.

Validação: `npm run test:i18n` verifica todos os países, chaves, mensagens não vazias, placeholders, herança, detecção, busca, persistência e RTL. Após `npm run build`, execute `npm run check:i18n-size`: o limite de crescimento é 80 KiB de JavaScript e 32 KiB em gzip sobre o build anterior à refatoração, medido na mesma árvore de trabalho.

### Cobertura de tradução

Os dicionários estão completos para as chaves de `TranslationSchema`: seletor de idiomas, cabeçalho, filtros de países/configurações, formulário de conexão, estatísticas, menu e mensagens já internacionalizadas do Auto Conect. Os controles comuns de fechar/voltar nos modais também usam o idioma selecionado. Ainda existem textos fixos em português em telas antigas, inclusive conteúdo de alguns modais, avisos e textos de termos/privacidade. Esses textos precisam de migração e revisão para declarar 100% de cobertura do aplicativo. Conteúdo recebido do SDK, nomes de servidores e categorias não é traduzido automaticamente.

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
