# Épico J — Home clínica operacional (dashboard)

## Status

**Implementado** (CX-120–CX-126 marcados no checklist).
**IDs:** CX-120–CX-126  
**Apps:** `apps/web` (primário); `apps/api` só se faltar agregação (preferir reusar `GET /atendimentos`)  
**Spec:** [spec.md](./spec.md) · [design.md](./design.md) · [tasks.md](./tasks.md)

## Problema

Após o login, ENFERMEIRO/MEDICO caem numa home que só mostra saudação, badge de persistência e links. Isso não orienta a próxima ação clínica (triagem, encaminhados, retomar sala).

## Abordagem (PO + UI/UX Pro Max)

- **Produto:** cockpit operacional, não marketing hub nem analytics genérico.
- **Estilo:** Accessible & Ethical (alto contraste, 16px+, focus rings, alvos ≥44px).
- **Cores sugeridas (calmas saúde):** primary `#0891B2`, CTA `#059669`, texto `#164E63` — alinhar a tokens já existentes em `App.css` sem tema roxo/neon.
- **Dados:** derivar snapshot da fila a partir da listagem já autorizada (sem endpoint novo na 1ª entrega).
- **Must-not:** ADMIN continua sem visão clínica; sem PHI extra além do que a fila já expõe.

## Fora de escopo

- BI/gráficos pesados, websockets na home, redesign completo de Fila/Sala.
- Novas regras de domínio (409/422/claim) — só consumir o que já existe.
