import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../entities/user.entity";
import { resolveJwtSecret } from "../../../common/config/env-validation";

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      // 与 JwtModule 使用同一份解析逻辑：生产缺密钥直接抛错，不回退 dev-secret
      secretOrKey: resolveJwtSecret(configService),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, username: payload.username, role: user.role };
  }
}
