# DTunnel Layout - Guia de Estrutura e Padrões

Este documento descreve a estrutura, padrões e principais convenções do layout do projeto DTunnel.

## Visão Geral

O projeto está organizado para garantir escalabilidade, clareza e facilidade de manutenção, seguindo as melhores práticas de React, TypeScript e arquitetura modular.

---

## Estrutura de Pastas

```text
project/
  src/
    components/         # Componentes React reutilizáveis e de domínio
    context/            # Contextos globais (React Context API)
    hooks/              # Hooks customizados
    types/              # Tipos globais e interfaces (TypeScript)
    utils/              # Funções utilitárias e integração nativa
      ...
```

---

## Padrão de Tipos (types/)

- Todos os tipos globais (ex: VPN, Config, Network) ficam em `src/types/`.
- Tipos são exportados e reutilizados em todo o projeto.
- Exemplo:
  - `ConfigItem`, `ConfigCategory`, `ConfigAuth` em `types/config.ts`.
  - `VpnState`, `NetworkType`, `NetworkData` em `types/vpn.ts`.

---

## Funções Utilitárias (utils/)

- Funções de integração com a camada nativa (window.Dt*) e helpers ficam em `src/utils/`.
- Todas as funções são exportadas individualmente e tipadas.
- Exemplo:
  - `getConnectionState`, `getAllConfigs`, `getUsername`, `getLocalIP` em `utils/appFunctions.ts`.
  - Eventos globais: `onDtunnelEvent`, `emitDtunnelEvent` em `utils/dtEvents.ts`.

---

## Componentes (components/)

- Componentes React são organizados por domínio e reutilização.
- Exemplo: `Header`, `ServerSelector`, `ConnectionForm`, modais em subpastas.

---

## Convenções Gerais

- **TypeScript**: Tipagem forte em todo o projeto.
- **Extensibilidade**: Tipos e funções permitem campos dinâmicos quando necessário.
- **Documentação**: Todos os tipos e funções principais possuem comentários explicativos.
- **Padrão de nomes**: PascalCase para componentes/tipos, camelCase para funções/variáveis.
- **Responsividade**: Componentes usam Tailwind CSS para garantir visual moderno e responsivo.

---

## Documentação dos Componentes Padronizados

### Header

Componente visual responsável por exibir o status da conexão VPN, o IP local e a versão do app. Não possui lógica interna de polling ou eventos, recebendo todas as informações via props.

**Props:**

- `onMenuClick: () => void` — Função chamada ao clicar no botão de menu.
- `version: string` — Versão do app exibida no canto direito.
- `localIP: string` — IP local da máquina, atualizado via polling no componente pai.
- `vpnState: VpnState` — Estado atual da conexão VPN, atualizado via eventos globais no componente pai.

**Exemplo de uso:**

```tsx
<Header
  onMenuClick={() => setShowMenu(true)}
  version={version}
  localIP={localIP}
  vpnState={vpnState}
/>
```

**Padrão:**

- Não possui lógica de atualização interna.
- Utiliza apenas tipos centralizados (`VpnState` de `types/vpn.ts`).
- Exibe status e IP conforme padrão da API/documentação.

---

### App

Componente principal do app, responsável por:

- Gerenciar o estado global do IP local (`localIP`) via polling.
- Gerenciar o estado global do status da VPN (`vpnState`) via eventos globais.
- Passar essas informações para o Header via props.
- Controlar modais, layout e navegação.

**Padrão:**

- Toda lógica de atualização de status/eventos/polling centralizada aqui.
- Header e demais componentes recebem apenas props e não implementam lógica de atualização própria.

---

### ConnectionForm

Componente responsável por exibir e gerenciar os campos de autenticação de acordo com a configuração ativa selecionada.

**Padrão:**

- Não faz polling nem busca direta de configuração: depende exclusivamente do evento global `DtConfigSelectedEvent` para atualizar seu layout e valores.
- Exibe campos de usuário/senha ou UUID conforme o modo da configuração (`mode`).
- Atualiza os valores dos campos e sincroniza com o app via funções centralizadas (`setUsername`, `setPassword`, `setUUID`).
- Não possui lógica de seleção de configuração, apenas reage ao evento emitido pelo `ServerSelector`.

**Props:**

- Não recebe props diretamente, toda a lógica é baseada em eventos globais e estado local.

**Exemplo de funcionamento:**

- Ao selecionar uma configuração no `ServerSelector`, o evento `DtConfigSelectedEvent` é emitido.
- O `ConnectionForm` escuta esse evento e atualiza os campos exibidos e seus valores conforme o tipo de config (usuário/senha ou UUID).

**Exemplo de exibição dinâmica:**

- Se o modo da config começa com `v2ray`, exibe apenas o campo UUID.
- Caso contrário, exibe campos de usuário e senha.

---

> **Observação:**
> O padrão de comunicação entre componentes é sempre via eventos globais e tipos centralizados, garantindo desacoplamento e previsibilidade.

---

> **Observação:**
> Todos os tipos utilizados devem ser importados de `types/` e funções utilitárias de `utils/`, conforme padrão documentado.

---

## Como contribuir

- Siga os padrões de tipos e funções já definidos.
- Sempre adicione comentários em novos tipos/funções.
- Prefira reutilizar tipos globais ao invés de criar duplicatas.
- Mantenha a estrutura de pastas e nomes consistente.

---

Este guia será atualizado conforme o projeto evoluir.
