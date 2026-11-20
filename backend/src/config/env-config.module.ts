import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvConfigService } from './env-config.service.js';
import { validateEnv } from './env.validation.js';
import { ENV_FILE_PATHS } from './env.loader.js';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ENV_FILE_PATHS,
      validate: validateEnv,
      cache: true,
      skipProcessEnv: true,
    }),
  ],
  providers: [EnvConfigService],
  exports: [EnvConfigService],
})
export class EnvConfigModule {}
