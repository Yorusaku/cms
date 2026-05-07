import { IsString, IsNotEmpty, Length } from "class-validator";

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 100)
  password: string;
}
