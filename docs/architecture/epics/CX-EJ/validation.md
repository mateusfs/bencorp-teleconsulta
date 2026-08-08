# Validation — Épico J

## DoD (AGENTS.md §11 + CX)

| Critério | Como verificar |
| --- | --- |
| CX-120–126 com aceite | Checklist marcado só após demo manual + testes |
| ADMIN sem clínico | Login admin → sem contagens/fila/pacientes |
| Authz server-side | Home quebra se token inválido; API 401/403 inalterados |
| Lint/test/build web | Verdes |
| Sem `any` / sem eslint-disable | Diff limpo |
| Persistência não é hero | Badge só no rodapé/meta |

## Roteiro manual

1. `enfermeiro@…` — vê AGUARDANDO, CTA fila, retomar se tiver sala.
2. `medico@…` — vê encaminhados + CTAs.
3. `admin@…` — só usuários; sem snapshot.
4. API memory — badge discreto “memory”.
5. Teclado: Tab percorre CTAs; focus visível.

## Pós-épico

`/pr-review` no diff web do dashboard.
