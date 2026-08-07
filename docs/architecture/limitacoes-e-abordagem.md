# Limitações técnicas e abordagem escolhida

Documento de entrega do Case BenCorp (CX-104). Complementa o [README](../../README.md) e os [ADRs](./adrs/).

## Abordagem

- Monólito modular com Clean Architecture layer-first na API.
- Front React/Vite focado nas telas do checklist (login, admin, fila, sala, pacientes).
- Persistência padrão Postgres/Prisma; modos `memory` / `write-behind` só para demo (Épico I).
- Telepresença com LiveKit self-hosted + chat Socket.IO + link opaco do paciente.

## Limitações conscientes

| Área | Limitação |
| --- | --- |
| Auth front | JWT no `localStorage` — aceitável no case, não produção |
| PWA | Cache só do shell estático; sem offline de PHI/API |
| LiveKit | Compose em `--dev` com `devkey`/`secret` |
| Prontuário | Escopo do case (queixa, vitais, conduta, prescrição, adendo); sem CID/TISS |
| Memória | Volátil; não substitui Postgres na avaliação completa |
| Write-behind | Best-effort; perda possível se o processo cair antes do flush |
| Rate limit | Não implementado (fora do escopo dos épicos) |
| Observabilidade | Logs estruturados HTTP + authz/claim; sem APM/tracing |
| Multi-tenant | Fora de escopo |

## O que não faz parte da entrega

- Integrações TASY/AFIP/ICE
- App nativo mobile
- Hardening de produção (WAF, rotação de secrets, HSTS estrito, etc.)
