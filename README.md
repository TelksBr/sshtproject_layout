
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

O Vite usa `inlineDynamicImports` porque o app utiliza HTML inline no WebView. Todos os textos seguem no único bundle e funcionam offline; importar dicionários dinamicamente não reduziria esse HTML. As 1198 entradas complementares (949 mensagens e 249 nomes de países) estão compactadas por idioma em `src/i18n/messages/data.ts`. O runtime usa somente as funções de descompactação/UTF-8 do `fflate` (versão fixa, sem dependências transitivas), expande o idioma solicitado e mantém no máximo três catálogos em cache. Não há chamadas de tradução em tempo de execução, fontes adicionais ou download de arquivos de idioma.

Os nomes dos países usam o `Intl.DisplayNames` do dispositivo, com cache. Em aparelhos antigos, todos os 249 países continuam localizados nas 14 opções usando os catálogos compactados. Esses nomes vêm dos dados ICU/CLDR do runtime de build, preservando os códigos ISO. Para atualizá-los ou incluir um idioma, execute `npm run i18n:countries` antes de empacotar; esse comando não usa serviços de tradução nem rede.

Para incluir uma tradução, crie o dicionário em `src/i18n/locales/` seguindo `TranslationSchema` e registre-o em `src/i18n/registry.ts`. O tipo de idioma e as opções do seletor são derivados desse registro; as chaves de `t()` também são verificadas pelo TypeScript. Atualize o resolvedor apenas se a nova língua precisar de uma regra regional ou de script.

As mensagens complementares são mantidas nos arquivos JSON de `src/i18n/messages/`. Cada chave é estável, compartilhada quando o texto é idêntico, e aceita parâmetros `{p0}`, `{p1}` sem incluir dados reais de usuários nos dicionários. As referências `tr()` são verificadas pelo TypeScript. Componentes que usam essas mensagens assinam `useMessages()`; utilitários e callbacks usam o mesmo idioma ativo. Rótulos de tutoriais, serviços e presets usam getters para acompanhar mudanças de idioma sem reconstruir dados do SDK. Datas e valores da interface usam o idioma selecionado, preservando a moeda BRL; timestamps técnicos dos logs conservam o formato do diagnóstico.

`npm run i18n:audit` localiza novos textos fixos e apresenta arquivo, linha e chave sugerida. Adicione os textos aos catálogos, substitua a ocorrência pela chave e execute `npm run i18n:pack`. Esse comando exige todos os idiomas e placeholders completos e gera os dados compactados; não edite `data.ts` manualmente. Para cadastrar um novo idioma, inclua também seu catálogo JSON completo. O português de Portugal/África é empacotado somente com as diferenças em relação ao brasileiro.

`npm run test:i18n` verifica todos os países, catálogos, placeholders, herança, detecção, busca, persistência, RTL, renderização de telas em todos os idiomas e atualização de mensagens abertas. Os testes também detectam dados compactados desatualizados e acesso indevido à rede no carregamento de traduções. `npm run build` e o build inline executam a auditoria e o empacotamento. Após o build, `npm run check:i18n-size` aplica o teto de **1050 KiB de JavaScript e 400 KiB em gzip** para a cobertura integral offline. Esse teto substitui o orçamento anterior, que cobria somente o núcleo de i18n. Os catálogos devem ocupar menos da metade do JSON original após compactação.

### Cobertura de tradução

Além de `TranslationSchema`, os catálogos cobrem os textos fixos das telas de servidores, hotspot, DNS, IP, velocidade, credenciais, compras, renovação, recuperação, testes, notificações, atualização, tutoriais, serviços, FAQ, logs, erros, termos e privacidade, incluindo rótulos de acessibilidade e os nomes dos 249 países. A auditoria termina sem ocorrências de textos traduzíveis não catalogados e todas as 1198 entradas complementares resolvem nas 14 opções. A cobertura de 100% refere-se aos textos próprios do aplicativo dentro desse inventário, não a revisão humana de cada tradução nem a todo conteúdo recebido de terceiros.

Nomes de pessoas, servidores e categorias, URLs, e-mails, marcas, unidades técnicas, protocolos, dados de pagamento/credenciais e conteúdo original do SDK permanecem identificadores ou dados de origem. Mensagens técnicas de console/diagnóstico também ficam fora da auditoria de interface. A linguagem do conteúdo de vídeos não é alterada.

As traduções complementares foram geradas com assistência do Google Translate durante o desenvolvimento, protegendo placeholders e termos técnicos. O app não usa esse serviço. Os textos legais conservam o conteúdo original e os mecanismos de aceite; traduções automáticas precisam de revisão linguística/jurídica humana antes de serem consideradas versões oficiais. `scripts/translate-i18n.py --allow-network` pode preencher novas entradas ausentes durante a manutenção, enviando apenas o texto estático do catálogo; entradas existentes são preservadas. O build normal nunca executa esse script.

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
