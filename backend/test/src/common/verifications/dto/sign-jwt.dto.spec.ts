import { SignJwtDto } from '../../../../../src/common/verifications/dto/sign-jwt.dto.js';

describe('SignJwtDto', () => {
  it('retains only the subject without changing its value', () => {
    const dto = SignJwtDto.fromPayload({
      sub: ' user-123 ',
      secret: 'private-field',
    });
    expect(dto).toBeInstanceOf(SignJwtDto);
    expect(dto).toEqual({ sub: ' user-123 ' });
  });

  it.each([
    undefined,
    null,
    [],
    'text',
    {},
    { sub: null },
    { sub: 123 },
    { sub: '' },
    { sub: '   ' },
  ])(
    'rejects invalid signing input without exposing its contents',
    (payload) => {
      expect(() => SignJwtDto.fromPayload(payload)).toThrow(
        new TypeError('JWT subject must be a non-empty string'),
      );
    },
  );
});
