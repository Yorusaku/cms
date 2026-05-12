import { IsString, IsIn, IsOptional, MaxLength } from "class-validator";
import { UserRole } from "../../auth/entities/user.entity";

export class UpdateUserDto {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  @IsIn(["admin", "editor", "viewer"])
  role?: UserRole;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}
