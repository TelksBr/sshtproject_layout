# DTunnel - Documentação da API

Esta é a documentação da API JavaScript para uso dos hooks nativos fornecidos pelo sistema DTunnel, disponível via `window.Dt*`. Abaixo estão listados todos os métodos/interfaces disponíveis, agrupados por categoria, com descrições, parâmetros, retornos e exemplos de uso.

> **Importante:** Todos os métodos devem ser chamados a partir de JavaScript. Certifique-se de que o contexto `window.Dt*` está disponível antes de utilizá-los.

---

## Índice

* [Configuração](#configuração)
* [Ambiente de Rede](#ambiente-de-rede)
* [VPN](#vpn)
* [Interface Nativa](#interface-nativa)
* [Informações de Dispositivo](#informações-de-dispositivo)
* [Usuário e Autenticação](#usuário-e-autenticação)
* [Logs](#logs)
* [Tradução](#tradução)
* [Notificações](#notificações)
* [Web Views e URLs Externas](#web-views-e-urls-externas)
* [HotSpot](#hotspot)
* [Modo Avião](#modo-avião)
* [Outros](#outros)
* [Eventos Disponíveis](#eventos-disponíveis)

---

## Configuração

### `window.DtGetConfigs.execute()`

Retorna um *array* de categorias com itens de configuração.

```js
const configs = window.DtGetConfigs.execute();
// Exemplo de retorno:
// [ { id:1, name:'Categoria', sorter:1, color:'#FFF', items:[ {...} ] } ]
```

### `window.DtSetConfig.execute(id: number): void`

Define o item de configuração ativo pelo seu `id`.

```js
window.DtSetConfig.execute(1000);
```

### `window.DtGetDefaultConfig.execute(): Config | undefined`

Retorna o item selecionado ou `undefined` se nenhum estiver ativo.

```js
const current = window.DtGetDefaultConfig.execute();
if (current) console.log(current.name);
```

---

## Ambiente de Rede

### `window.DtGetLocalIP.execute(): string`

Retorna o IP local (e.g., `'192.168.1.100'`).

### `window.DtGetNetworkName.execute(): string`

Nome da rede atual (e.g., `'WIFI'`, `'MOBILE'`).

### `window.DtGetPingResult.execute(): number`

Tempo de ping em milissegundos.

### `window.DtGetNetworkData.execute(): { type_name:'MOBILE'|'WIFI', type:number, extra_info:string, detailed_state:string, reason?:string }`

Retorna objeto com detalhes do estado de rede.

---

## VPN

### `window.DtGetVpnState.execute(): 'CONNECTED'|'DISCONNECTED'|'CONNECTING'|'STOPPING'|'NO_NETWORK'|'AUTH'|'AUTH_FAILED'`

Estado atual da VPN.

### `window.DtExecuteVpnStart.execute(): void`

Inicia a conexão VPN.

### `window.DtExecuteVpnStop.execute(): void`

Para a conexão VPN.

---

## Interface Nativa

### `window.DtExecuteDialogConfig.execute(): void`

Abre diálogo de configurações nativo.

### `window.DtShowLoggerDialog.execute(): void`

Abre diálogo de logs de conexão.

### `window.DtShowMenuDialog.execute(): void`

Abre menu de ferramentas nativas.

---

## Informações de Dispositivo

### `window.DtGetStatusBarHeight.execute(): number`

Altura da barra de status (pixels).

### `window.DtGetNavigationBarHeight.execute(): number`

Altura da barra de navegação (pixels).

### `window.DtGetDeviceID.execute(): string`

ID único do dispositivo.

### `window.DtAppVersion.execute(): string`

Versão atual do aplicativo.

---

## Usuário e Autenticação

### `window.DtUsername.get(): string` / `DtUsername.set(username: string): void`

Obtem/define nome de usuário.

### `window.DtPassword.get(): string` / `DtPassword.set(password: string): void`

Obtem/define senha.

### `window.DtUuid.get(): string` / `DtUuid.set(uuid: string): void`

Obtem/define UUID (v2ray).

---

## Logs

### `window.DtGetLogs.execute(): string`

Retorna JSON com todos os logs.

### `window.DtClearLogs.execute(): void`

Limpa todos os logs.

---

## Tradução

### `window.DtTranslateText.execute(label: string): string`

Retorna texto traduzido para a chave.

```js
const label = window.DtTranslateText.execute("LBL_START");
```

---

## Notificações

### `window.DtSendNotification.execute(title: string, message: string, imageUrl: string): void`

Envia notificação local.

---

## Web Views e URLs Externas

### `window.DtStartWebViewActivity.execute(url: string): void`

Abre página interna via WebView.

### `window.DtOpenExternalUrl.execute(url: string): void`

Abre URL no navegador padrão.

---

## HotSpot

### `window.DtGetStatusHotSpotService.execute(): 'STOPPED'|'RUNNING'`

Status do serviço HotSpot.

### `window.DtStartHotSpotService.execute(): void`

Inicia HotSpot.

### `window.DtStopHotSpotService.execute(): void`

Para HotSpot.

### `window.DtGetNetworkDownloadBytes.execute(): number`

Total de bytes baixados.

### `window.DtGetNetworkUploadBytes.execute(): number`

Total de bytes enviados.

---

## Modo Avião

### `window.DtAirplaneState.execute(): 'ACTIVE'|'INACTIVE'`

Estado do modo avião.

### `window.DtAirplaneActivate.execute(): void`

Ativa modo avião.

### `window.DtAirplaneDeactivate.execute(): void`

Desativa modo avião.

---

## Outros

### `window.DtGetLocalConfigVersion.execute(): string`

Versão da configuração local (e.g., `'1.2.3'`).

### `window.DtStartAppUpdate.execute(): void`

Inicia processo de atualização da aplicação.

### `window.DtStartCheckUser.execute(): void`

Abre diálogo de checagem de usuário.

### `window.DtAppIsCurrentAssistant.execute(): boolean`

Verifica se app é assistente de voz padrão.

### `window.DtGoToVoiceInputSettings.execute(): void`

Abre configurações de assistente de voz.

---

## Eventos Disponíveis

Além dos métodos acessíveis via `window.Dt*`, o sistema DTunnel emite eventos JavaScript diretamente para o escopo global. Estes eventos podem ser capturados definindo funções com os nomes correspondentes no `window`, como por exemplo:

```js
window.DtVpnStateEvent = function(state) {
  console.log("Estado da VPN:", state);
};
```

Abaixo está a lista dos eventos atualmente disponíveis e exemplos de payload:

| Evento                     | Payload/Exemplo                                                                                       | Descrição                                                               |
|----------------------------|------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `DtCheckUserStartedEvent`  | `undefined`                                                                                           | Emitido quando o processo de checagem de usuário inicia.                |
| `DtCheckUserModelEvent`    | `{ "expiration_days": "983", "limit_connections": "09", "expiration_date": "02/03/2028", "username": "094d26d6-fe52-42f6-bfac-ef99dcdd3e50", "count_connections": "01" }` | Fornece informações detalhadas do modelo do usuário durante a checagem. |
| `DtNewDefaultConfigEvent`  | `undefined`                                                                                           | Disparado ao definir uma nova configuração padrão.                      |
| `DtMessageErrorEvent`      | `undefined`                                                                                           | Mensagem de erro genérica do sistema.                                   |
| `DtNewLogEvent`            | `undefined`                                                                                           | Enviado quando um novo log de conexão é registrado.                     |
| `DtErrorToastEvent`        | `undefined`                                                                                           | Usado para exibir mensagens de erro em forma de toast.                  |
| `DtSuccessToastEvent`      | `undefined`                                                                                           | Exibe notificações de sucesso via toast.                                |
| `DtVpnStartedSuccessEvent` | `undefined`                                                                                           | Indica que a VPN foi iniciada com sucesso.                              |
| `DtVpnStateEvent`          | `'STOPPING'`, `'CONNECTING'`, `'CONNECTED'`, `'AUTH'`, `'AUTH_FAILED'`, `'DISCONNECTED'`             | Reflete mudanças no estado da VPN.                                      |
| `DtVpnStoppedSuccessEvent` | `undefined`                                                                                           | Disparado quando a VPN é parada com sucesso.                            |
| `DtConfigSelectedEvent`    | `{...}` (ver exemplos abaixo)                                                                         | Disparado ao selecionar uma configuração.                               |

**Exemplo de payload para `DtConfigSelectedEvent` (V2RAY):**

```json
{
  "auth": { "v2ray_uuid": "6897ee2e-a49f-4d5d-b169-cd497d7b8cd9" },
  "category_id": 45300,
  "config_openvpn": "",
  "config_payload": { "payload": "", "sni": "" },
  "config_v2ray": "dmxlc3M6Ly9zZXUtdXVpZEBjZG5iLmRpYWxteWFwcC5jb206NDQzP21vZGU9YXV0byZwYXRoPSUyRiZzZWN1cml0eT10bHMmZW5jcnlwdGlvbj1ub25lJmhvc3Q9djJwcmVtaXVtLTF0LmItY2RuLm5ldCZ0eXBlPXhodHRwJnNuaT1jZG5iLmRpYWxteWFwcC5jb20jQ0xBUk8lMjBWMiUyMFNTSFQ=",
  "description": "claro pré/planos",
  "dns_server": { "dns1": "8.8.8.8", "dns2": "8.8.4.4" },
  "dnstt_key": "",
  "dnstt_name_server": "",
  "dnstt_server": "",
  "icon": "https://raw.githubusercontent.com/TelksBr/SSH_T_PROJECT_VPN/page/null/IC/CLARO_P.png",
  "id": 695925,
  "mode": "V2RAY",
  "name": "✅ CLARO V2RAY [1]",
  "proxy": { "host": "", "port": 0 },
  "server": { "host": "", "port": 0 },
  "sorter": 5,
  "tls_version": "TLSv1.2",
  "udp_ports": [7300],
  "url_check_user": "https://bot.sshtproject.com"
}
```

**Exemplo de payload para `DtConfigSelectedEvent` (SSH):**

```json
{
  "id": 696010,
  "name": "VIVO CLOUDFLARE [6]",
  "description": "Vivo Easy Prime → Vivo Controle",
  "mode": "SSH_PROXY",
  "sorter": 6,
  "icon": "https://raw.githubusercontent.com/TelksBr/SSH_T_PROJECT_VPN/page/null/IC/VIVO_P.png"
}
```

> **Dica:** para fins de debug, é possível interceptar todos os eventos criando funções globais no `window` com os nomes acima. Essas funções serão chamadas automaticamente quando o evento ocorrer.

---

*Esta documentação será atualizada conforme novos métodos e eventos forem descobertos.*
