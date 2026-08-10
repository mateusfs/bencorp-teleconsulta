# Análise de Domínio — Case BenCorp Teleconsulta (PAD)

- **Fonte:** CASE TÉCNICO – DEV FULLSTACK SÊNIOR – BENCORP (PDF)
- **Espaço:** problem space alinhado à implementação em `apps/api` / `apps/web`
- **Método:** DDD Strategic Design — subdomínios + Bounded Contexts
- **Atualizado:** 2026-08-10 (inclui home clínica / Épico J)
- **Status:** Aceito como linguagem do repositório

---

## 1. Contexto do negócio

A BenCorp (Benefícios & Saúde Ocupacional) pede uma plataforma simplificada de **teleconsulta / Pronto Atendimento Digital (PAD)** em que profissionais de saúde atendem pacientes por vídeo, registram prontuário e respeitam regras rígidas de **autorização, concorrência, máquina de estados, imutabilidade clínica e auditoria**.

O diferencial competitivo do case (e do produto real análogo) não é o vídeo em si — é **garantir que dado clínico e sala só existam sob autorização explícita no backend**, com exclusividade de atendimento e trilha de auditoria.

---

## 2. Mapa de conceitos (Ubiquitous Language)

| Termo | Definição neste domínio |
| --- | --- |
| **PAD** | Pronto Atendimento Digital — fila e fluxo de atendimento remoto |
| **Atendimento** | Unidade de trabalho clínico com ciclo de vida (`AGUARDANDO` → `EM_ANDAMENTO` → `FINALIZADO` / `CANCELADO`) |
| **Profissional** | Usuário autenticado com papel `ENFERMEIRO` ou `MEDICO` |
| **Paciente** | Pessoa atendida; **não possui login**; entra na sala por link temporário |
| **Fila** | Visão operacional dos atendimentos com filtros (nome/CPF, status, período) |
| **Painel clínico (home)** | Cockpit pós-login do profissional: próximas ações, contagens da fila do dia, maiores esperas, retomar sala |
| **Classificação de risco** | Atributo clínico/operacional exibido na fila |
| **Triagem** | Avaliação inicial feita pelo enfermeiro; pode resultar em encaminhamento ao médico |
| **Encaminhar ao médico** | Desfecho intermediário do enfermeiro que disponibiliza o caso ao médico |
| **Prontuário** | Registro clínico do atendimento; após finalização torna-se **imutável** |
| **Adendo** | Correção posterior ao prontuário finalizado, com autor e timestamp próprios |
| **Sala de atendimento** | Composição de vídeo + chat + formulário de prontuário, válida só em `EM_ANDAMENTO` |
| **Token de sala** | Credencial de curto TTL (≤ 15 min) emitida pelo backend, ligada a atendimento + participante |
| **Link do paciente** | Token opaco, expirável, uso controlado; revogado ao finalizar; 403 se de outro atendimento |
| **Auditoria de prontuário** | Log obrigatório de quem acessou, quando, qual paciente e qual endpoint |
| **ADMIN** | Gestão de usuários/permissões; **proibido** acessar prontuário clínico |

### Papéis (personas de linguagem)

| Papel | Capacidade de negócio |
| --- | --- |
| ENFERMEIRO | Acessa fila PAD, inicia atendimento, realiza triagem, encaminha ao médico |
| MEDICO | Acessa fila PAD, vê encaminhados, emite prescrição, completa prontuário |
| ADMIN | Gerencia usuários e permissões; sem acesso clínico |
| PACIENTE | Sem login; acessa sala via link temporário |

---

## 3. Classificação de subdomínios

Árvore aplicada a cada capacidade:

```
É vantagem competitiva / regra diferenciadora do case?
  SIM → Core Domain
  NÃO → Exige conhecimento específico do negócio de saúde/PAD?
        SIM → Supporting Subdomain
        NÃO → Generic Subdomain
```

### 3.1 Domain: Atendimento PAD (Fila + Ciclo de Vida)

**Type:** Core Domain

**Ubiquitous Language:** Atendimento, Fila, AGUARDANDO, EM_ANDAMENTO, FINALIZADO, CANCELADO, Iniciar Atendimento, Encaminhar, Exclusividade, 409, 422

**Business Capability:** Orquestrar o ciclo de vida do atendimento com exclusividade de profissional e transições válidas — coração do case.

**Key Concepts:**

- Atendimento (Entity) — agregado raiz do fluxo operacional
- StatusAtendimento (Value Object / enum) — estados do grafo
- FilaPAD (Read Model / UseCase) — listagem com filtros e tempo de espera
- IniciarAtendimento (UseCase) — claim atômico no banco → 409 em conflito
- TransicionarStatus (UseCase) — máquina de estados → 422 fora do grafo
- EncaminharAoMedico (UseCase) — desfecho de triagem de enfermagem
- FinalizarAtendimento (UseCase) — fecha caso e dispara invalidações
- CancelarAtendimento (UseCase) — só a partir de AGUARDANDO

**Suggested Bounded Context:** `AtendimentoContext`

- Linguistic boundary: “Atendimento” = unidade de trabalho na fila PAD com máquina de estados
- Integration: publica fatos de ciclo de vida para Prontuário, Sala e Auditoria; consome identidade do profissional

**Dependencies:**

- → Identity & Access (quem é o profissional e qual papel)
- → Prontuário Clínico (abertura/fechamento do registro)
- → Sala de Telepresença (criar/destruir sala conforme status)
- ← Paciente (referência ao paciente da fila)

**Cohesion Score:** 9/10  
(Linguistic 3 + Usage 3 + Data 2 + Change 1 = 9 — mudança de status ripple em sala/prontuário, mas o vocabulário e as regras de exclusividade coesionam fortemente aqui)

---

### 3.2 Domain: Prontuário Clínico

**Type:** Core Domain

**Ubiquitous Language:** Prontuário, Triagem, Sinais vitais, Classificação de risco, Prescrição, Imutabilidade, Adendo, Histórico clínico

**Business Capability:** Registrar, proteger e evoluir informação clínica com imutabilidade pós-finalização e correção apenas por adendo.

**Key Concepts:**

- Prontuario (Entity / Aggregate) — registro clínico ligado ao atendimento
- Adendo (Entity) — correção com autor + timestamp próprios
- SinaisVitais (Value Object)
- ClassificacaoRisco (Value Object / enum)
- Prescricao (Value Object / Entity subordinada — médico)
- AcessarProntuario (UseCase) — leitura autorizada + emissão de audit log
- FinalizarProntuario (UseCase) — congela conteúdo
- CriarAdendo (UseCase) — única via de correção pós-finalização

**Suggested Bounded Context:** `ProntuarioContext`

- Linguistic boundary: “Prontuário” = artefato clínico versionado por imutabilidade+adendo (não confundir com “atendimento”)
- Integration: Customer/Supplier de Atendimento (status FINALIZADO congela); Open Host para consultas de histórico do paciente; toda leitura passa por política de auditoria

**Dependencies:**

- → Atendimento (vínculo e gatilho de imutabilidade)
- → Identity & Access (autor + autorização; ADMIN bloqueado)
- → Auditoria de Acesso Clínico (obrigatória em toda leitura)
- ← Pacientes (histórico agregado na visão do paciente)

**Cohesion Score:** 9/10

**Nota estratégica:** Em produto real de saúde, Prontuário costuma ser Core. No case, Atendimento (concorrência/estado) e Prontuário (imutabilidade/auditoria) são **dois núcleos** — ambos Core. Não fundir em um único modelo global: “finalizar atendimento” ≠ “imutabilizar prontuário”, embora sejam coordenados.

---

### 3.3 Domain: Sala de Telepresença (Vídeo + Chat da sessão)

**Type:** Supporting Subdomain (orquestração de sessão) + Generic (engine de mídia)

**Ubiquitous Language:** Sala, Token de sala, TTL, Link do paciente, Revogação, Chat do atendimento, Participante

**Business Capability:** Permitir presença síncrona (vídeo/chat) **somente** enquanto o atendimento está `EM_ANDAMENTO`, com credenciais emitidas e revogadas pelo backend.

**Key Concepts:**

- SalaAtendimento (Entity / Session) — existe só em EM_ANDAMENTO
- TokenSala (Value Object) — TTL ≤ 15 min, renovável, scoped a atendimento+participante
- LinkPaciente (Entity) — token opaco, expirável, single-use/revogável
- EmitirTokenSala (UseCase)
- RenovarTokenSala (UseCase)
- RevogarTokensDaSala (UseCase) — ao finalizar
- MensagemChat (Entity) — mensagem textual da sessão
- ProvedorVideo (Port) — LiveKit / Jitsi / Daily (Generic)

**Subdomains:**

1. Orquestração de Sala (Supporting)
   - Concepts: SalaAtendimento, TokenSala, LinkPaciente, Revogação
   - Cohesion: 8/10
   - Dependencies: → Atendimento (status), → Identity (participante)
2. Engine de Mídia (Generic)
   - Concepts: room provider, SFU, SDK
   - Cohesion: n/a (commodity)
   - Dependencies: Anti-Corruption Layer em torno do provedor

**Suggested Bounded Context:** `TelepresencaContext`

- Linguistic boundary: “Sala” = sessão autorizada de mídia+chat de um atendimento; não é o atendimento em si
- Integration: Conformist/ACL com provedor externo; Customer de Atendimento (status manda)

**Dependencies:**

- → Atendimento (ciclo de vida manda criar/destruir)
- → Identity & Access (profissional JWT; paciente via link)
- → Provedor de vídeo externo (Generic)

**Cohesion Score:** 7/10  
(Chat persistido vs. mídia externa puxam em direções diferentes — manter portas claras)

---

### 3.4 Domain: Identity & Access

**Type:** Supporting Subdomain

**Ubiquitous Language:** Usuário, Papel (ENFERMEIRO, MEDICO, ADMIN), Permissão, JWT, Autorização explícita, PACIENTE-sem-login

**Business Capability:** Autenticar profissionais/admin e autorizar cada rota/dado/sala independentemente do frontend. Paciente autentica-se por **capacidade** (link), não por conta.

**Key Concepts:**

- Usuario (Entity)
- Papel (Value Object / enum)
- CredencialJWT (Value Object)
- PoliticaAutorizacao (Domain Service / Policy)
- GerenciarUsuario (UseCase — ADMIN)
- AutenticarProfissional (UseCase)
- AutorizarAcessoRecurso (Domain Service) — IDOR prevention

**Suggested Bounded Context:** `IdentityAccessContext`

- Linguistic boundary: “Usuário” aqui = conta com papel; Paciente **não** é usuário deste contexto
- Integration: Open Host Service para os demais contextos (guards/policies)

**Dependencies:**

- ← Atendimento, Prontuário, Telepresença, Admin UI (consomem políticas)
- → (nenhuma dependência de domínio de negócio)

**Cohesion Score:** 8/10

---

### 3.5 Domain: Auditoria de Acesso Clínico

**Type:** Supporting Subdomain

**Ubiquitous Language:** Audit log, Quem, Quando, Qual paciente, Qual endpoint, Acesso a prontuário

**Business Capability:** Rastreabilidade obrigatória de todo acesso a prontuário (compliance + requisito do case).

**Key Concepts:**

- RegistroAuditoria (Entity) — who / when / patientId / endpoint
- RegistrarAcessoProntuario (UseCase / Domain Event Handler)

**Suggested Bounded Context:** `AuditoriaContext` (pode ser módulo dedicado; persistência própria recomendada)

- Linguistic boundary: “Acesso” = evento de leitura/consulta clínica auditável — não confundir com login
- Integration: Published Language via eventos/hooks do ProntuarioContext

**Dependencies:**

- ← ProntuarioContext (emissor)
- → Identity (atribuir “quem”, inclusive negativa de ADMIN)

**Cohesion Score:** 8/10

---

### 3.6 Domain: Cadastro de Pacientes (visão e busca)

**Type:** Supporting Subdomain

**Ubiquitous Language:** Paciente, CPF, Contato, Histórico de atendimentos, Busca por nome/CPF

**Business Capability:** Identificar o paciente na fila e oferecer visão de histórico (atendimentos, sinais vitais, prontuários anteriores) para profissionais autorizados.

**Key Concepts:**

- Paciente (Entity)
- BuscarPaciente (UseCase)
- VisaoHistoricoPaciente (Read Model) — agrega Atendimento + Prontuário

**Suggested Bounded Context:** `PacienteContext`

- Linguistic boundary: “Paciente” = pessoa do cuidado; sem credencial de login
- Integration: Customer/Supplier — Atendimento referencia Paciente; histórico é composição read-model (não ownership do prontuário)

**Dependencies:**

- → ProntuarioContext (leitura autorizada + auditada)
- → AtendimentoContext (histórico de atendimentos)
- → IdentityAccessContext (somente ENFERMEIRO/MEDICO)

**Cohesion Score:** 7/10  
(Read model cruza contextos — risco de virar “all-inclusive model” se não for tratado como projeção)

---

### 3.7 Domain: Administração de Contas

**Type:** Supporting Subdomain (fino) / quase Generic de IAM UI

**Ubiquitous Language:** ADMIN, usuários, permissões

**Business Capability:** CRUD/gestão de usuários e papéis, **sem** acesso a prontuário.

**Key Concepts:**

- GerenciarUsuarios (UseCase)
- AtribuirPapel (UseCase)

**Suggested Bounded Context:** permanece dentro de `IdentityAccessContext` (não merece BC separado no escopo do case)

**Cohesion Score:** 6/10 (se misturado com clínico → risco alto; isolado no IAM → ok)

---

### 3.8 Domínios Generic (comprar / adotar)

| Capacidade | Type | Decisão |
| --- | --- | --- |
| Engine de vídeo (SFU/rooms) | Generic | LiveKit / Jitsi / Daily via porta |
| Autenticação JWT (mecanismo) | Generic | Biblioteca/padrões da stack |
| Persistência PostgreSQL | Generic | Infra |
| PWA (manifest + service worker) | Generic | Capacidade de entrega web |
| Containerização Docker | Generic | Entrega/ops |

Esses **não** definem linguagem de negócio; entram como adapters/infra.

---

## 4. Bounded Context Map

```text
┌──────────────────────┐
│ IdentityAccessContext│◀── JWT / policies ──┐
│ (Supporting)         │                     │
└─────────┬────────────┘                     │
          │ autoriza                         │
          ▼                                  │
┌──────────────────────┐     ciclo de vida    │
│  AtendimentoContext  │──────────────────┐  │
│  ★ CORE              │                  │  │
└─────────┬────────────┘                  │  │
          │ ref paciente                  │  │
          ▼                               ▼  │
┌──────────────────────┐     ┌────────────────────────┐
│   PacienteContext    │     │  TelepresencaContext   │
│  (Supporting)        │     │  (Supporting + Generic │
└─────────┬────────────┘     │   video provider)      │
          │ histórico        └────────────────────────┘
          ▼
┌──────────────────────┐     eventos de acesso
│  ProntuarioContext   │──────────────────────────────►┌─────────────────┐
│  ★ CORE              │                               │ AuditoriaContext│
└──────────────────────┘                               │ (Supporting)    │
                                                       └─────────────────┘
```

### Contextos sugeridos (implementação — Clean Architecture layer-first)

| Bounded Context | Contém subdomínios | Onde vive no código |
| --- | --- | --- |
| `IdentityAccessContext` | Identity & Access + Admin | `entities/usuario*`, `app/use-cases/*-usuario*`, `externals/nest/controllers/{auth,users}`, `externals/cryptography` |
| `AtendimentoContext` | Fila + máquina de estados + exclusividade | `app/use-cases/*-atendimento*`, `entities/atendimento*`, controllers `atendimento` |
| `ProntuarioContext` | Prontuário + adendo + imutabilidade | `app/use-cases/*-prontuario*`, controllers `prontuarios` |
| `PacienteContext` | Cadastro + read models de histórico | `entities/paciente`, use cases futuros |
| `TelepresencaContext` | Sala, tokens, link paciente, chat + ACL do provedor | use cases de sala/token + `externals` de vídeo |
| `AuditoriaContext` | Audit log clínico | use cases + persistence de auditoria |

**Implementação recomendada para o case:** monólito (um deploy Docker) com **Clean Architecture layer-first** — pastas raiz = `app` · `entities` · `externals`. Nest é composition root, não dono da regra. Detalhe: [api-clean-architecture.md](./api-clean-architecture.md). Microsserviços ficam fora do escopo (YAGNI).

---

## 5. Padrões de integração entre contextos

| Upstream → Downstream | Padrão | Contrato |
| --- | --- | --- |
| Identity → todos | Open Host Service | Guards/policies; papéis explícitos |
| Atendimento → Telepresença | Customer/Supplier | Status `EM_ANDAMENTO` cria sala; `FINALIZADO` revoga tokens |
| Atendimento → Prontuário | Customer/Supplier | Finalização congela prontuário |
| Prontuário → Auditoria | Domain Event / Published Language | Todo acesso emite `ProntuarioAcessado` |
| Paciente → Atendimento/Prontuário | Conformist (IDs) + Read Model | Histórico é projeção; Paciente não “dona” o prontuário |
| Telepresença → Provedor vídeo | Anti-Corruption Layer | Port `VideoRoomProvider`; tokens próprios do app além dos do vendor |

### Shared Kernel (usar com parcimônia)

Aceitável compartilhar apenas:

- IDs (`AtendimentoId`, `PacienteId`, `UsuarioId`)
- Enums de papel e status **se** versionados num pacote `shared/domain-ids` sem regras

Não compartilhar entidades de prontuário com admin/UI genérica.

---

## 6. Matriz de coesão cruzada

| Domain A | Domain B | Cohesion | Issue | Recommendation |
| --- | --- | --- | --- | --- |
| Atendimento | Prontuário | 6/10 | ⚠️ Coordenação de finalização | Orquestrar via application service/evento; não fundir aggregates |
| Atendimento | Telepresença | 5/10 | ⚠️ Sala acoplada a status | Telepresença só reage a status; Atendimento não conhece LiveKit |
| Prontuário | Auditoria | 8/10 | ✅ | Hook obrigatório em toda leitura |
| Prontuário | Identity | 3/10 | ❌ Risco se ADMIN “ver tudo” | Policy explícita: ADMIN deny clínico |
| Paciente | Prontuário | 4/10 | ⚠️ Histórico vira modelo global | Read model / query side, sem ownership cruzado |
| Telepresença | Video Vendor | 2/10 | ❌ Acoplamento de vendor | ACL + port |
| Admin UI | Prontuário | 1/10 | ❌ Vazamento clínico | Separar rotas; testes de autorização negativos |
| Identity | Atendimento | 7/10 | ✅ | Papel necessário para iniciar/encaminhar |

---

## 7. Relatório de baixa coesão / riscos

### Priority: High

**Issue:** IDOR / autorização só no frontend  
- **Location:** qualquer endpoint de atendimento, prontuário, token de sala, link de paciente  
- **Problem:** o case existe para provar autorização server-side  
- **Concepts:** Atendimento, Prontuario, TokenSala, LinkPaciente  
- **Cohesion:** n/a (falha de boundary de segurança)  
- **Recommendation:** policy por recurso em Identity+contexto dono; testes 403/404 sistemáticos

**Issue:** Misturar “Usuário” e “Paciente” no mesmo aggregate  
- **Location:** modelo de Identity  
- **Problem:** Paciente não tem login; forçar User quebra linguagem e fluxo do link  
- **Concepts:** Usuario, Paciente, LinkPaciente  
- **Cohesion:** 2/10  
- **Recommendation:** Paciente fora de Identity; autenticação por capacidade (token opaco)

**Issue:** Claim de atendimento com `if` pré-update  
- **Location:** IniciarAtendimento  
- **Problem:** viola requisito; race condition  
- **Concepts:** Atendimento, Exclusividade  
- **Cohesion:** regra de Core  
- **Recommendation:** update condicional atômico / constraint no banco → 409

### Priority: Medium

**Issue:** Chat dentro do aggregate de Prontuário  
- **Problem:** vocabulário de sessão vs. clínico  
- **Cohesion:** 3/10  
- **Recommendation:** MensagemChat em TelepresencaContext; prontuário só dados clínicos

**Issue:** Read model de histórico do paciente carregando entidades mutáveis  
- **Problem:** risco de vazamento de escrita e bypass de auditoria  
- **Recommendation:** queries dedicadas que passam pelo mesmo gate de auditoria

**Issue:** Engine de vídeo no Core  
- **Problem:** Generic dentro do Core  
- **Recommendation:** port + adapter; Core só decide *quando* a sala existe

### Priority: Low

**Issue:** PWA/offline tratado como requisito clínico  
- **Recommendation:** PWA genérica (manifest + SW de shell); sem cache de PHI offline no escopo do case

---

## 8. Aggregates candidatos (tático leve)

| Aggregate root | Invariantes |
| --- | --- |
| **Atendimento** | Um profissional ativo por atendimento; profissional sem outro `EM_ANDAMENTO`; transições só no grafo; cancelamento só de `AGUARDANDO` |
| **Prontuario** | Após finalizado, conteúdo base imutável; alterações só via Adendo |
| **SalaAtendimento** | Só existe em `EM_ANDAMENTO`; tokens scoped; revogação total no fim |
| **Paciente** | Identidade demográfica (nome, CPF, contato); sem credencial |
| **Usuario** | Papel único relevante ao case; ADMIN sem grants clínicos |
| **RegistroAuditoria** | Append-only |

---

## 9. Mapeamento telas → contextos

| Tela do case | Contextos envolvidos | Observação |
| --- | --- | --- |
| Fila de Pronto Atendimento | Atendimento + Paciente + Identity | Read model da fila; ações mutam Atendimento |
| Sala de Atendimento | Telepresença + Prontuário + Atendimento + Identity | Três painéis, três linguagens — compor na UI, não no domínio |
| Pacientes | Paciente + Prontuário + Atendimento + Auditoria + Identity | Detalhe = projeção; cada leitura clínica audita |
| (Implícito) Admin usuários | Identity | Sem navegação clínica |

---

## 10. Implicações para a arquitetura (hand-off)

1. **Dois Cores:** `AtendimentoContext` e `ProntuarioContext` — coordenação explícita via application services/ports.  
2. **Telepresença Supporting + vídeo Generic:** nunca vazar SDK do vendor para o domínio de Atendimento — adapter em `externals` de vídeo.  
3. **Paciente ≠ User:** link opaco é mecanismo de Identity *capability-based*, modelado perto de Telepresença/Atendimento, não como “login de paciente”.  
4. **Auditoria append-only** acoplada a toda leitura de prontuário (incluindo histórico na tela Pacientes).  
5. **Admin deny-by-design** no ProntuarioContext — teste negativo obrigatório.  
6. Para o prazo do case: **monólito** com Clean Architecture **layer-first** (não microsserviços). Detalhe normativo: [api-clean-architecture.md](./api-clean-architecture.md).  
7. **Mapeamento BC → código:** cada bounded context vira use cases em `app/use-cases/`, entities em `entities/` e controllers/adapters em `externals/` — não pasta raiz feature-first em `src/modules`.

### Checklist de validação (skill)

**Por conceito**

- [x] Linguagem de negócio identificada  
- [x] Subdomínio classificado (Core/Supporting/Generic)  
- [x] Dependências cruzadas explícitas  
- [x] Mismatches linguísticos apontados (Usuário≠Paciente, Atendimento≠Prontuário≠Sala)

**Por domínio**

- [x] Ubiquitous Language  
- [x] Core identificado (Atendimento + Prontuário)  
- [x] Coesão interna alta nos Cores  
- [x] Fronteiras claras o bastante para módulos

---

## 11. Itens `[NECESSITA VALIDAÇÃO]`

Herdados da entrevista arquitetural (ainda em aberto):

- Quem cria o atendimento `AGUARDANDO` (seed + endpoint vs. autoatendimento)
- Campos mínimos definitivos do prontuário/triagem
- Provedor de vídeo escolhido (LiveKit recomendado)
- Persistência do chat (Nest WS vs. data channel)

Estes itens **não mudam** o mapa de bounded contexts acima; mudam apenas profundidade de modelo e adapters.
)
