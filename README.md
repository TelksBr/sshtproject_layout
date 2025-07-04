# DTunnel Layout - Guia de Estrutura e Padrões

Este documento descreve a estrutura, padrões e principais convenções do layout do projeto DTunnel.

## Visão Geral

O projeto está organizado para garantir escalabilidade, clareza e facilidade de manutenção, seguindo as melhores práticas de React, TypeScript e arquitetura modular.

---

## Estrutura de Pastas

```text
project/
  src/
    components/         # Componentes React principais e reutilizáveis
      modals/           # Componentes de modais (Terms, Privacy, etc.)
      Sidebar/          # Componente de sidebar/menu lateral
      Header.tsx        # Cabeçalho com status VPN, IP e versão
      ConnectionForm.tsx # Formulário de autenticação
      NetworkStats.tsx  # Estatísticas de rede em tempo real
      ServerSelector.tsx # Seletor de configurações/servidores
      ...
    context/            # Contextos globais (React Context API)
    hooks/              # Hooks customizados
    types/              # Tipos globais e interfaces (TypeScript)
    utils/              # Funções utilitárias e integração nativa
    constants/          # Constantes da aplicação (logos, etc.)
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
- **Principais**: `Header`, `ServerSelector`, `ConnectionForm`, `NetworkStats`, `Sidebar`.
- **Modais**: Organizados na subpasta `modals/` (Terms, Privacy, Support, etc.).
- **Layout**: Todos os componentes são responsivos com suporte a tablet portrait/landscape.

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

### NetworkStats

Componente responsável por exibir estatísticas de rede em tempo real, incluindo velocidades de download/upload e totais transferidos.

**Funcionalidades:**

- Polling automático a cada 2 segundos para atualizar estatísticas.
- Exibe velocidade de download e upload em tempo real.
- Mostra totais de dados baixados e enviados.
- Layout adaptativo: horizontal em mobile/tablet portrait, vertical em tablet landscape.

**Padrão:**

- Utiliza o hook `useNetworkStats` para obter dados de rede.
- Não depende de props externas, funciona de forma autônoma.
- Formatação automática de bytes (B, KB, MB, GB).
- Visual compacto e responsivo para todos os tamanhos de tela.

**Exemplo de exibição:**

- **Download**: 1.2 MB/s (Total: 45.6 MB)
- **Upload**: 256 KB/s (Total: 8.9 MB)

---

### ServerSelector

Componente responsável por exibir e permitir a seleção de configurações/servidores disponíveis.

**Funcionalidades:**

- Lista todas as configurações disponíveis organizadas por categorias.
- Destaque visual da configuração ativa atual.
- Integração com AutoConnect para teste automático de configurações.
- Controle de modo avião e verificação de status do usuário.

**Padrão:**

- Emite evento `DtConfigSelectedEvent` quando uma configuração é selecionada.
- Não gerencia estado da configuração ativa, apenas reage a mudanças via contexto.
- Interface visual adaptativa com ícones e descrições.

**Props:**

- Não recebe props diretamente, utiliza contexto global e hooks próprios.

---

### Sidebar

Componente de menu lateral com navegação e configurações do app.

**Funcionalidades:**

- Menu organizado por categorias (Principais, Ferramentas, Configurações).
- Navegação para modais e funcionalidades específicas.
- Ajustes de sistema (APN, Rede, Bateria).
- Visual moderno com overlay e animações.

**Props:**

- `isOpen: boolean` — Controla visibilidade do menu.
- `onClose: () => void` — Função para fechar o menu.
- `onNavigate: (modal: ModalType) => void` — Função de navegação para modais.

**Padrão:**

- Sidebar fixa em tablet landscape, overlay em mobile e tablet portrait.
- Compactação automática em telas menores.
- Integração com funções nativas do sistema.

---

## Hooks Customizados

### useNetworkStats

Hook responsável por coletar e formatar estatísticas de rede em tempo real.

**Funcionalidades:**

- Polling automático a cada 2 segundos.
- Cálculo de velocidades baseado na diferença de bytes transferidos.
- Formatação automática de valores (B/s, KB/s, MB/s, etc.).
- Prevenção de loops infinitos usando `useRef`.

**Retorno:**

```typescript
{
  downloadSpeed: string;    // "1.2 MB/s"
  uploadSpeed: string;      // "256 KB/s"
  totalDownloaded: number;  // bytes totais
  totalUploaded: number;    // bytes totais
  formattedTotalDownloaded: string; // "45.6 MB"
  formattedTotalUploaded: string;   // "8.9 MB"
}
```

---

## Layout Responsivo

O projeto implementa um sistema de layout responsivo otimizado para:

### **Mobile Portrait** (até 768px)

- Layout vertical com componentes empilhados
- Sidebar como overlay deslizante
- Fontes e espaçamentos compactos
- Touch targets otimizados (mínimo 44px)

### **Tablet Portrait** (768px - 1024px)

- Layout centralizado com largura máxima
- Componentes com mais espaçamento
- Fontes e ícones maiores
- Sidebar ainda como overlay

### **Tablet Landscape** (1024px+)

- Layout horizontal de duas colunas
- Sidebar fixa na lateral esquerda
- NetworkStats fixa na lateral direita
- Componentes principais centralizados

### **Mobile Landscape** (orientação paisagem)

- Layout compacto otimizado
- Header, logo e componentes reduzidos
- Sidebar compacta
- Aproveitamento máximo da largura

---

## Build e Compilação

### Build Padrão

O projeto utiliza Vite como bundler e pode ser compilado com o comando padrão:

```bash
bun run build
```

Isso gera os arquivos na pasta `dist/` com CSS e JS separados.

---

## Build Inline

O projeto inclui um script customizado `build-inline.ts` que permite gerar um arquivo `index.html` único com CSS e JavaScript embutidos (inline), eliminando a necessidade de arquivos separados.

### Como usar

Execute o script de build inline:

```bash
bun run build-inline.ts
```

### O que acontece

1. **Build padrão**: Executa `bun run build` para gerar os arquivos otimizados na pasta `dist/`.
2. **Localização de assets**: Identifica automaticamente os arquivos CSS e JS gerados na pasta `dist/assets/`.
3. **Incorporação inline**: Lê o conteúdo dos arquivos CSS e JS e os incorpora diretamente no HTML.
4. **Geração do arquivo único**: Cria um novo `index.html` na pasta `dist/` com todo o código embutido.

### Vantagens do Build Inline

- **Arquivo único**: Todo o app fica em um só arquivo HTML, facilitando distribuição e deploy.
- **Sem dependências externas**: CSS e JS ficam embutidos, eliminando requisições HTTP adicionais.
- **Otimização**: Mantém todas as otimizações do build padrão (minificação, tree-shaking, etc.).
- **Compatibilidade**: Funciona em qualquer servidor web ou pode ser aberto diretamente no navegador.

### Estrutura do arquivo final

```html
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SSH T PROJECT LAYOUT</title>
    <style>/* CSS minificado embutido */</style>
  </head>
  <body>
    <div id="root"></div>
    <script>/* JavaScript minificado embutido */</script>
  </body>
</html>
```

### Quando usar

- **Distribuição simplificada**: Quando você precisa de apenas um arquivo para distribuir.
- **Ambientes restritos**: Onde não é possível servir arquivos estáticos separados.
- **Demos e protótipos**: Para facilitar compartilhamento e visualização.
- **Aplicações offline**: Quando o app precisa funcionar sem conexão com a internet.

---

## Como contribuir

- Siga os padrões de tipos e funções já definidos.
- Sempre adicione comentários em novos tipos/funções.
- Prefira reutilizar tipos globais ao invés de criar duplicatas.
- Mantenha a estrutura de pastas e nomes consistente.

---

Este guia será atualizado conforme o projeto evoluir.
