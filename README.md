# BenCorp — Teleconsulta PAD

Plataforma simplificada de **Pronto Atendimento Digital** (teleconsulta) para o case técnico BenCorp.

Repositório: estrutura monorepo, API NestJS (Clean Architecture layer-first), web React/Vite, Postgres/Prisma, LiveKit.

## Sumário

1. [Pré-requisitos](#pré-requisitos)
2. [Subir com Docker (recomendado para avaliador)](#subir-com-docker-recomendado-para-avaliador)
3. [Demo rápida sem Postgres](#demo-rápida-sem-postgres)
4. [Desenvolvimento local](#desenvolvimento-local)
5. [Credenciais do seed](#credenciais-do-seed)
6. [Estrutura do repositório](#estrutura-do-repositório)
7. [Scripts](#scripts)
8. [Documentação](#documentação)
9. [Limitações](#limitações)
10. [Uso de IA](#uso-de-ia)

## Pré-requisitos

- Node.js **20+**
- Docker + Docker Compose (stack completa)
- Git

## Subir com Docker (recomendado para avaliador)

```bash
cp .env.example .env
docker compose up --build
```

| Serviço | URL |
| --- | --- |
| Web | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/health |
| LiveKit | ws://localhost:7880 |

A API aplica migrations e seed no start (`PERSISTENCE_MODE=postgres`). Login com as [credenciais do seed](#credenciais-do-seed).

Parar: `docker compose down` (volume Postgres persiste; `down -v` zera dados).

## Demo rápida sem Postgres

Persistência em memória + vídeo **LiveKit real** (SFU no Compose). Tokens/sala usam o mesmo `LiveKitVideoRoomProvider` do modo postgres.

```bash
cp .env.example .env
npm install
docker compose up -d livekit
npm run build -w api
npm run dev:api:memory
# outro terminal
npm run dev:web
```

Atalho (API memory + Vite + LiveKit): `npm run dev:memory`.

- Seed em memória (mesmos usuários da tabela abaixo)
- Badge na Home: **Persistência: memory**
- Reinício da API zera IDs em memória — links/URLs antigas de atendimento deixam de valer

| `PERSISTENCE_MODE` | Comportamento |
| --- | --- |
| `postgres` | Prisma + PostgreSQL (entrega / Compose) |
| `memory` | Só memória + LiveKit |
| `write-behind` | Memória na request + flush best-effort + LiveKit |

Detalhes: [ADR-002](docs/architecture/adrs/002-persistencia-memoria-write-behind.md).

## Desenvolvimento local

```bash
cp .env.example .env
docker compose up -d postgres livekit
npm install
cd apps/api && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
# outro terminal
cd apps/web && npm run dev
```

Fluxo clínico resumido: login → fila → iniciar atendimento → sala (vídeo/chat/prontuário) → copiar link do paciente → finalizar (encerrar ou encaminhar). Pacientes em `/pacientes` (ENFERMEIRO/MEDICO).

## Credenciais do seed

| E-mail | Senha | Papel |
| --- | --- | --- |
| admin@bencorp.local | Senha@123 | ADMIN |
| enfermeiro@bencorp.local | Senha@123 | ENFERMEIRO |
| medico@bencorp.local | Senha@123 | MEDICO |

Paciente **não** tem login — entra em `/paciente/sala/:token` via link gerado na sala.

## Estrutura do repositório

```text
apps/api/src/
  app/          contracts (ports) + use-cases
  entities/     domínio puro (sem Nest/Prisma)
  externals/    Nest, Prisma, LiveKit, memória, JWT
apps/web/       React + Vite (+ PWA shell)
docs/architecture/
  case-checklist.md
  api-clean-architecture.md
  domain-analysis.md
  limitacoes-e-abordagem.md
  uso-de-ia.md
  adrs/
docker-compose.yml
```

Imports da API: `@/*` → `src/*`. Guia: [api-clean-architecture.md](docs/architecture/api-clean-architecture.md).

Dockerfiles: `apps/api/Dockerfile`, `apps/web/Dockerfile` (nginx serve o build estático).

## Scripts

Na raiz do monorepo:

| Script | Descrição |
| --- | --- |
| `npm run dev:api` / `dev:web` | Desenvolvimento |
| `npm run dev:api:memory` | API em memória + env LiveKit/JWT |
| `npm run dev:memory` | Script: LiveKit + API memory + Vite |
| `npm test` / `npm run test:cov` | Testes da API + cobertura |
| `npm run lint` | ESLint da API |
| `npm run build` | Build API + web |

## Documentação

- Checklist CX: [docs/architecture/case-checklist.md](docs/architecture/case-checklist.md)
- Domínio: [docs/architecture/domain-analysis.md](docs/architecture/domain-analysis.md)
- ADRs: [docs/architecture/adrs/](docs/architecture/adrs/)
- Limitações: [docs/architecture/limitacoes-e-abordagem.md](docs/architecture/limitacoes-e-abordagem.md)
- Uso de IA: [docs/architecture/uso-de-ia.md](docs/architecture/uso-de-ia.md)

## Limitações

Resumo; detalhes em [limitacoes-e-abordagem.md](docs/architecture/limitacoes-e-abordagem.md).

- JWT no `localStorage` (case; não produção)
- PWA só cacheia shell — sem PHI/API offline
- LiveKit `--dev` com keys de desenvolvimento
- Modo `memory` volátil; write-behind sem garantia de durabilidade
- React `StrictMode` ativo em dev (efeitos montam 2×); a sala de vídeo trata abort/retry para o LiveKit
- Sem rate limit / APM avançado

## Uso de IA

Permitido pelo case. Resumo do que a IA acelerou vs. decisões de domínio humanas: [uso-de-ia.md](docs/architecture/uso-de-ia.md).
