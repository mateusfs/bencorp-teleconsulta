import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AtualizarProntuarioUseCase } from '@/app/use-cases/atualizar-prontuario';
import { AtualizarUsuarioUseCase } from '@/app/use-cases/atualizar-usuario/atualizar-usuario';
import { CancelarAtendimentoUseCase } from '@/app/use-cases/cancelar-atendimento';
import {
  EnviarMensagemChatUseCase,
  ListarMensagensChatUseCase,
} from '@/app/use-cases/chat-sala';
import { CriarAdendoProntuarioUseCase } from '@/app/use-cases/criar-adendo-prontuario';
import { CriarLinkPacienteUseCase } from '@/app/use-cases/criar-link-paciente';
import { CriarSolicitacaoAtendimentoUseCase } from '@/app/use-cases/criar-solicitacao-atendimento';
import { CriarUsuarioUseCase } from '@/app/use-cases/criar-usuario/criar-usuario';
import { EmitirTokenSalaUseCase } from '@/app/use-cases/emitir-token-sala';
import { EncaminharAtendimentoMedicoUseCase } from '@/app/use-cases/encaminhar-atendimento-medico';
import { EncerrarAtendimentoUseCase } from '@/app/use-cases/encerrar-atendimento';
import { IniciarAtendimentoUseCase } from '@/app/use-cases/iniciar-atendimento';
import { ListarFilaAtendimentoUseCase } from '@/app/use-cases/listar-fila-atendimento';
import { ListarPacientesUseCase } from '@/app/use-cases/listar-pacientes';
import { ListarUsuariosUseCase } from '@/app/use-cases/listar-usuarios/listar-usuarios';
import { LoginUsuarioUseCase } from '@/app/use-cases/login-usuario/login-usuario';
import { ObterAtendimentoUseCase } from '@/app/use-cases/obter-atendimento';
import { ObterPacienteDetalheUseCase } from '@/app/use-cases/obter-paciente-detalhe';
import { ObterProntuarioPorAtendimentoUseCase } from '@/app/use-cases/obter-prontuario-por-atendimento';
import { ObterProntuarioPorIdUseCase } from '@/app/use-cases/obter-prontuario-por-id';
import { ResgatarLinkPacienteUseCase } from '@/app/use-cases/resgatar-link-paciente';
import { PASSWORD_HASHER } from '@/app/contracts/password-hasher';
import { TOKEN_SERVICE } from '@/app/contracts/token-service';
import { BcryptPasswordHasher } from '@/externals/cryptography/bcrypt-password-hasher';
import { JwtTokenService } from '@/externals/cryptography/jwt-token.service';
import { buildPersistenceProviders } from '@/externals/database/persistence.providers';
import { PrismaService } from '@/externals/database/prisma/prisma.service';
import { RequestLoggingInterceptor } from '@/externals/logging/request-logging.interceptor';
import { AtendimentosController } from '@/externals/nest/controllers/atendimentos/atendimentos.controller';
import { AuthController } from '@/externals/nest/controllers/auth/auth.controller';
import { HealthController } from '@/externals/nest/controllers/health/health.controller';
import { PacientesController } from '@/externals/nest/controllers/pacientes/pacientes.controller';
import { ProntuariosController } from '@/externals/nest/controllers/prontuarios/prontuarios.controller';
import { SalaController } from '@/externals/nest/controllers/sala/sala.controller';
import { UsersController } from '@/externals/nest/controllers/users/users.controller';
import { DomainExceptionFilter } from '@/externals/nest/filters/domain-exception.filter';
import { JwtStrategy } from '@/externals/nest/security/jwt.strategy';
import { ChatGateway } from '@/externals/nest/ws/chat.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    AtendimentosController,
    PacientesController,
    ProntuariosController,
    SalaController,
  ],
  providers: [
    PrismaService,
    JwtStrategy,
    ChatGateway,
    LoginUsuarioUseCase,
    ListarUsuariosUseCase,
    CriarUsuarioUseCase,
    AtualizarUsuarioUseCase,
    ListarFilaAtendimentoUseCase,
    ListarPacientesUseCase,
    ObterPacienteDetalheUseCase,
    CriarSolicitacaoAtendimentoUseCase,
    ObterAtendimentoUseCase,
    IniciarAtendimentoUseCase,
    CancelarAtendimentoUseCase,
    EncerrarAtendimentoUseCase,
    EncaminharAtendimentoMedicoUseCase,
    ObterProntuarioPorAtendimentoUseCase,
    ObterProntuarioPorIdUseCase,
    AtualizarProntuarioUseCase,
    CriarAdendoProntuarioUseCase,
    EmitirTokenSalaUseCase,
    CriarLinkPacienteUseCase,
    ResgatarLinkPacienteUseCase,
    ListarMensagensChatUseCase,
    EnviarMensagemChatUseCase,
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: RequestLoggingInterceptor },
    ...buildPersistenceProviders(),
  ],
})
export class AppModule {}
