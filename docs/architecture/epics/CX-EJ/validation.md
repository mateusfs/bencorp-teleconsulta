# Validation — Épico J

## DoD (AGENTS.md §11 + CX-120–126)

| Critério | Como verificar |
| --- | --- |
| CX-120–126 | Checklist `[x]`; Vitest `ClinicalHomeView` + `homeSnapshot` |
| ADMIN sem clínico | Login admin → sem contagens/fila/pacientes; sem `listAtendimentos` |
| Authz server-side | Home só consome listagem; API `@Roles(ENFERMEIRO, MEDICO)` |
| Slim / PII | `?slim=true` zera CPF/contato; `toHomeFilaItems` não guarda esses campos |
| Lint/test/build web | Verdes |
| Persistência não é hero | Badge só no rodapé |

## Roteiro manual

1. `enfermeiro@…` — contagens HOJE, CTA fila, retomar se tiver sala.
2. `medico@…` — Encaminhados + CTA `/fila?encaminhados=1`.
3. `admin@…` — só usuários.
4. API memory — badge discreto “memory”.
5. Network: home chama `periodo=HOJE&slim=true`.
6. Teclado: Tab nos CTAs; focus visível.

## Colateral pós-review (mesmo ciclo)

- Chat WS: join após authz do use case; ack `{ ok, code, message }` em `DomainError`.
- Bootstrap API: `ensurePersistenceMode` → `import('./externals/nest/module')`.
- Capturas README em `img/` com token de link ofuscado.
