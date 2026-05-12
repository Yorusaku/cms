import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { User } from "../auth/entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getUserList(): Promise<Omit<User, "password">[]> {
    const users = await this.userRepo.find({
      order: { createTime: "DESC" },
    });
    return users.map(({ password: _password, ...rest }) => rest as Omit<User, "password">);
  }

  async createUser(dto: CreateUserDto): Promise<Omit<User, "password">> {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new BadRequestException("用户名已存在");
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      username: dto.username,
      password: hash,
      role: dto.role,
      nickname: dto.nickname ?? null,
    });
    const saved = await this.userRepo.save(user);
    const { password: _password, ...result } = saved;
    return result;
  }

  async updateUser(dto: UpdateUserDto): Promise<Omit<User, "password">> {
    const user = await this.userRepo.findOne({ where: { id: dto.id } });
    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.nickname !== undefined) {
      user.nickname = dto.nickname;
    }

    const saved = await this.userRepo.save(user);
    const { password: _password, ...result } = saved;
    return result;
  }

  async deleteUser(id: string, operatorId: string): Promise<void> {
    if (id === operatorId) {
      throw new BadRequestException("不能删除自己");
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException("用户不存在");
    }

    await this.userRepo.remove(user);
  }
}
