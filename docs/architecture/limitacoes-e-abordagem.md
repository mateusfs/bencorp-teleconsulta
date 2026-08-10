# Limitações técnicas e abordagem escolhida

Documento de entrega do Case BenCorp (CX-104 / CX-105). Complementa o [README](../../README.md) e os [ADRs](./adrs/).

## Abordagem

- Monólito modular com Clean Architecture layer-first na API (`apps/api`: `entities` → `app` ← `externals`).
- Front React/Vite: login, admin, **home clínica** (Épico J), fila, sala, pacientes, sala do paciente por link.
- Persistência: Compose/entrega em `postgres`; local sem banco sobe em `memory` via sonda automática (`ensurePersistenceMode`). Modos `memory` / `write-behind` são demo (Épico I / ADR-002).
- Telepresença: LiveKit self-hosted + chat Socket.IO (ack com códigos de domínio) + link opaco do paciente (uso único).
- Home clínica: snapshot derivado de `GET /atendimentos?periodo=HOJE&slim=true` (contagens, retomar sala, maiores esperas); ADMIN só gestão de usuários.

## Limitações conscientes

| Área | Limitação |
| --- | --- |
| Auth front | JWT no `localStorage` — aceitável no case, não produção |
| PWA | Cache só do shell estático; SW registrado só em produção; sem offline de PHI/API |
| LiveKit | Compose em `--dev` com `devkey`/`secret` |
| Prontuário | Escopo do case (queixa, vitais, conduta, prescrição, adendo); sem CID/TISS |
| Memória | Volátil; não substitui Postgres na avaliação completa |
| Write-behind | Best-effort; perda possível se o processo cair antes do flush |
| Home / fila slim | Snapshot do dia com limite da listagem; `slim` omite CPF/contato — a fila completa ainda os expõe na tela de fila |
| Rate limit | Não implementado (fora do escopo dos épicos) |
| Observabilidade | Logs estruturados HTTP + authz/claim; sem APM/tracing |
| Multi-tenant | Fora de escopo |
| Assistência à codificação | Permitido pelo case; revisão humana (ver CX-105) |

## O que não faz parte da entrega

- Integrações TASY/AFIP/ICE
- App nativo mobile
- Hardening de produção (WAF, rotação de secrets, HSTS estrito, etc.)
- Endpoint dedicado de “resumo” da home (agregação fica no cliente sobre a listagem autorizada)
