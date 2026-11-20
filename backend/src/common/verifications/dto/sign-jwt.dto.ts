import { Expose, plainToInstance } from 'class-transformer';
import { IsString, Matches, validateSync } from 'class-validator';

export class SignJwtDto {
  @Expose()
  @IsString()
  @Matches(/\S/)
  sub: string;

  static fromPayload(payload: unknown): SignJwtDto {
    const dto = plainToInstance(SignJwtDto, payload, {
      excludeExtraneousValues: true,
    });
    if (
      !(dto instanceof SignJwtDto) ||
      validateSync(dto, { validationError: { target: false, value: false } })
        .length
    ) {
      throw new TypeError('JWT subject must be a non-empty string');
    }
    return dto;
  }
}
