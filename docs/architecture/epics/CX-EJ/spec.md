# Spec — Épico J (Home clínica)

## Contexto

A home (`/`) pós-login é o ponto de entrada diário do profissional. Hoje é um dump de links + modo de persistência. O case já entrega fila, pacientes e sala; a home deve **orquestrar** esses fluxos.

## Personas

| Papel | Necessidade na home |
| --- | --- |
| ENFERMEIRO | Ver quem espera, iniciar/triar, retomar atendimento próprio |
| MEDICO | Ver encaminhados + fila geral, retomar atendimento próprio |
| ADMIN | Sem dados clínicos — só gestão de usuários (inalterado no essencial) |

## CX cobertos

| ID | Título | Aceite mensurável |
| --- | --- | --- |
| CX-120 | Layout de home clínica | ENFERMEIRO/MEDICO veem cockpit com header (identidade + sair), área de ações e painel operacional — não apenas lista de links |
| CX-121 | Snapshot da fila | Contagens derivadas da fila autorizada: pelo menos `AGUARDANDO`, `EM_ANDAMENTO`, `FINALIZADO` (período/lista atual); texto + número (não só cor) |
| CX-122 | Próximas ações por papel | ENFERMEIRO: CTA primário para Fila (+ opcional Pacientes). MEDICO: CTA primário para Encaminhados/Fila + Pacientes. Alvos ≥44px, `cursor-pointer` |
| CX-123 | Retomar atendimento ativo | Se existir `EM_ANDAMENTO` com `professionalId` = usuário logado, destaque “Retomar sala” → `/atendimentos/:id` |
| CX-124 | Lista curta de espera | Até N (ex. 5) itens `AGUARDANDO` ordenados por espera (maior primeiro), com nome, risco (label+cor), tempo; link “Ver fila completa” |
| CX-125 | Persistência secundária + ADMIN | Badge `/health` em posição secundária (não hero). ADMIN sem snapshot clínico nem links de fila/pacientes |
| CX-126 | A11y e estados | Contraste legível, focus visível, `aria-live` em erro de carga; loading/empty/error explícitos; sem emoji como ícone |

## Must-not

- Home não é fonte de verdade de authz (API continua gate).
- Não expor CPF/contato na home (`slim=true` + projeção local).
- ADMIN não consome listagem clínica na home.

## Dependências

- CX-027–CX-033 (fila), CX-038 (encaminhados), CX-080–CX-085 (pacientes), CX-115 (health badge — reposicionar).
