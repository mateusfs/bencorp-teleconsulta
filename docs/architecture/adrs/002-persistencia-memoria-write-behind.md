# ADR-002 — Persistência em memória e write-behind

## Status

Aceito (Épico I — CX-110–CX-116)

## Contexto

Avaliadores e demos locais podem não ter PostgreSQL. O case exige Postgres + Prisma em entrega completa, mas a demonstração da UI/API não deve travar sem banco.

## Decisão

`PERSISTENCE_MODE`:

| Modo | Comportamento |
| --- | --- |
| `postgres` | Adapters Prisma (padrão de entrega / Compose completo) |
| `memory` | Adapters em memória; seed local; sem conexão Prisma |
| `write-behind` | Memória como fonte da request; após a resposta HTTP, flush best-effort para Postgres |

Ports (`*Repository`) permanecem iguais; só o composition root escolhe o adapter. Vídeo usa `LiveKitVideoRoomProvider` também em `memory`/`write-behind` (SFU via Compose/`LIVEKIT_*`); o `FakeVideoRoomProvider` fica só em testes unitários.

## Consequências

- Demo: `npm run dev:api:memory` (ou `scripts/dev-memory.sh`) com LiveKit no ar + web.
- Dados em memória são voláteis (reinício zera o estado).
- Write-behind não garante durabilidade se o processo cair antes do flush.
- Produção / avaliação com stack completa: `postgres`.
