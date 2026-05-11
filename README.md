# 💚 Saúde Solidária

Sistema de pesquisa para fundo de assistência à saúde dos funcionários.

## Estrutura

- `frontend/` - Site estático (GitHub Pages)
- `backend/` - API Node.js (Render)

## Deploy

### Backend (Render)
1. Criar banco PostgreSQL no Render
2. Fazer deploy do backend com variável `DATABASE_URL`
3. URL: `https://saude-solidaria-api.onrender.com`

### Frontend (GitHub Pages)
1. Fazer push da pasta `frontend` para o GitHub
2. Ativar GitHub Pages
3. Atualizar `API_URL` no `script.js` e `admin.js`

## Senha do Painel ADM

`saude123`

## Tecnologias

- Node.js + Express
- PostgreSQL
- HTML/CSS/JS
- Chart.js

