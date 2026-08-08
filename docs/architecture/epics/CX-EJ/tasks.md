# Tasks — Épico J

## J1 — Estrutura e shell da home clínica
- Refatorar `HomePage.tsx`: ramo clínico vs ADMIN.
- Header com identidade + Sair; seções “Agora”, “Fila agora”, “Maiores esperas”.
- **Tests:** smoke render clínico (Vitest) com user mockado; ADMIN sem seções clínicas.
- CX: 120, 125

## J2 — Snapshot e lista de espera
- Fetch `listAtendimentos` na home clínica; derivar contagens e top-N esperas no render.
- MEDICO: contagem/atalho encaminhados.
- Estados loading / empty / error (`role="alert"`).
- **Tests:** função pura `buildHomeSnapshot(items, userId, topN?)` coberta ≥80% no arquivo.
- CX: 121, 124, 126

## J3 — CTAs e retomar sala
- CTA primário por papel; botão “Retomar” se `EM_ANDAMENTO` do profissional.
- Links existentes `/fila`, `/pacientes`, `/atendimentos/:id`.
- Touch target / focus / contraste alinhados a `App.css` (tokens saúde).
- **Tests:** snapshot unitário “retomar” presente/ausente.
- CX: 122, 123, 126

## J4 — Validate
- `npm run lint -w web` / `npm test -w web` / `npm run build -w web`
- Marcar CX-120–126 no checklist após aceite
- Opcional: Playwright smoke login → home → fila (skill playwright)

## Ordem

J1 → J2 → J3 → J4. Não abrir endpoint novo antes de validar J2 com listagem atual.
