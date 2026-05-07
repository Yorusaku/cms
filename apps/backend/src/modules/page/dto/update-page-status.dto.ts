import { Type } from "class-transformer";
import { IsInt, Min, IsIn } from "class-validator";

export class UpdatePageStatusDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id: number;

  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  isAbled: number;
}
