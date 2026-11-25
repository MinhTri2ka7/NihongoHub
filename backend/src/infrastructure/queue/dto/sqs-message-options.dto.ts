import { IsInt, Max, Min, ValidateIf } from 'class-validator';

export class SqsMessageOptionsDto {
  @ValidateIf(
    (_options: SqsMessageOptionsDto, value: unknown) => value !== undefined,
  )
  @IsInt()
  @Min(0)
  @Max(900)
  delaySeconds?: number;
}
