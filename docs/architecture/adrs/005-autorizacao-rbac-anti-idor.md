# ADR-005 — Autorização server-side (RBAC e anti-IDOR)

## Status

Aceito (Épicos B–F — CX-010+, CX-046, CX-048–049, CX-084)

## Contexto

Dados clínicos (prontuário, pacientes, sala) não podem vazar por IDOR ou por papel `ADMIN` na UI/API.

## Decisão

1. **Fonte de verdade:** guards JWT + Roles + regras nos use cases; frontend só esconde navegação.
2. **ADMIN:** gerencia usuários; **nunca** lista pacientes clínicos, prontuário ou sala.
3. **Leitura de prontuário:** sempre registra auditoria (who / when / patientId / endpoint), inclusive no detalhe do paciente.
4. **Link do paciente:** uso único; link de outro atendimento → **403**.
5. **Prontuário finalizado:** imutável; correção só via adendo.

## Consequências

- Cenários negativos cobertos por testes (403/409/422).
- Logs `authz_denied` no filtro de domínio (Épico G).
