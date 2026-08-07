# ADR-003 — Stack NestJS layer-first, React/Vite e JWT

## Status

Aceito (Épicos A–B — CX-001–CX-016)

## Contexto

O case exige TypeScript, API HTTP, ORM + PostgreSQL, autenticação JWT e frontend React, com Docker para subir o ambiente.

## Decisão

1. **Monorepo npm workspaces:** `apps/api` + `apps/web`.
2. **API:** NestJS com Clean Architecture **layer-first** (`app/` · `entities/` · `externals/`), alias `@/*`, Prisma + PostgreSQL.
3. **Auth:** JWT (Passport) + RBAC (`ADMIN` | `ENFERMEIRO` | `MEDICO`); paciente sem conta (capability via link).
4. **Web:** React + Vite; token no `localStorage` (limitação aceita do case).
5. **Compose:** Postgres + API + Web (nginx) + LiveKit `--dev`.

## Consequências

- Domínio testável sem Nest/DB (ports em memória).
- JWT em localStorage simplifica o case e não é hardening de produção.
- Layer-first evita pastas por feature que misturam HTTP e regras.
