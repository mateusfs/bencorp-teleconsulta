# Design — Épico J

## Princípios (UI/UX Pro Max)

| Tema | Decisão |
| --- | --- |
| Estilo | Accessible & Ethical — foco operacional clínico |
| Anti-patterns | Neon, purple gradient, motion pesado, cards decorativos sem ação |
| Tipografia | Preferir stack já do app; se adicionar fonte, Fira Sans (UI) — evitar Inter/Roboto “default AI” só se já não houver sistema |
| Informação | Uma job por seção: (1) o que fazer agora (2) o que espera (3) atalhos |
| Cor + texto | Risco/status sempre com **label** (ex. “Vermelho”), nunca só bolinha colorida |
| React | Dados na página/container; snapshot **derivado no render** a partir de `listAtendimentos` (sem `useEffect` só para filtrar) |

## Composição sugerida (`HomePage` clínica)

```text
┌─────────────────────────────────────────────────────────┐
│ BenCorp PAD · {papel}     {email}              [Sair]   │
├─────────────────────────────────────────────────────────┤
│ Agora                                                    │
│  [Retomar atendimento]  (se houver EM_ANDAMENTO próprio) │
│  [Ir para a fila] / [Encaminhados]  [Pacientes]          │
├─────────────────────────────────────────────────────────┤
│ Fila agora                                               │
│  AGUARDANDO N · EM ANDAMENTO N · FINALIZADOS N           │
│  (MEDICO: Encaminhados N)                                │
├─────────────────────────────────────────────────────────┤
│ Maiores esperas (até 5)                                  │
│  nome · risco · espera · → detalhe/fila                  │
├─────────────────────────────────────────────────────────┤
│ Persistência: memory                    (meta, discreto) │
└─────────────────────────────────────────────────────────┘
```

## Dados

- `GET /atendimentos` (filtros mínimos; MEDICO pode 2ª chamada `encaminhadosOnly=true` só para contagem, ou derivar de `encaminhadoDeId` se já vier no item).
- `GET /health` — badge secundário.
- Sem novo use case na API na 1ª fatia, salvo se a listagem for pesada demais (então `GET /atendimentos/resumo` em fatia 2).

## Authz UI

| Papel | Home |
| --- | --- |
| ENFERMEIRO / MEDICO | Cockpit clínico |
| ADMIN | Home admin (usuários) — sem fila |
| Sem sessão | `/login` |

## Referências

- Checklist §6.4 (novo)
- ADR-002 (persistência — só exibição)
- `AGENTS.md` §4 / §7 (ADMIN sem clínico)
