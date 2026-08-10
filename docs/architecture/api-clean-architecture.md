# API — Clean Architecture + Layer First

- **Status:** Decisão de implementação travada
- **Data:** 2026-08-07
- **Escopo:** `apps/api`
- **Relacionados:** [domain-analysis.md](./domain-analysis.md), [case-checklist.md](./case-checklist.md)

---

## 1. Decisão

A API NestJS adota **Clean Architecture** com organização de pastas **layer-first** no primeiro nível de `src/`:

| Camada | Pasta | Papel |
| --- | --- | --- |
| Application | `app/` | contracts (ports) + use cases |
| Domain | `entities/` | entidades, VOs, enums, erros de domínio |
| Infrastructure / delivery | `externals/` | Prisma, crypto/JWT, Nest (HTTP, security, filters) |

Bounded contexts do case (`identity-access`, `atendimento`, `prontuario`, …) aparecem nos **nomes** dos use cases / entities e nas pastas de controllers — não como pastas raiz concorrendo com as camadas.

**Por quê (trade-offs):**

| Prós | Contras aceitos |
| --- | --- |
| Domínio e casos de uso testáveis sem Nest/Prisma/HTTP | Mais arquivos e indirection no início |
| Regras do case (409, 422, imutabilidade, authz) ficam no centro | Nest module é composition root, não dono da regra |
| Troca de adapter (LiveKit, Prisma) sem reescrever Core | Exige disciplina de dependências (lint/revisão) |

---

## 2. Regra de dependência (inviolável)

```text
externals/nest  →  app/use-cases  →  entities
externals/*     →  app/contracts + entities   (adapters implementam ports)
app/use-cases   →  app/contracts + entities
entities        →  (nada de Nest, Prisma, HTTP)
```

- **entities** não importa Nest, Prisma, LiveKit, HTTP, JWT concreto.
- **app/use-cases** orquestra; depende só de **contracts** (ports) e **entities**.
- **externals** implementa ports (Prisma, bcrypt/JWT, LiveKit) e expõe HTTP/WS.
- Controllers em `externals/nest` são finos: DTO → use case → resposta.

Direção proibida: `entities → externals` ou `entities → app`.

---

## 3. Estrutura layer-first

```text
apps/api/
├── prisma/                          # schema, migrations, seed
├── test/
└── src/
    ├── main.ts                      # bootstrap Nest
    ├── app/
    │   ├── contracts/               # ports (interfaces + tokens DI)
    │   └── use-cases/
    │       └── <nome-do-caso>/      # um diretório por intenção
    │           ├── <nome>.ts
    │           ├── <nome>.spec.ts
    │           └── index.ts
    ├── entities/                    # domínio puro
    │   ├── errors/
    │   ├── types/                   # VOs compartilhados (quando houver)
    │   ├── usuario.ts
    │   ├── user-role.ts
    │   └── …
    └── externals/
        ├── cryptography/            # bcrypt, JWT adapter
        ├── database/
        │   └── prisma/              # PrismaService + repositories
        ├── logging/
        └── nest/
            ├── module.ts            # composition root (AppModule)
            ├── controllers/
            ├── pipes/               # DTOs / validação HTTP
            ├── filters/             # domain errors → 401/403/409/422
            ├── security/            # guards JWT/RBAC (thin)
            └── ws/                  # chat gateway (épicos futuros)
```

### 3.1 Use cases

Cada caso de uso vive em pasta própria sob `app/use-cases/<kebab-case>/`, com o mesmo nome de arquivo e `index.ts` reexportando a classe.

Exemplos atuais: `login-usuario`, `criar-usuario`, `listar-usuarios`, `atualizar-usuario`, `acessar-prontuario-stub`.

### 3.2 Contracts

Ports tipados + `Symbol` de DI, por exemplo:

- `usuario.repository.ts`
- `password-hasher.ts`
- `token-service.ts`

### 3.3 Imports — alias `@/*`

```typescript
import { PasswordHasher } from '@/app/contracts/password-hasher';
import { CriarUsuarioUseCase } from '@/app/use-cases/criar-usuario';
import { Usuario } from '@/entities/usuario';
import { PrismaUsuarioRepository } from '@/externals/database/prisma/prisma-usuario.repository';
```

| Peça | Convenção |
| --- | --- |
| `tsconfig.json` | `paths: { "@/*": ["./src/*"] }` (sem `baseUrl` — preterido no TS 6+) |
| Jest | `moduleNameMapper`: `"^@/(.*)$"` → `"<rootDir>/$1"` |
| Build | `tsc` + `scripts/rewrite-path-aliases.mjs` (reescreve `@/` em `from`/`require` no `dist`) |
| Runtime | `node -r ./scripts/register-path-aliases.cjs` em `start` / `start:dev` / `start:prod` |
| Bootstrap | `ensurePersistenceMode()` → `import('./externals/nest/module')` (relativo; modo resolvido antes dos providers) |

Relativos (`../`) só entre arquivos irmãos do mesmo feature (ex.: spec ao lado do use case).

---

## 4. Responsabilidades por camada

### 4.1 Entities

- Aggregates e invariantes: `Atendimento`, `Prontuario`, tokens de sala.
- Value objects / enums: `UserRole`, `AtendimentoStatus`, `DesfechoAtendimento`, `ClassificacaoRisco`.
- Erros tipados (`ConflictError`, `UnprocessableStateError`, `ForbiddenError`) em `entities/errors`.

### 4.2 App (use cases + contracts)

- Um use case por intenção de negócio (alinhado aos IDs do checklist quando fizer sentido).
- Orquestra repositórios e ports; **não** acessa `PrismaClient` diretamente.
- Políticas de autorização de negócio (ex.: ADMIN deny clínico) vivem aqui — **não** só no guard Nest.

### 4.3 Externals

- Implementações Prisma dos ports (incluindo claim atômico → 409).
- Adapter LiveKit atrás de port de vídeo.
- JWT / bcrypt, logger estruturado.
- Controllers Nest finos; guards de identidade/papel; exception filters.

---

## 5. NestJS como composition root

- `externals/nest/module.ts` registra providers e faz bind `Port → Adapter`.
- Tokens de DI tipados nos contracts.
- Controllers em `externals/nest/controllers`; use cases em `app/use-cases`; adapters em `externals/*`.

```typescript
{ provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository }
{ provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher }
```

---

## 6. Testes

| Camada | O que testar | Ferramenta |
| --- | --- | --- |
| entities | Transições, imutabilidade, helpers | Jest sem Nest |
| app/use-cases | Ports em memória / doubles | Jest |
| externals/database | Claim atômico / migrations | Jest + DB |
| externals/nest | Guards, mapping HTTP | Jest + Nest testing |

Meta: cobertura ≥ 80% nos módulos de regras (checklist CX-091), priorizando entities + use cases.

---

## 7. Mapeamento BC → artefatos

| Bounded Context | Onde vive |
| --- | --- |
| IdentityAccess | `entities/usuario*`, `app/use-cases/*-usuario*`, `externals/nest/controllers/{auth,users}`, `externals/cryptography` + `database/prisma` |
| Atendimento | use cases `*-atendimento*`, entities de status/desfecho, controllers `atendimentos`; home web deriva snapshot da listagem |
| Prontuario | use cases `*-prontuario*`, controllers `prontuarios` |
| Paciente | use cases `listar-pacientes` / `obter-paciente-detalhe`, controllers `pacientes` |
| Telepresenca | use cases de sala/token/chat + `externals/telepresenca` + `ChatGateway` |
| Auditoria | use cases + persistence de leitura de prontuário |

Shared kernel mínimo: IDs e erros em `entities/` / `entities/errors`.

---

## 8. Checklist de conformidade (revisão de PR)

- [ ] Novo endpoint tem controller fino + use case em `app/use-cases/<nome>/`
- [ ] Regra de negócio não está no controller nem no Prisma “god”
- [ ] `entities` / `app` sem import de `@prisma/client` ou SDK LiveKit; Nest só onde já for composition (Injectable em use case é aceitável)
- [ ] Erros do case (409/422/403) originados em entities/app e mapeados em `externals/nest/filters`
- [ ] Teste do use case ou da invariante para regra crítica
- [ ] Pastas respeitam `app | entities | externals`
- [ ] Imports cross-layer usam `@/...` (não `../../` entre camadas)

---

## 9. O que não fazer

- Colocar `PrismaService` dentro de entities
- “Service Nest” único com SQL + HTTP + regra misturados
- Microsserviço por BC (YAGNI para o prazo do case)
- Pastas `domain/` / `application/` / `presentation/` / `infrastructure/` na raiz de `src/` — a convenção canônica é `app` / `entities` / `externals`
- Imports relativos longos entre camadas
