# AGENTS.md — BenCorp Teleconsulta PAD

Fonte de regra do case técnico BenCorp (Benefícios & Saúde Ocupacional). Precedência sobre hábitos genéricos de template.

## 1. Escopo

- Entregar a plataforma simplificada de teleconsulta (PAD) conforme `docs/architecture/case-checklist.md`.
- Docs normativas: `docs/architecture/domain-analysis.md`, `docs/architecture/api-clean-architecture.md`, `docs/architecture/case-checklist.md`.
- Prazo externo: devolução até 10/08/2026.

## 2. Stack

| Parte | Tecnologia |
| --- | --- |
| API | NestJS + TypeScript estrito + Prisma + PostgreSQL + JWT |
| Web | React + Vite (+ PWA no épico correspondente) |
| Vídeo | LiveKit (Compose); tokens só no Épico E |
| Forma | Monólito; Clean Architecture **layer-first** em `apps/api` |

Workspaces npm: `apps/api`, `apps/web`.

## 3. Backend — Clean Architecture (bloqueante)

Dependência: `externals/nest → app/use-cases → entities ← externals (via contracts)`.

- Pastas canônicas em `apps/api/src`: `app/` (contracts + use-cases), `entities/`, `externals/`.
- `entities/` não importa Nest, Prisma, HTTP, SDK LiveKit.
- Use cases em `app/use-cases/<nome>/` (um diretório por intenção); dependem de **contracts** (ports), não de adapters.
- Prisma/LiveKit/JWT concreto só em `externals/`.
- Controllers/guards/filters em `externals/nest`; composition root em `externals/nest/module.ts`.
- Imports: alias `@/*` → `src/*`. Ex.: `@/entities/usuario`, `@/app/use-cases/criar-usuario`. Sem `../../` entre camadas.

## 4. Frontend

- React + Vite; sem `any`.
- Token JWT no `localStorage` é limitação aceita e documentada no README (não é hardening de produção).
- ADMIN não deve ter navegação clínica na UI.
- Paciente **não** tem login — acesso à sala por link (Épico E).

## 5. Contratos e erros HTTP do case

| Situação | Status |
| --- | --- |
| Não autenticado | 401 |
| Sem permissão / link cruzado | 403 |
| Claim concorrente / exclusividade | 409 (no banco, não `if` pré-update) |
| Transição de estado inválida / imutabilidade | 422 |

## 6. Clean code

- Sem comentários narrativos; nomes claros.
- Sem `any`, sem `eslint-disable`, sem `overrides` no `package.json`.
- Diff alinhado ao pedido; sem gold-plating.

## 7. Regras que nunca se quebra (🚨)

1. Autorização **server-side** (anti-IDOR); frontend não é fonte de verdade.
2. ADMIN **nunca** acessa prontuário/histórico clínico.
3. Paciente ≠ User (sem conta de login).
4. Claim de “Iniciar atendimento” atômico no banco → 409.
5. Máquina de estados oficial; fora do grafo → 422.
6. Prontuário finalizado imutável; correção só por adendo.
7. Toda leitura de prontuário gera auditoria (who/when/patient/endpoint).
8. Sala/tokens só em `EM_ANDAMENTO`; TTL ≤ 15 min; revoke ao finalizar; link paciente uso único.
9. Encaminhar = `FINALIZADO` + desfecho `ENCAMINHADO_MEDICO` + filho `AGUARDANDO` (nunca `EM_ANDAMENTO` → `AGUARDANDO`).
10. Sem `any` / sem desligar lint / sem `overrides`.
11. Testes automatizados verdes; cobertura ≥ 80% nos módulos de regras sob teste.
12. Não commitar segredos (`.env` no `.gitignore`; `.env.example` só placeholders).

## 8. Segurança e dados de saúde

- Não logar CPF, prontuário ou tokens em claro.
- Seed usa dados fictícios.
- Validação de DTO na borda HTTP (`class-validator`).
- Rate limit / hardening avançado: documentar como limitação se fora do épico atual.

## 9. Testes e qualidade

Scripts na API: `npm run lint`, `npm test`, `npm run test:cov`, `npm run build`.
Preferir testes de entities/use-cases com ports em memória (sem Nest/DB).

## 10. Entrega

README com local + Docker; ADRs/trade-offs; Dockerfile; limitações e uso de IA documentados (épico H).

## 11. Definition of Done (épico)

- Itens CX do checklist do épico marcados com aceite mensurável.
- Lint + testes + build verdes.
- Authz negativa coberta onde o case exige (403/409/422).
- Sem violação da §7.
