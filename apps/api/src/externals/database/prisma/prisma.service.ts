import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  connectsPrisma,
  resolvePersistenceMode,
} from '@/externals/database/persistence-mode';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connected = false;

  async onModuleInit(): Promise<void> {
    const mode = resolvePersistenceMode();
    if (!connectsPrisma(mode)) {
      this.logger.log('Prisma desconectado (PERSISTENCE_MODE=memory)');
      return;
    }
    try {
      await this.$connect();
      this.connected = true;
    } catch (error) {
      if (mode === 'write-behind') {
        this.logger.warn(
          `Postgres indisponível em write-behind; seguindo só memória: ${String(error)}`,
        );
        return;
      }
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connected) {
      await this.$disconnect();
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
