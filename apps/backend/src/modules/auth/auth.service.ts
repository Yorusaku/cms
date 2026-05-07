import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "./entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async login(username: string, password: string): Promise<{ token: string }> {
    const user = await this.userRepo.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);
    return { token };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }
}
