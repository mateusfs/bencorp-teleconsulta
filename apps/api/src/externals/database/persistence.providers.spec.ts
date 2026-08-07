import { ClassProvider, Provider } from '@nestjs/common';
import { VIDEO_ROOM_PROVIDER } from '@/app/contracts/video-room.provider';
import { buildPersistenceProviders } from '@/externals/database/persistence.providers';
import { LiveKitVideoRoomProvider } from '@/externals/telepresenca/livekit-video-room.provider';

function videoRoomUseClass(providers: Provider[]): unknown {
  const match = providers.find(
    (provider): provider is ClassProvider =>
      typeof provider === 'object' &&
      provider !== null &&
      'provide' in provider &&
      (provider as ClassProvider).provide === VIDEO_ROOM_PROVIDER &&
      'useClass' in provider,
  );
  return match?.useClass;
}

describe('buildPersistenceProviders', () => {
  const original = process.env.PERSISTENCE_MODE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PERSISTENCE_MODE;
    } else {
      process.env.PERSISTENCE_MODE = original;
    }
  });

  it('memory e write-behind usam LiveKitVideoRoomProvider', () => {
    for (const mode of ['memory', 'write-behind'] as const) {
      process.env.PERSISTENCE_MODE = mode;
      expect(videoRoomUseClass(buildPersistenceProviders())).toBe(
        LiveKitVideoRoomProvider,
      );
    }
  });

  it('postgres também usa LiveKitVideoRoomProvider', () => {
    process.env.PERSISTENCE_MODE = 'postgres';
    expect(videoRoomUseClass(buildPersistenceProviders())).toBe(
      LiveKitVideoRoomProvider,
    );
  });
});
