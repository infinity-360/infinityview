# Infinity 360 — site (versão "voo")

Site estático pronto para o GitHub Pages com o domínio **infinityview360.com.br** (o `CNAME` já está aqui).

## Publicar
1. Todos os arquivos estão soltos nesta pasta, sem subpastas e com menos de 100 arquivos.
2. No repositório da conta infinity-360 (o atual é `infinityview`): Add file → Upload files → selecione TODOS os arquivos desta pasta (Ctrl+A) → Commit.
   Para trocar o site antigo por este, apague antes os arquivos antigos do repositório (ou crie um repositório novo e mova o domínio).
3. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`. O DNS no Registro.br continua o mesmo.

## O que é cada grupo de arquivos
- `index.html`, `main-*.js`, `style-*.css`, `*.woff2`: a página, o código e as fontes (Inter Tight e JetBrains Mono).
- `decolagem-00.webp` a `decolagem-22.webp`, `lencois-*.webp`, `desdobra-*.webp`: os vídeos do scroll quebrados em quadros (9 quadros por arquivo).
- `gimbal-1..4.webp`, `fim.webp`: peças da câmera e o fundo do rodapé.
- Fotos, vídeos, logos e páginas `privacidade.html` e `404.html`: os mesmos do site anterior.

## Editar
Os textos estão no `index.html` (procure pelo texto que quer trocar). Para mudanças de animação, use o projeto-fonte (pasta `site-fonte`) e rode `npm install` e `npm run build`.
