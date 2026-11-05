# Infinity 360 — site institucional

Site estático (HTML + CSS + JS), pronto para GitHub Pages e domínio próprio **infinityview360.com.br**.

## Publicar no GitHub Pages
1. Todos os arquivos estão soltos nesta pasta (sem subpastas). No GitHub: Add file → Upload files → selecione TODOS os arquivos desta pasta (Ctrl+A) → Commit.
   Crie um repositório (ex.: `infinity360-site`) na conta infinity-360 e envie **todo o conteúdo desta pasta** para a raiz.
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. O arquivo `CNAME` já aponta para `infinityview360.com.br`. Configure o DNS no Registro.br antes (ou logo depois) de publicar, senão o endereço github.io redireciona para um domínio que ainda não responde. Crie:
   - 4 registros **A** para `@`: 185.199.108.153 · 185.199.109.153 · 185.199.110.153 · 185.199.111.153
   - 1 registro **CNAME** para `www` → `infinity-360.github.io`
4. Depois que o DNS propagar, marque **Enforce HTTPS** em Settings → Pages.

## Onde editar
- `config.js` — WhatsApp, e-mail, **Instagram** (vazio = ícone oculto), ID do **Google Analytics** e lista de tours.
- `depoimentos.js` — depoimentos reais de clientes (vazio = mostra convite para enviar depoimento).
- `index.html` — textos, serviços e itens do portfólio (cada item do portfólio é um `<article class="pf-item">`).
- Google Search Console: descomente a meta `google-site-verification` no `<head>` do `index.html`.

## Estrutura
Tudo fica na raiz: páginas HTML, style.css, main.js, config.js, depoimentos.js, imagens, vídeos, fontes e drone-sprite.webp (todos os quadros do drone numa só imagem).
