# Uso de IA neste case (CX-105)

A IA (assistentes de código no Cursor) foi usada como **acelerador de implementação e documentação**, sob revisão humana contínua.

## Onde ajudou

- Esqueleto Clean Architecture (contracts, use cases, adapters Prisma/memória)
- Specs Jest alinhados aos aceites CX (409, 422, 403, tokens, auditoria)
- Telas React da fila, sala, pacientes e PWA mínima
- ADRs, README e preenchimento do `case-checklist.md`
- Refinos de tipagem estrita (sem `any`) e lint

## O que permaneceu decisão humana / domínio

- Máquina de estados e claim atômico → 409
- ADMIN sem acesso clínico
- Paciente ≠ User (link capability-based)
- Imutabilidade de prontuário + adendo
- Escopo de telepresença (TTL, revoke, single-use)
- Escolha stack Nest layer-first + LiveKit + modos de persistência

## Controle de qualidade

Toda alteração relevante passou por `lint`, testes automatizados (cobertura ≥ 80% nos módulos sob teste) e build de API/web antes de avançar o checklist.
