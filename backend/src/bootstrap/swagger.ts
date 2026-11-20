import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvConfigService } from '../config/env-config.service.js';

export function setupSwagger(app: INestApplication): void {
  const swagger = app.get(EnvConfigService).swagger;
  if (!swagger.enabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle(swagger.title)
    .setDescription('Nihongo backend API documentation')
    .setVersion(swagger.version)
    .build();

  SwaggerModule.setup(
    swagger.path,
    app,
    () => SwaggerModule.createDocument(app, config),
    { jsonDocumentUrl: `${swagger.path}/json` },
  );
}
