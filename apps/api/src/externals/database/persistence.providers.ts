import { Provider } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ATENDIMENTO_REPOSITORY } from '@/app/contracts/atendimento.repository';
import { AUDITORIA_LEITURA_REPOSITORY } from '@/app/contracts/auditoria-leitura.repository';
import { CHAT_MESSAGE_REPOSITORY } from '@/app/contracts/chat-message.repository';
import { PACIENTE_REPOSITORY } from '@/app/contracts/paciente.repository';
import { PATIENT_INVITE_REPOSITORY } from '@/app/contracts/patient-invite.repository';
import { PRONTUARIO_REPOSITORY } from '@/app/contracts/prontuario.repository';
import { ROOM_TOKEN_REVOKER } from '@/app/contracts/room-token-revoker';
import { USUARIO_REPOSITORY } from '@/app/contracts/usuario.repository';
import { VIDEO_ROOM_PROVIDER } from '@/app/contracts/video-room.provider';
import { MemoryAtendimentoRepository } from '@/externals/database/memory/memory-atendimento.repository';
import { MemoryAuditoriaLeituraRepository } from '@/externals/database/memory/memory-auditoria-leitura.repository';
import { MemoryChatMessageRepository } from '@/externals/database/memory/memory-chat-message.repository';
import { MemoryPacienteRepository } from '@/externals/database/memory/memory-paciente.repository';
import { MemoryPatientInviteRepository } from '@/externals/database/memory/memory-patient-invite.repository';
import { MemoryProntuarioRepository } from '@/externals/database/memory/memory-prontuario.repository';
import { MemorySeedService } from '@/externals/database/memory/memory-seed.service';
import { MemoryStore } from '@/externals/database/memory/memory-store';
import { MemoryUsuarioRepository } from '@/externals/database/memory/memory-usuario.repository';
import { WriteBehindFlushService } from '@/externals/database/memory/write-behind-flush.service';
import { WriteBehindInterceptor } from '@/externals/database/memory/write-behind.interceptor';
import { PrismaAtendimentoRepository } from '@/externals/database/prisma/prisma-atendimento.repository';
import { PrismaAuditoriaLeituraRepository } from '@/externals/database/prisma/prisma-auditoria-leitura.repository';
import { PrismaChatMessageRepository } from '@/externals/database/prisma/prisma-chat-message.repository';
import { PrismaPacienteRepository } from '@/externals/database/prisma/prisma-paciente.repository';
import { PrismaPatientInviteRepository } from '@/externals/database/prisma/prisma-patient-invite.repository';
import { PrismaProntuarioRepository } from '@/externals/database/prisma/prisma-prontuario.repository';
import { PrismaUsuarioRepository } from '@/externals/database/prisma/prisma-usuario.repository';
import {
  PersistenceMode,
  resolvePersistenceMode,
  usesMemoryStore,
} from '@/externals/database/persistence-mode';
import { FakeVideoRoomProvider } from '@/externals/telepresenca/fake-video-room.provider';
import { LiveKitRoomTokenRevoker } from '@/externals/telepresenca/livekit-room-token-revoker';
import { LiveKitVideoRoomProvider } from '@/externals/telepresenca/livekit-video-room.provider';
import { MemoryRoomTokenRevoker } from '@/externals/telepresenca/memory-room-token-revoker';

export const PERSISTENCE_MODE = Symbol('PERSISTENCE_MODE');

export function buildPersistenceProviders(): Provider[] {
  const mode = resolvePersistenceMode();
  const providers: Provider[] = [{ provide: PERSISTENCE_MODE, useValue: mode }];

  if (usesMemoryStore(mode)) {
    providers.push(
      MemoryStore,
      MemorySeedService,
      { provide: USUARIO_REPOSITORY, useClass: MemoryUsuarioRepository },
      { provide: PACIENTE_REPOSITORY, useClass: MemoryPacienteRepository },
      {
        provide: ATENDIMENTO_REPOSITORY,
        useClass: MemoryAtendimentoRepository,
      },
      { provide: PRONTUARIO_REPOSITORY, useClass: MemoryProntuarioRepository },
      {
        provide: AUDITORIA_LEITURA_REPOSITORY,
        useClass: MemoryAuditoriaLeituraRepository,
      },
      {
        provide: PATIENT_INVITE_REPOSITORY,
        useClass: MemoryPatientInviteRepository,
      },
      {
        provide: CHAT_MESSAGE_REPOSITORY,
        useClass: MemoryChatMessageRepository,
      },
      { provide: ROOM_TOKEN_REVOKER, useClass: MemoryRoomTokenRevoker },
      { provide: VIDEO_ROOM_PROVIDER, useClass: FakeVideoRoomProvider },
    );

    if (mode === 'write-behind') {
      providers.push(WriteBehindFlushService, {
        provide: APP_INTERCEPTOR,
        useClass: WriteBehindInterceptor,
      });
    }
  } else {
    providers.push(
      { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
      { provide: PACIENTE_REPOSITORY, useClass: PrismaPacienteRepository },
      {
        provide: ATENDIMENTO_REPOSITORY,
        useClass: PrismaAtendimentoRepository,
      },
      { provide: PRONTUARIO_REPOSITORY, useClass: PrismaProntuarioRepository },
      {
        provide: AUDITORIA_LEITURA_REPOSITORY,
        useClass: PrismaAuditoriaLeituraRepository,
      },
      {
        provide: PATIENT_INVITE_REPOSITORY,
        useClass: PrismaPatientInviteRepository,
      },
      {
        provide: CHAT_MESSAGE_REPOSITORY,
        useClass: PrismaChatMessageRepository,
      },
      { provide: ROOM_TOKEN_REVOKER, useClass: LiveKitRoomTokenRevoker },
      { provide: VIDEO_ROOM_PROVIDER, useClass: LiveKitVideoRoomProvider },
    );
  }

  return providers;
}

export function currentPersistenceMode(): PersistenceMode {
  return resolvePersistenceMode();
}
