<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

Use Node.js 24 or later. Copy `.env.example` to `.env.local` and adjust the
values for your machine. `.env.local` is ignored by Git; `.env.example` is tracked.
The application loads `.env.local` first, then `.env` as a fallback, without
overwriting environment variables already supplied by the host.

## Environment configuration

`EnvConfigModule` uses `@nestjs/config` to load and validate configuration once
at startup. It exports the global `EnvConfigService` for application code.
Read environment settings through this service instead of accessing `process.env`
or injecting the underlying `ConfigService` in feature modules.

```typescript
import { Injectable } from '@nestjs/common';
import { EnvConfigService } from './config/env-config.service.js';

@Injectable()
export class ExampleService {
  constructor(private readonly envConfig: EnvConfigService) {}

  getPort(): number {
    return this.envConfig.port;
  }
}
```

Configuration files:

- `src/config/env.validation.ts`: environment types, defaults, and validation.
- `src/config/env-config.service.ts`: typed accessors used by application code.
- `src/config/env-config.module.ts`: file loading and provider registration.

When adding an environment variable, add its type and validation in
`env.validation.ts`, expose it through `EnvConfigService`, and document its sample
value in `.env.example`. Set the actual local value in `.env.local`.
`PORT` defaults to 3000 and must be an integer from 1 to 65535. `NODE_ENV` defaults
to `development` and accepts `development`, `test`, or `production`. Observe keys
are optional, but both must be supplied together when enabled. Invalid values
stop startup without printing credential values.

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Bootstrap and Swagger

`src/main.ts` contains `bootstrap()`, which creates the app, enables shutdown
hooks, configures Swagger, and starts the HTTP server. The `src/bootstrap/`
directory holds application startup configuration. Its `swagger.ts` configures
the API documentation and interactive API testing page, reading all settings
through `EnvConfigService`.

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs/json`
- `SWAGGER_ENABLED`: `true` or `false`; defaults to enabled outside production
  when omitted. The example and local environment files explicitly enable it.
- `SWAGGER_PATH`: relative path without leading/trailing slashes; defaults to `docs`.
- `SWAGGER_TITLE`: defaults to `Nihongo API`.
- `SWAGGER_VERSION`: defaults to `1.0.0`.

Set `SWAGGER_ENABLED=false` to disable both UI and JSON routes. Adjust the URLs
above if you change `PORT` or `SWAGGER_PATH`.

## Health check

After starting the application, call `GET http://localhost:3000/health` (or the
port configured in `PORT`). A running backend returns HTTP 200:

```json
{ "status": "ok", "uptime": 12.34, "timestamp": "2026-11-19T00:00:00.000Z" }
```

This endpoint checks application liveness only; it does not check database or
external service connectivity. `uptime` is the process uptime in seconds.

## HTTP exception handling

`src/common/filters/http-exception.filter.ts` is registered globally with
`APP_FILTER` in `AppModule`. Failed HTTP requests return `statusCode`, `code`, `message`,
`request_id`, and an ISO `timestamp`. Responses omit the request path. Unmatched
routes use a fixed `Not Found` message without echoing the URL.

HTTP client errors retain their status and string/string-array messages,
including validation errors. Unexpected errors return 500. All 5xx responses
use a generic HTTP reason phrase. The filter logs only `method` and `status`;
it does not log paths, request IDs, error codes, stacks, messages, or causes.
Malformed JSON remains a 400 with a fixed `Bad Request` message.

This filter covers errors propagated through the HTTP request pipeline,
including awaited service calls. Event listeners, background jobs, unawaited
promises, and startup errors need handling in their own execution contexts.

### Shared error codes

Declare stable error codes in `src/common/errors/error-code.ts`. Application code
should import `ErrorCode` instead of repeating error-code strings. For example:

```typescript
import { NotFoundException } from '@nestjs/common';
import { ErrorCode } from './common/errors/error-code.js';

throw new NotFoundException('User not found', {
  errorCode: ErrorCode.USER_NOT_FOUND,
});
// Also supported: new NotFoundException({ code: ErrorCode.USER_NOT_FOUND, message: 'User not found' })
```

The filter returns `code: "USER_NOT_FOUND"` with HTTP 404. It first checks Nest's
`errorCode` exception option, then the response body's `code`. Only values from
`ErrorCode` are accepted. Missing or unregistered codes fall back to the shared
HTTP-status mapping in the same file. Unknown exceptions use
`INTERNAL_SERVER_ERROR`; server error messages remain masked even with a custom
code. Clients should branch on `code` rather than on the display message.

## Request logging

`src/common/middleware/request-logging.middleware.ts` assigns `request_id`, returns
it in the `X-Request-Id` response header, and records each request once on finish
or disconnect. A valid incoming `X-Request-Id` (1–128 letters, digits, `.`, `_`,
`:`, or `-`) is reused; otherwise a UUID is generated. Error responses and request
logs include the same `request_id`; filter error logs contain only method and status.

`src/bootstrap/logging.ts` registers it before body parsing and Swagger, so 404s,
malformed JSON, and documentation requests are covered too. Request logs contain
timestamp, request ID, method, route template, status, duration in milliseconds, and whether
the connection was aborted (logged as status 499). Bodies, query strings, cookies,
and authorization headers are not included in request logs. The `path` field uses
the route template at completion, excluding parameter values and router mount
values. Missing or unsupported route metadata uses `[unmatched]`, including
requests rejected before routing. Raw request URLs are never used as a fallback.

`RequestLogService` writes JSON lines to the console and to daily UTC files such as
`logs/requests-2026-11-19.jsonl`. Set `REQUEST_LOG_DIR` through environment config
to change the directory. Writes are queued asynchronously and flushed during
graceful shutdown; disk write failures use a fixed log message without the original
error, stack, cause, or directory, and do not fail HTTP requests.
The default `logs/` directory is ignored by Git. File retention/cleanup is managed
by the deployment environment.

## PostgreSQL and Drizzle

The database setup lives in `src/infrastructure/database/`:

```text
database/
  database.module.ts       # Async Drizzle registration and pool configuration
  database.service.ts      # Startup connectivity check and readiness query
  database.types.ts        # Shared typed Database
  relations.ts             # Relational query definitions
  schema/index.ts          # Export table schemas here (currently empty)
```

Set `DATABASE_URL` in `.env.local` to your PostgreSQL connection string, including
the database name. The example URL is a local placeholder; create the database
and set your actual credentials before starting the backend. All application
database settings are read through `EnvConfigService.database`.

- `DATABASE_POOL_MAX=10`: maximum connections per application instance.
- `DATABASE_CONNECT_TIMEOUT_MS=5000`: connection acquisition timeout.
- `DATABASE_IDLE_TIMEOUT_MS=30000`: idle pool connection timeout.
- `DATABASE_QUERY_TIMEOUT_MS=10000`: query and PostgreSQL statement timeout.

All numeric settings must be positive integers. Use the connection URL's SSL
parameters when the database provider requires TLS. SQL parameter logging is
not enabled. `DatabaseService` executes `SELECT 1` during startup; the app fails
startup if PostgreSQL cannot be reached. Drizzle closes the pool on application
shutdown. Startup failures after app creation also close the application.

`GET /health` checks liveness. `GET /health/ready` executes `SELECT 1` and returns
200 when successful, or 503 with `code: "DATABASE_UNAVAILABLE"` when unavailable.
The existing HTTP E2E suite mocks Drizzle; it does not require a real database.

Inject the database into future providers with `@InjectDrizzle()` from
`@nestjs/drizzle` and the `Database` type from `database.types.ts`. Table
definitions and relations are intentionally empty until features are added.
No users module or table has been created.

Drizzle Kit uses `drizzle.config.ts` at the repository root. It reads environment
values through `src/config/env.loader.ts` and reuses `validateDatabaseEnv()`,
with the same precedence as Nest: host environment, `.env.local`, then `.env`.
Only the config layer reads `process.env`; CLI scripts do not bootstrap Nest.

```bash
npm run db:generate  # Generate SQL after adding/changing schema
npm run db:migrate   # Apply reviewed migrations to the configured database
npm run db:studio    # Open database browser
```

Commit generated files under `drizzle/`. Migrations run as an explicit command,
not automatically on backend startup. No migration or table is created until
you define a schema and generate one. ORM and Kit use matching v1 RC releases
as documented by the Nest integration; the lockfile records their exact versions.

## Direct CloudWatch logging

`src/infrastructure/cloudwatch/` contains `CloudwatchModule` and
`CloudwatchLogService`, following the database infrastructure layout. The app
sends request log JSON and filter server-error JSON directly using AWS SDK v3.
Filter error events contain only `method` and `status`. Existing console and
request-file logging remains available independently of CloudWatch delivery.

Configure these values in your untracked `.env.local`:

```dotenv
CLOUDWATCH_ENABLED=true
CLOUDWATCH_REGION=ap-southeast-1
CLOUDWATCH_LOG_GROUP=/nihongo/backend/dev
CLOUDWATCH_LOG_STREAM=local-dev
```

Use the exact name and Region of an existing log group. The service creates the
log stream if needed, but does not create log groups or change retention. Grant
the IAM identity `logs:CreateLogStream` and `logs:PutLogEvents` for the target
group's streams. See the [AWS PutLogEvents reference](https://docs.aws.amazon.com/AmazonCloudWatchLogs/latest/APIReference/API_PutLogEvents.html).

For local credentials, either configure an AWS profile (`AWS_PROFILE`) or set
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in `.env.local`. Temporary
credentials also need `AWS_SESSION_TOKEN`. Keep all keys out of source control.
If explicit keys are absent, the SDK uses its default credential provider chain.
Application settings and explicit credentials are accessed through
`EnvConfigService`; feature code does not read environment variables directly.

CloudWatch defaults to disabled. When enabled, Region, group and stream are
required and validated without exposing their values in errors. Log messages
are queued without awaiting AWS in the HTTP pipeline and flushed every second.
The queue is capped at 1,000 events and 1 MiB (including AWS event overhead),
with a 256 KiB limit per event including overhead. Overflow drops new events
and emits a fixed local warning. Batches are sorted by timestamp and split at
24 hours; timestamps use enqueue time. Each SDK call has a 5-second abort signal,
up to three SDK attempts, and connection/request timeouts of 1/3 seconds.

Delivery is best effort: batches still failing after SDK retries, and events
rejected by AWS, are not requeued. Failures log only a fixed local message and
never include credentials, AWS responses, stacks or causes. Shutdown stops the
timer, drains buffered events, and destroys the SDK client. Abrupt termination
can lose buffered events; the local files are not a replay queue.

To verify delivery manually, start the backend with valid local configuration,
call `/health`, then open the configured log group and stream in CloudWatch.
Automated tests disable CloudWatch or mock its SDK and never send real logs.

## Run tests

Run `npm run typecheck` for TypeScript checks without emitting files. Vitest
disables Vite env-file loading and uses `test/setup.ts` to prevent Nest env-file
loading, provide synthetic configuration, and replace Observe with a test module.
HTTP tests mock Drizzle and do not connect to PostgreSQL.

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Auto-instrument your application with [NestJS Observe](https://observe.nestjs.com). Distributed tracing, metrics, and logging made easy. Error tracking and performance monitoring for your NestJS applications.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
