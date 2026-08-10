# Tasks — Épico J

Status: **concluído** (CX-120–126).

## J1 — Estrutura e shell da home clínica ✅
- `HomePage` → `ClinicalHomeView` / `AdminHomeView`
- Header, seções Agora / Fila agora / Maiores esperas
- Vitest: ADMIN sem clínico / Pacientes

## J2 — Snapshot e lista de espera ✅
- `listAtendimentos({ periodo: 'HOJE', slim: true })`
- `buildHomeSnapshot` + contagens / top-5 / encaminhados
- loading / empty / `role="alert"`

## J3 — CTAs e retomar sala ✅
- ENFERMEIRO → `/fila`; MEDICO → `/fila?encaminhados=1`
- Retomar → `/atendimentos/:id`
- CTAs ≥44px em `App.css`

## J4 — Validate ✅
- Lint / Vitest / build web
- Checklist CX-120–126 marcados
- Colateral: `?slim=true` na API + specs gateway/chat

## Ordem executada

J1 → J2 → J3 → J4. Sem endpoint `/resumo`.
