# BenCorp — Teleconsulta PAD

Plataforma simplificada de teleconsulta (Pronto Atendimento Digital) para o case técnico BenCorp.

## Estrutura

```text
apps/api   NestJS · app / entities / externals
apps/web   React + Vite
docs/      Arquitetura, domínio e checklist
```

API (`apps/api/src`): `app/` (contracts + use-cases) · `entities/` · `externals/`. Imports com `@/*` — ver [api-clean-architecture.md](docs/architecture/api-clean-architecture.md).

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose (recomendado para stack completa)

## Credenciais do seed

| E-mail | Senha | Papel |
| --- | --- | --- |
| admin@bencorp.local | Senha@123 | ADMIN |
| enfermeiro@bencorp.local | Senha@123 | ENFERMEIRO |
| medico@bencorp.local | Senha@123 | MEDICO |

Paciente **não** tem login — entra em `/paciente/sala/:token` via link gerado pelo profissional na sala.

## Demo sem Postgres (Épico I)

Útil para mostrar a web/API **sem instalar banco**:

```bash
cp .env.example .env
# em .env:
# PERSISTENCE_MODE=memory
# JWT_SECRET=qualquer-segredo-local
npm install
PERSISTENCE_MODE=memory JWT_SECRET=dev-secret npm run dev:api
# outro terminal
npm run dev:web
```

- Dados ficam só na memória do processo Nest (seed automático).
- Home mostra o badge **Persistência: memory**.
- `GET /health` → `{ persistenceMode, databaseConnected }`.
- Vídeo LiveKit usa provider fake (sem SFU); fluxo de fila/login/prontuário funciona.

Modos (`PERSISTENCE_MODE`):

| Valor | Uso |
| --- | --- |
| `postgres` | Padrão — Prisma + PostgreSQL (entrega completa) |
| `memory` | Só memória — sem migrate/seed Prisma |
| `write-behind` | Memória na request; após a resposta tenta gravar no Postgres |

Detalhes: [ADR-002](docs/architecture/adrs/002-persistencia-memoria-write-behind.md).

## Executar com Docker (stack completa)

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:3000
- LiveKit (dev): ws://localhost:7880

## Executar localmente com Postgres

```bash
cp .env.example .env
docker compose up -d postgres livekit
npm install
cd apps/api && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
# outro terminal
cd apps/web && npm run dev
```

## Fluxo da sala (Épico E)

1. Profissional inicia atendimento na fila e abre `/atendimentos/:id`.
2. Backend emite token LiveKit (TTL 15 min); UI mostra vídeo + chat + prontuário.
3. **Copiar link do paciente** gera convite opaco single-use.
4. Paciente abre o link (sem login), resgata credenciais e entra em vídeo/chat.
5. Ao finalizar, escolher **Encerrar** ou **Encaminhar ao médico** — tokens/convites são revogados.

## Scripts

Na raiz:

- `npm run dev:api` / `npm run dev:web`
- `npm test` — testes da API
- `npm run test:cov` — cobertura

## Limitações

- Token JWT no `localStorage` no front (adequado ao case; não é hardening de produção).
- Modo `memory` é **volátil** (reinício zera dados) e não substitui Postgres na entrega oficial.
- Write-behind não garante durabilidade se o processo cair antes do flush.
- LiveKit em modo `--dev` no Compose; keys `devkey`/`secret` só para ambiente local.
- PWA cacheia apenas o shell estático (`sw.js`); **não** cacheia API, PHI nem tokens.
- ADRs em [docs/architecture/adrs/](docs/architecture/adrs/).
