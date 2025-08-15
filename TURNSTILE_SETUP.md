# 🛡️ Configuração do Cloudflare Turnstile

## Como configurar a proteção anti-bot no frontend

### 1. Obter as chaves do Cloudflare

1. **Acesse**: [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. **Vá para**: Turnstile → Create Site
3. **Configure**: 
   - **Site Name**: Nome do seu projeto
   - **Domain**: Seu domínio (ou `localhost` para desenvolvimento)
   - **Widget Mode**: Managed (recomendado)
4. **Copie as chaves**:
   - **Site Key** → Usar no frontend (público)
   - **Secret Key** → Usar no backend (privado)

### 2. Configurar as variáveis de ambiente

1. **Copie** o arquivo `.env.example` para `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. **Edite** o arquivo `.env.local` com suas chaves reais:
   ```env
   VITE_TURNSTILE_SITE_KEY=sua_site_key_real_aqui
   ```

### 3. Como funciona

- ✅ **Proteção ativada** no processo de compra
- 🔒 **Token obrigatório** para finalizar compra
- 🛡️ **Validação no backend** via API
- 🎯 **Experiência suave** para usuários reais
- 🚫 **Bloqueia bots** e ataques automatizados

### 4. Fluxo de proteção

1. **Usuário** preenche dados da compra
2. **Widget Turnstile** aparece na tela de confirmação
3. **Usuário** completa o desafio (se necessário)
4. **Token** é gerado automaticamente
5. **Botão** "Finalizar Compra" é habilitado
6. **API** valida o token no backend
7. **Compra** é processada se válida

### 5. Desenvolvimento local

Para desenvolvimento, você pode usar uma chave de teste ou configurar `localhost` no Cloudflare Dashboard.

### 6. Produção

Certifique-se de:
- ✅ Configurar o domínio correto no Cloudflare
- ✅ Usar as chaves de produção
- ✅ Não commitar chaves no git (.env.local é ignorado)

## Códigos de erro comuns

| Erro | Solução |
|------|---------|
| `Invalid sitekey` | Verificar se a VITE_TURNSTILE_SITE_KEY está correta |
| `Domain not allowed` | Adicionar domínio no Cloudflare Dashboard |
| `Token missing` | Widget não foi carregado/completado |

## Suporte

Para mais informações: [Documentação Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
