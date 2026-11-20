import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { envConfig } from '../config/env.config.js';

export function setupSwagger(app: INestApplication): void {
  const swagger = envConfig.swagger;
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
