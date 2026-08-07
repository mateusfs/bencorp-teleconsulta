import { Body, Controller, Post } from '@nestjs/common';
import { LoginUsuarioUseCase } from '@/app/use-cases/login-usuario/login-usuario';
import { LoginDto } from '@/externals/nest/pipes/auth/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUsuario: LoginUsuarioUseCase) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.loginUsuario.execute(body.email, body.password);
  }
}
