# Core Access Manager — painel web

Painel em Next.js 16 (App Router) + React 19 + Tailwind CSS 4 para a API do
Core Access Manager.

## Rodando

```bash
npm install
npm run dev      # http://localhost:3000
```

O `next.config.ts` faz rewrite de `/api/*` para `http://localhost:3333/api/*`
(ou para o valor de `API_URL`), então não é preciso configurar CORS.

## Funcionalidades

- Login e cadastro (o primeiro usuário cadastrado vira `ADMIN`).
- Sessão persistida em `localStorage` e revalidada via `GET /api/auth/me`.
- Listagem paginada com busca por nome/e-mail.
- Cadastro, ativação/desativação e exclusão de usuários (apenas `ADMIN`).
- Contas `USER` veem apenas o próprio perfil.

## Scripts

```bash
npm run dev     # ambiente de desenvolvimento
npm run lint    # ESLint (next/core-web-vitals)
npm run build   # build de produção
```
