import { Controller, Get, Post, Body, Req } from "@nestjs/common";
import { Request } from "express";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthenticatedUser } from "../auth/strategies/jwt.strategy";
import { User } from "../auth/entities/user.entity";

@Controller("atlas-cms")
@Roles("admin")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("getUserList")
  async getUserList(): Promise<Omit<User, "password">[]> {
    return this.userService.getUserList();
  }

  @Post("createUser")
  async createUser(@Body() dto: CreateUserDto): Promise<Omit<User, "password">> {
    return this.userService.createUser(dto);
  }

  @Post("updateUser")
  async updateUser(@Body() dto: UpdateUserDto): Promise<Omit<User, "password">> {
    return this.userService.updateUser(dto);
  }

  @Post("deleteUser")
  async deleteUser(
    @Body("id") id: string,
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<null> {
    await this.userService.deleteUser(id, req.user.id);
    return null;
  }
}
