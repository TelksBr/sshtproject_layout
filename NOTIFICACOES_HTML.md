# Guia de Tags HTML para Notificações do App

Este documento reúne todas as **tags HTML suportadas e permitidas** pelo sistema de notificações do aplicativo (definidas e estilizadas em `src/utils/appFunctions.ts` e `src/index.css`).

---

## 🛡️ Como Funciona o Sistema de Sanitização

Por questões de segurança e integridade visual:
- **Tags permitidas** são renderizadas e recebem o estilo temático do aplicativo.
- **Atributos arbitrários** (como `style`, `class`, `id`, `onclick`) são removidos automaticamente.
- **Links (`<a>`)**: O atributo `href` é preservado se for uma URL segura (`http://` ou `https://`). Ao clicar no link dentro do app, a URL abre diretamente no navegador padrão do dispositivo.
- **Imagens (`<img>`)**: Os atributos `src` (URLs `http://` ou `https://`) e `alt` são preservados.
- **Tags não autorizadas** (como `<script>`, `<style>`, `<iframe>`, `<form>`): O conteúdo textual interno é mantido, mas as tags são removidas.

---

## 📋 Lista Completa de Tags Suportadas

Ao todo, **24 tags HTML** são reconhecidas pelo parser e estilizadas na interface:

| Tag | Descrição | Exemplo de Código |
| :--- | :--- | :--- |
| `<b>` | Texto em **negrito** | `<b>Texto em negrito</b>` |
| `<strong>` | Texto em **negrito** (semântico) | `<strong>Destaque forte</strong>` |
| `<i>` | Texto em *itálico* | `<i>Texto em itálico</i>` |
| `<em>` | Texto em *ênfase/itálico* | `<em>Ênfase</em>` |
| `<u>` | Texto <u>sublinhado</u> | `<u>Texto sublinhado</u>` |
| `<s>` | Texto <s>tachado / riscado</s> | `<s>Preço antigo</s>` |
| `<strike>` | Texto ~~riscado~~ | `<strike>Riscado</strike>` |
| `<del>` | Texto <del>deletado / tachado</del> | `<del>Removido</del>` |
| `<ins>` | Texto inserido / sublinhado | `<ins>Novo valor</ins>` |
| `<mark>` | Texto com **marcação/destaque visual** | `<mark>Atenção aqui</mark>` |
| `<small>` | Texto em tamanho menor | `<small>Termos e condições</small>` |
| `<sub>` | Texto <sub>subscrito</sub> | `H<sub>2</sub>O` |
| `<sup>` | Texto <sup>sobrescrito</sup> | `10<sup>2</sup>` |
| `<br>` | Quebra de linha simples | `Linha 1<br>Linha 2` |
| `<p>` | Parágrafo com margem inferior | `<p>Primeiro parágrafo.</p>` |
| `<span>` | Container de texto inline genérico | `<span>Texto simples</span>` |
| `<div>` | Bloco de conteúdo genérico | `<div>Bloco de texto</div>` |
| `<h1>` | Título de nível 1 (18px, negrito) | `<h1>Título Principal</h1>` |
| `<h2>` | Título de nível 2 (16px, negrito) | `<h2>Subtítulo Secundário</h2>` |
| `<h3>` | Título de nível 3 (15px, negrito) | `<h3>Título de Seção</h3>` |
| `<h4>` | Título de nível 4 (14px, negrito) | `<h4>Subseção</h4>` |
| `<hr>` | Linha divisória horizontal | `<hr>` |
| `<blockquote>` | Bloco de citação (com barra lateral temática) | `<blockquote>Aviso importante!</blockquote>` |
| `<code>` | Código inline em fonte monoespaçada | `<code>minha-chave-123</code>` |
| `<pre>` | Bloco de código pré-formatado com scroll | `<pre>config v2.0\nhost: 1.1.1.1</pre>` |
| `<ul>` | Lista não ordenada (com marcadores) | `<ul><li>Item 1</li></ul>` |
| `<ol>` | Lista ordenada (numerada) | `<ol><li>Passo 1</li></ol>` |
| `<li>` | Item de lista (usado dentro de `<ul>` ou `<ol>`) | `<li>Opção</li>` |
| `<a>` | Link externo clicável (`href="https://..."`) | `<a href="https://site.com">Clique aqui</a>` |
| `<img>` | Imagem inline (`src="https://..."` e `alt="..."`) | `<img src="https://site.com/foto.png" alt="Foto">` |

---

## 🎨 Detalhes de Estilização no App

As classes CSS `.notification-html` aplicam automaticamente a identidade visual do tema:

- **`<mark>`**: Fundo translúcido na cor de destaque (`rgba(139, 92, 246, 0.35)`), bordas arredondadas e texto destacado.
- **`<blockquote>`**: Barra lateral com a cor de destaque (`var(--accent)`), fundo com tom suave (`var(--accent-dim)`) e bordas arredondadas à direita.
- **`<code>`**: Fonte monoespaçada (`ui-monospace, Menlo, Consolas`), fundo escuro elevado e padding arredondado.
- **`<pre>`**: Caixa de código com borda temática, fundo elevado, cantos arredondados (`rounded-xl`) e barra de rolagem horizontal automática (`overflow-x: auto`).
- **`<a>`**: Cor de destaque (`var(--accent)`), peso semântico `600`, sublinhado e abertura automática externa ao toque.
- **`<img>`**: Limite de altura de até `14rem`, `object-fit: contain`, bordas arredondadas (`0.75rem`) e fundo elevado. *(Nota: Ocultadas no preview resumido da lista para economizar espaço, visíveis ao abrir a notificação).*
- **`<hr>`**: Linha de separação com borda sutil (`var(--border)`).

---

## 📦 Estrutura do Payload JSON de Notificação

Ao enviar notificações pelo painel ou backend, você pode utilizar tanto tags HTML no campo `message`/`body` quanto no `title`:

```json
{
  "title": "🎉 <b>Novidades no Servidor</b>",
  "message": "<p>Olá! Atualizamos nossos <strong>servidores SSH</strong>.</p><blockquote>Manutenção finalizada com sucesso!</blockquote><ul><li>Velocidade aumentada</li><li>Novos servidores adicionados</li></ul><p>Acesse nosso suporte: <a href=\"https://t.me/seucanal\">Canal Oficial</a></p>",
  "image": "https://meusite.com/banner-novidades.png"
}
```

### Campos Reconhecidos no JSON:

| Campo | Sinônimos Aceitos | Suporta HTML? | Descrição |
| :--- | :--- | :---: | :--- |
| `title` | `titulo` | Sim | Título da notificação. |
| `message` | `msg`, `body`, `content`, `texto` | Sim | Mensagem principal com suporte completo a todas as tags listadas acima. |
| `image` | `imageUrl`, `image_url`, `img`, `picture`, `gif` | Não (URL) | Banner / Imagem / GIF exibido no topo da notificação. |

---

## 💡 Exemplos Práticos de Notificações

### Exemplo 1: Aviso de Manutenção com Citação e Código
```html
<h3>⚠️ Manutenção Programada</h3>
<p>Os servidores serão reiniciados hoje às <b>23:00</b>.</p>
<blockquote>Tempo estimado de parada: <b>15 minutos</b>.</blockquote>
<p>Em caso de falha, use o DNS reserva: <code>1.1.1.1</code></p>
```

---

### Exemplo 2: Atualização de Configuração com Lista e Link
```html
<h2>🚀 Nova Atualização Disponível!</h2>
<p>Principais melhorias desta versão:</p>
<ul>
  <li><b>+5 novos servidores</b> no Brasil</li>
  <li>Estabilidade aprimorada em redes 5G</li>
  <li>Correção de reconexão automática</li>
</ul>
<hr>
<p>Dúvidas? <a href="https://t.me/seucanal">Entre em contato no nosso Telegram</a></p>
```

---

### Exemplo 3: Tutorial / Instruções com Passo a Passo
```html
<h4>Como conectar:</h4>
<ol>
  <li>Selecione o servidor de sua preferência</li>
  <li>Digite seu usuário e senha</li>
  <li>Clique no botão <mark>Conectar</mark></li>
</ol>
<p><small>Para suporte 24h, visite nossa central de ajuda.</small></p>
```
