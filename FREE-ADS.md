# SSHTProject Free

Branch: `codex/sshtproject-free`, criada a partir de `feat/vtunnel-sdk-dns`.
Dependência publicada: `vtunnel-sdk@2.11.0`, fixada explicitamente porque a tag
`latest` ainda apontava para 2.10.0 durante a implementação.

## Preparar no painel

Use um APK atualizado com a bridge `VtAds` e os eventos de Ads. Ative os anúncios,
configure o Appodeal e os tempos inicial, de recompensa e de aviso para o app Free.
O pacote npm sozinho não adiciona a bridge a um APK antigo.

Em Layout / Aparência → Ads, para usar a apresentação HTML desta branch:

- `APP_ADS_TIMER_NATIVE_ENABLED=false`: contador desenhado pelo layout.
- `APP_ADS_WARNING_NATIVE_PROMPT=false`: aviso de pouco tempo em HTML.
- `APP_ADS_EXPIRED_NATIVE_PROMPT=false`: aviso de expiração em HTML.
- `APP_ADS_REWARDED_NATIVE_PROMPT=false`: dispensa a confirmação em entradas legadas.
- `APP_ADS_REWARDED_NATIVE_LOADING=false`: permite cancelar a espera pelo layout.
- `APP_ADS_BANNER_ENABLED`: opcional; o banner continua sendo nativo.

Se os avisos ou o carregamento nativos permanecerem ativos, o layout respeita as
flags e não mostra o diálogo ou o cancelamento equivalente em HTML. O vídeo de
recompensa é sempre apresentado pelo provider nativo.

## Comportamento

O cartão mostra tempo restante, tempo por recompensa e se o contador está em uso.
`ads.getState()` é lido ao montar, ao voltar à tela, nos quatro eventos de Ads e
a cada cinco segundos enquanto a página está visível. Não existe contagem nem
concessão de tempo em JavaScript. `showRewarded()` solicita o vídeo;
`preloadRewarded()` prepara o provider e `cancelRewarded()` cancela apenas a espera.

Fechar um vídeo sem recompensa não adiciona tempo. Falha e cancelamento permitem
nova tentativa. Avisos ficam pendentes enquanto o menu, um modal principal ou o
Auto Conect está aberto, e são descartados se a leitura nativa indicar reposição
de tempo. A cortesia nativa pode repor tempo ao chegar a zero; o aviso de fim só
abre após `adsTimeExpired`. Depois de ganhar tempo após a expiração, o usuário
reconecta pelo botão Conectar.

A edição Free mantém configurações, credenciais, DNS e ferramentas de conexão;
remove do menu os atalhos de geração de teste e recuperação de login comercial,
assim como o monitoramento e as notificações de pagamentos em segundo plano.
Textos de Ads estão disponíveis em português e espanhol; a aparência acompanha
os temas existentes. APKs sem a nova bridge recebem uma indicação de atualização.

## Compilar e conferir

```sh
npm install
npm run test:ads
npm run test:logs
npm run build
npm run build:inline
```

O último comando gera `dist/index.html` com CSS e JavaScript embutidos, para
importação no painel. O simulador não é incluído nesse HTML.

Para testar sem monetização real, execute `npm run dev` e abra
`http://localhost:8080/tests/ads-preview.html`. Essa página usa o simulador oficial
do SDK com botões para abrir, recompensar, fechar, falhar e esgotar o tempo, além
de alternar tema e idioma. Ela só funciona no servidor de desenvolvimento.

Validação em aparelho com Appodeal real ainda é necessária antes da publicação.

## Carregamento e credenciais

Com `APP_ADS_REWARDED_NATIVE_LOADING=false`, a espera por um vídeo mostra um
diálogo HTML com spinner e cancelamento. Ele fecha quando o vídeo abre, falha
ou a espera é cancelada. Não permite interromper um vídeo já em abertura.
Com a flag nativa ativa, o Android apresenta o carregamento.

Sem configuração selecionada, a tela orienta a escolher um servidor e não mostra
campos de acesso. Em configurações selecionadas, apenas credenciais ausentes são
solicitadas; credenciais protegidas são reconhecidas pelas flags nativas
`requires_*`. A remoção da seleção também limpa a apresentação anterior.
O Auto Conect solicita credenciais necessárias dentro do próprio assistente.

## Avaliação oficial dentro do aplicativo

O antigo convite HTML e seu endereço fixo de outro pacote foram removidos desta
branch. O repositório Android agora integra `com.google.android.play:review:2.0.2`
em `PlayReviewController`, sem depender do layout nem de uma versão nova do SDK JS.
É necessário gerar/distribuir um APK/AAB a partir desse código atualizado.

A solicitação nativa é controlada pelo painel em Layout / Aparência → Avaliações
na Play. `APP_PLAY_REVIEW_ENABLED` vem desativado por padrão. A espera após
conectar (`APP_PLAY_REVIEW_DELAY`, 10–600 segundos; padrão 60) e o número de
conexões (`APP_PLAY_REVIEW_MIN_CONNECTIONS`, 1–100; padrão 3) são configuráveis.
`APP_PLAY_REVIEW_ONCE=true` evita novas tentativas nesta instalação após a primeira,
mesmo sem confirmação de nota. Se desativado, há intervalo mínimo de 30 dias.
Mudanças sincronizadas cancelam/reagendam solicitações pendentes. O app aguarda
ficar em primeiro plano, fora da espera/exibição de rewarded e fora do limiar de
pouco tempo. Não concede recompensa por avaliar e não mostra pré-pergunta.

O próprio Google decide se apresenta o popup e não informa se o usuário enviou
uma nota. O app registra uma tentativa, nunca uma avaliação confirmada. Em APKs
instalados por fora ou com quota atingida, o popup pode não aparecer. A validação
visual real deve usar uma conta elegível e distribuição de teste pela Play Store.

Referências oficiais:
[integração Android](https://developer.android.com/guide/playcore/in-app-review/kotlin-java)
e [comportamento/quota](https://developer.android.com/guide/playcore/in-app-review).
