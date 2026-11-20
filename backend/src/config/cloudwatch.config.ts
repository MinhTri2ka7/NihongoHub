export interface CloudwatchEnvironment {
  CLOUDWATCH_ENABLED: boolean;
  CLOUDWATCH_REGION: string;
  CLOUDWATCH_LOG_GROUP: string;
  CLOUDWATCH_LOG_STREAM: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_SESSION_TOKEN: string;
}

export function validateCloudwatchEnv(
  config: Record<string, unknown>,
): CloudwatchEnvironment {
  const enabled = config.CLOUDWATCH_ENABLED ?? false;
  if (![true, false, 'true', 'false'].includes(enabled as boolean | string)) {
    throw new Error('CLOUDWATCH_ENABLED must be true or false');
  }

  const values: Record<string, string> = {};
  for (const key of [
    'CLOUDWATCH_REGION',
    'CLOUDWATCH_LOG_GROUP',
    'CLOUDWATCH_LOG_STREAM',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_SESSION_TOKEN',
  ]) {
    const value = config[key] ?? '';
    if (typeof value !== 'string') {
      throw new Error(`${key} must be a string`);
    }
    values[key] = value.trim();
  }

  const isEnabled = enabled === true || enabled === 'true';
  if (isEnabled) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)+-\d+$/.test(values.CLOUDWATCH_REGION)) {
      throw new Error('CLOUDWATCH_REGION must be an AWS Region');
    }
    if (!/^[.\-_/#A-Za-z0-9]{1,512}$/.test(values.CLOUDWATCH_LOG_GROUP)) {
      throw new Error('CLOUDWATCH_LOG_GROUP must be a valid log group name');
    }
    const stream = values.CLOUDWATCH_LOG_STREAM;
    if (
      !stream ||
      stream.length > 512 ||
      /[:*]/.test(stream) ||
      [...stream].some((character) => {
        const code = character.charCodeAt(0);
        return code < 32 || code === 127;
      })
    ) {
      throw new Error('CLOUDWATCH_LOG_STREAM must be a valid log stream name');
    }
  }
  if (
    Boolean(values.AWS_ACCESS_KEY_ID) !== Boolean(values.AWS_SECRET_ACCESS_KEY)
  ) {
    throw new Error(
      'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set together',
    );
  }
  if (values.AWS_SESSION_TOKEN && !values.AWS_ACCESS_KEY_ID) {
    throw new Error('AWS_SESSION_TOKEN requires an access key and secret key');
  }

  return {
    CLOUDWATCH_ENABLED: isEnabled,
    CLOUDWATCH_REGION: values.CLOUDWATCH_REGION,
    CLOUDWATCH_LOG_GROUP: values.CLOUDWATCH_LOG_GROUP,
    CLOUDWATCH_LOG_STREAM: values.CLOUDWATCH_LOG_STREAM,
    AWS_ACCESS_KEY_ID: values.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: values.AWS_SECRET_ACCESS_KEY,
    AWS_SESSION_TOKEN: values.AWS_SESSION_TOKEN,
  };
}
