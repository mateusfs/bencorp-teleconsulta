# ADR-002 — Persistência em memória e write-behind

## Status

Aceito (Épico I — CX-110–CX-116)

## Contexto

Avaliadores e demos locais podem não ter PostgreSQL. O case exige Postgres + Prisma em entrega completa, mas a demonstração da UI/API não deve travar sem banco.

## Decisão

`PERSISTENCE_MODE`:

| Modo | Comportamento |
| --- | --- |
| *(omitido)* | Sonda TCP do `DATABASE_URL`; se responder → `postgres`, senão → `memory` |
| `postgres` | Adapters Prisma (entrega / Compose completo) |
| `memory` | Adapters em memória; seed local; sem conexão Prisma |
| `write-behind` | Memória como fonte da request; após a resposta HTTP, flush best-effort para Postgres |

Ports (`*Repository`) permanecem iguais; só o composition root escolhe o adapter. Vídeo usa `LiveKitVideoRoomProvider` também em `memory`/`write-behind` (SFU via Compose/`LIVEKIT_*`); o `FakeVideoRoomProvider` fica só em testes unitários.

## Consequências

- Demo local: `npm run dev:api` sem Postgres sobe em memória; com Postgres no ar usa Prisma.
- O bootstrap chama `ensurePersistenceMode` **antes** do `import()` dinâmico do `AppModule`, para o composition root (`buildPersistenceProviders`) ler o modo já resolvido.
- Compose continua com `PERSISTENCE_MODE=postgres` explícito.
- Dados em memória são voláteis (reinício zera o estado).
- Write-behind não garante durabilidade se o processo cair antes do flush.
- Produção / avaliação com stack completa: `postgres`.
