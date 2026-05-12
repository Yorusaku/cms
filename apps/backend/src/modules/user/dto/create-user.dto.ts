import { IsString, IsIn, IsOptional, MinLength, MaxLength } from "class-validator";
import { UserRole } from "../../auth/entities/user.entity";

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsIn(["admin", "editor", "viewer"])
  role: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}
