# ADR-001 — LiveKit, link opaco do paciente e chat WebSocket

## Status

Aceito (Épico E — CX-060–071)

## Contexto

A sala de teleconsulta precisa de vídeo síncrono, credenciais de curto prazo emitidas pelo backend, entrada do paciente sem conta e chat textual persistido enquanto o atendimento está `EM_ANDAMENTO`.

## Decisão

1. **Vídeo:** LiveKit self-hosted no Compose, atrás do port `VideoRoomProvider` (`livekit-server-sdk`). Room name `atendimento-{id}`. Access tokens TTL ≤ 15 min; URL pública via `LIVEKIT_PUBLIC_URL`.
2. **Revogação:** `RoomTokenRevoker` concreto revoga `PatientInviteLink` e chama `deleteRoom` no LiveKit ao encerrar/encaminhar.
3. **Link do paciente:** token opaco (base64url) com hash SHA-256 em `PatientInviteLink`; single-use (`usedAt`), expirável, revogável. Resgate público emite JWT `kind: patient` (não cria `User`) + token LiveKit.
4. **Chat:** mensagens em Prisma (`ChatMessage`) + gateway Nest Socket.IO `/chat`, autenticado com JWT profissional ou paciente.

## Consequências

- Core não conhece LiveKit; troca de provedor fica no adapter.
- Paciente continua fora de Identity (capability-based).
- Chat sobrevive a refresh na sala ativa; não usa data channel do LiveKit (requisito CX-068).
