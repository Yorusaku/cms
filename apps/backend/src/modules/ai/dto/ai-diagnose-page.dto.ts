import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class AiDiagnosePageDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageId: number;
}
