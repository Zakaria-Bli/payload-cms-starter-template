import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { env, isS3Enabled } from '@/lib/env'

export const plugins: Plugin[] = [
  s3Storage({
    // Turned on only when S3 credentials are set; otherwise uploads use local storage.
    enabled: isS3Enabled,
    // Keeps the database schema identical with and without S3, so one set of migrations works
    // for local development and production.
    alwaysInsertFields: true,
    collections: {
      media: true,
    },
    bucket: env.S3_BUCKET ?? '',
    config: {
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      // Most non-AWS providers (MinIO, SeaweedFS, R2) need path-style URLs.
      forcePathStyle: env.S3_FORCE_PATH_STYLE ?? Boolean(env.S3_ENDPOINT),
      credentials:
        env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
          ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
          : undefined,
    },
  }),
]
