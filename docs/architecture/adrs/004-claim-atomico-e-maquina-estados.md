# ADR-004 — Claim atômico e máquina de estados do atendimento

## Status

Aceito (Épico C — CX-020–CX-038)

## Contexto

Dois profissionais podem clicar “Iniciar” no mesmo item da fila. A exclusividade e as transições de status precisam ser garantidas no servidor.

## Decisão

1. **Máquina oficial:** `AGUARDANDO → EM_ANDAMENTO → FINALIZADO`; `CANCELADO` só a partir de `AGUARDANDO`. Fora do grafo → **422**.
2. **Claim:** update atômico no banco (`AGUARDANDO` + `professionalId IS NULL` → `EM_ANDAMENTO` + profissional). Falha → **409** (sem `if` pré-update como fonte de verdade).
3. **Encaminhar:** pai `FINALIZADO` + desfecho `ENCAMINHADO_MEDICO` + filho novo `AGUARDANDO` (nunca `EM_ANDAMENTO` → `AGUARDANDO`).
4. **Um `EM_ANDAMENTO` por profissional** — segundo claim → **409**.

## Consequências

- Concorrência resolvida no adapter Prisma/memória, não na UI.
- Logs estruturados `claim_conflict` (Épico G) para auditoria operacional.
