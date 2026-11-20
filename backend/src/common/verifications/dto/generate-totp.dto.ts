import { Expose, plainToInstance, Transform } from 'class-transformer';
import { IsString, ValidateBy, validateSync } from 'class-validator';
import { createGuardrails, ScureBase32Plugin } from 'otplib';

const base32 = new ScureBase32Plugin();
const limits = createGuardrails();

export class GenerateTotpDto {
  @Expose()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @ValidateBy({
    name: 'totpSecret',
    validator: {
      validate: (value: unknown) => {
        if (
          typeof value !== 'string' ||
          value.length > Math.ceil(limits.MAX_SECRET_BYTES / 5) * 8
        )
          return false;
        try {
          const bytes = base32.decode(value);
          return (
            bytes.length >= limits.MIN_SECRET_BYTES &&
            bytes.length <= limits.MAX_SECRET_BYTES
          );
        } catch {
          return false;
        }
      },
    },
  })
  secret: string;

  static fromSecret(secret: unknown): GenerateTotpDto {
    const dto = plainToInstance(
      GenerateTotpDto,
      { secret },
      { excludeExtraneousValues: true },
    );
    if (
      validateSync(dto, { validationError: { target: false, value: false } })
        .length
    ) {
      throw new TypeError(
        'TOTP secret must be valid Base32 encoding of 16 to 64 bytes',
      );
    }
    return dto;
  }
}
