import { Expose, plainToInstance } from 'class-transformer';
import { IsString, Matches, validateSync } from 'class-validator';
import { GenerateTotpDto } from './generate-totp.dto.js';

export class VerifyTotpDto extends GenerateTotpDto {
  @Expose()
  @IsString()
  @Matches(/^[0-9]{6}$/)
  otp: string;

  static fromCode(otp: unknown, secret: unknown): VerifyTotpDto | undefined {
    const dto = plainToInstance(
      VerifyTotpDto,
      { otp, secret },
      { excludeExtraneousValues: true },
    );
    if (
      validateSync(dto, { validationError: { target: false, value: false } })
        .length
    ) {
      return undefined;
    }
    return dto;
  }
}
