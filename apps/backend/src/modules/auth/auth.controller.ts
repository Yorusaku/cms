import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";
import { UserRole } from "./entities/user.entity";

@Controller("atlas-cms")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto): Promise<{ token: string; role: UserRole }> {
    return this.authService.login(dto.username, dto.password);
  }
}
