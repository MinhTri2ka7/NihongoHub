import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { envConfig } from '../../../../src/config/env.config.js';
import { ErrorCode } from '../../../../src/common/errors/error-code.js';
import { S3Module } from '../../../../src/infrastructure/storage/s3.module.js';
import { S3StoreService } from '../../../../src/infrastructure/storage/s3-store.service.js';
import { S3_CLIENT } from '../../../../src/infrastructure/storage/s3.tokens.js';

describe('S3Module', () => {
  const originalSettings = envConfig.s3;
  let module: TestingModule | undefined;

  beforeEach(() => {
    envConfig.s3 = {
      enabled: true,
      bucket: 'test-bucket',
      region: 'ap-southeast-1',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
      timeoutMs: 1000,
      credentials: {
        accessKeyId: 'test-only-key',
        secretAccessKey: 'test-only-secret',
      },
    };
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await module?.close();
    module = undefined;
    envConfig.s3 = originalSettings;
    vi.restoreAllMocks();
  });

  it('connects to the configured bucket at startup and closes the client', async () => {
    const send = vi
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue(undefined);
    const destroy = vi.spyOn(S3Client.prototype, 'destroy');
    module = await Test.createTestingModule({ imports: [S3Module] }).compile();
    await module.init();
    const client = module.get<S3Client>(S3_CLIENT);
    expect(await client.config.region()).toBe('ap-southeast-1');
    expect(await client.config.credentials()).toMatchObject(
      envConfig.s3.credentials!,
    );
    expect(client.config.forcePathStyle).toBe(true);
    expect(send).toHaveBeenCalledWith(expect.any(HeadBucketCommand), {
      abortSignal: expect.any(AbortSignal),
    });
    expect((send.mock.calls[0][0] as HeadBucketCommand).input).toEqual({
      Bucket: 'test-bucket',
    });
    await module.close();
    module = undefined;
    expect(destroy).toHaveBeenCalledOnce();
  });

  it('does not create a client or contact S3 when disabled', async () => {
    envConfig.s3.enabled = false;
    const send = vi.spyOn(S3Client.prototype, 'send');
    module = await Test.createTestingModule({ imports: [S3Module] }).compile();
    await module.init();
    expect(module.get(S3_CLIENT)).toBeUndefined();
    await expect(module.get(S3StoreService).ping()).rejects.toMatchObject({
      errorCode: ErrorCode.STORAGE_UNAVAILABLE,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('fails startup with a safe error when the bucket cannot be reached', async () => {
    vi.spyOn(S3Client.prototype, 'send').mockRejectedValue(
      new Error('private-key-and-endpoint'),
    );
    module = await Test.createTestingModule({ imports: [S3Module] }).compile();
    await expect(module.init()).rejects.toMatchObject({
      message: 'Unable to connect to S3 storage',
      errorCode: ErrorCode.STORAGE_UNAVAILABLE,
    });
    await expect(module.get(S3StoreService).ping()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it.each([{ bucket: '' }, { timeoutMs: 0 }, { timeoutMs: Number.NaN }])(
    'rejects incomplete configuration without contacting S3 (%j)',
    async (settings) => {
      Object.assign(envConfig.s3, settings);
      const send = vi.spyOn(S3Client.prototype, 'send');
      await expect(
        Test.createTestingModule({ imports: [S3Module] }).compile(),
      ).rejects.toThrow('S3 requires a bucket, region and positive timeout');
      expect(send).not.toHaveBeenCalled();
    },
  );
});
