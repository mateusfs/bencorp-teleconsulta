# Design — Épico J

## Status de implementação

Entregue em `apps/web` com apoio mínimo na API (`?slim=true` na listagem).

| Peça | Onde |
| --- | --- |
| Container | `HomePage.tsx` — health + `listAtendimentos({ periodo: 'HOJE', slim: true })` |
| Views | `ClinicalHomeView` / `AdminHomeView` |
| Snapshot puro | `homeSnapshot.ts` + `homeUi.ts` (`toHomeFilaItems`, `persistenceLabel`, `encaminhadosOnlyFromSearch`) |
| Fila MEDICO | `FilaAtendimentoPage` lê `?encaminhados=1` |
| API slim | `ListarFilaQueryDto.slim` → `omitPatientPii` no use case (CPF/contato vazios) |

## Princípios (UI)

| Tema | Decisão |
| --- | --- |
| Estilo | Cockpit operacional clínico; badge de persistência só no rodapé |
| Informação | Uma job por seção: (1) agora (2) contagens (3) maiores esperas |
| Cor + texto | Risco/status com **label** (ex. “Vermelho”) |
| A11y | loading / empty / `role="alert"` no erro; CTAs ≥44px |

## Composição (`ClinicalHomeView`)

```text
┌─────────────────────────────────────────────────────────┐
│ BenCorp PAD · {papel}     {email}              [Sair]   │
├─────────────────────────────────────────────────────────┤
│ Agora                                                    │
│  [Retomar sala — nome]  (EM_ANDAMENTO do profissional)   │
│  [Ir para a fila] / [Encaminhados / fila]  [Pacientes]   │
├─────────────────────────────────────────────────────────┤
│ Fila agora                                               │
│  AGUARDANDO N · EM ANDAMENTO N · FINALIZADOS N           │
│  (MEDICO: Encaminhados N via encaminhadoDeId)            │
├─────────────────────────────────────────────────────────┤
│ Maiores esperas (até 5)                                  │
│  nome · risco · espera · Abrir                           │
├─────────────────────────────────────────────────────────┤
│ Persistência: …                         (meta, discreto) │
└─────────────────────────────────────────────────────────┘
```

ADMIN: só “Gerenciar usuários” + badge opcional — sem fetch de fila.

## Dados

- `GET /atendimentos?periodo=HOJE&slim=true` — uma chamada; contagens e top-5 no cliente.
- `GET /health` — badge secundário.
- Sem endpoint `/resumo` (limitação documentada).

## Authz UI

| Papel | Home |
| --- | --- |
| ENFERMEIRO / MEDICO | Cockpit clínico |
| ADMIN | Home admin (usuários) — sem fila/pacientes |
| Sem sessão | `/login` |

## Referências

- Checklist §6.4
- ADR-002 (persistência — só exibição)
- `AGENTS.md` §4 / §7 (ADMIN sem clínico)
