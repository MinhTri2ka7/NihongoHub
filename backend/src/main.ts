import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { setupSwagger } from './bootstrap/swagger.js';
import { EnvConfigService } from './config/env-config.service.js';
import { setupRequestLogging } from './bootstrap/logging.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  const envConfig = app.get(EnvConfigService);

  try {
    app.enableShutdownHooks();
    setupRequestLogging(app);
    setupSwagger(app);
    await app.listen(envConfig.port);
  } catch (error) {
    await app.close();
    throw error;
  }
}

await bootstrap();
