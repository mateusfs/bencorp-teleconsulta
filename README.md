# BenCorp — Teleconsulta PAD

Plataforma simplificada de teleconsulta (Pronto Atendimento Digital) para o case técnico BenCorp.

## Estrutura

```text
apps/api   NestJS · app / entities / externals
apps/web   React + Vite
docs/      Arquitetura, domínio e checklist
```

API (`apps/api/src`): `app/` (contracts + use-cases) · `entities/` · `externals/`. Imports com `@/*` (ex.: `@/app/use-cases/...`, `@/entities/...`) — ver [api-clean-architecture.md](docs/architecture/api-clean-architecture.md).

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado)

## Credenciais do seed

| E-mail | Senha | Papel |
| --- | --- | --- |
| admin@bencorp.local | Senha@123 | ADMIN |
| enfermeiro@bencorp.local | Senha@123 | ENFERMEIRO |
| medico@bencorp.local | Senha@123 | MEDICO |

Paciente **não** tem login — acesso à sala será via link temporário (Épico E).

## Executar com Docker

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3000
- LiveKit (dev): ws://localhost:7880

A API aplica migrations e seed no startup.

## Executar localmente

```bash
cp .env.example .env
docker compose up -d postgres livekit
npm install
cd apps/api && npx prisma migrate dev && npx prisma db seed && npm run start:dev
# outro terminal
cd apps/web && npm run dev
```

## Scripts

Na raiz:

- `npm run dev:api` / `npm run dev:web`
- `npm test` — testes da API
- `npm run test:cov` — cobertura


- Fundação + Identity + Fila/Atendimento + **Prontuário/Auditoria (Épico D)** entregues; vídeo/tokens/chat e PWA nos próximos épicos.
- Token JWT no `localStorage` no front (adequado ao case; não é hardening de produção).
- LiveKit no Compose ainda sem emissão de tokens de sala na API (`RoomTokenRevoker` no-op).
- Tela `/atendimentos/:id` inclui formulário de prontuário; vídeo/chat no Épico E.
- Migration `20260807150000_prontuario_auditoria` precisa de `prisma migrate deploy` com Postgres no ar.
