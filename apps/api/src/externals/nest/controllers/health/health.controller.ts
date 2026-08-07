import { Controller, Get, Inject, Optional } from '@nestjs/common';
import { PERSISTENCE_MODE } from '@/externals/database/persistence.providers';
import { PersistenceMode } from '@/externals/database/persistence-mode';
import { PrismaService } from '@/externals/database/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(PERSISTENCE_MODE) private readonly persistenceMode: PersistenceMode,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      persistenceMode: this.persistenceMode,
      databaseConnected: this.prisma?.isConnected() ?? false,
    };
  }
}
