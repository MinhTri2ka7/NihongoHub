import type { INestApplication } from '@nestjs/common';
import { RequestLoggingMiddleware } from '../common/middleware/request-logging.middleware.js';

export function setupRequestLogging(app: INestApplication): void {
  const middleware = app.get(RequestLoggingMiddleware);
  // Register before app.init/listen so malformed JSON and Swagger are logged too.
  app.use(middleware.use.bind(middleware));
}
