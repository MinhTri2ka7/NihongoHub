import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignJwtDto } from './dto/sign-jwt.dto.js';

@Injectable()
export class JwtSignService {
  constructor(private readonly jwt: JwtService) {}

  signToken(payload: SignJwtDto): Promise<string> {
    const dto = SignJwtDto.fromPayload(payload);
    return this.jwt.signAsync({ sub: dto.sub });
  }
}
