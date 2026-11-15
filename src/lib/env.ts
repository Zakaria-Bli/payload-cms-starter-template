import { z } from 'zod'

// Empty strings in .env files mean "unset", so optional groups can be left blank.
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

const booleanFlag = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1')

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    DATABASE_URL: z
      .url()
      .refine((value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol), {
        message: 'DATABASE_URL must be a PostgreSQL connection URL',
      }),
    PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must contain at least 32 characters'),
    // Public origin of the app, e.g. https://example.com. Used for absolute URLs, CORS and CSRF.
    NEXT_PUBLIC_SERVER_URL: z.url().default('http://localhost:3000'),

    // S3-compatible storage. All of bucket, region and credentials enable it; leave them blank to
    // store uploads on the local filesystem.
    S3_BUCKET: optional(z.string()),
    S3_REGION: optional(z.string()),
    S3_ACCESS_KEY_ID: optional(z.string()),
    S3_SECRET_ACCESS_KEY: optional(z.string()),
    S3_ENDPOINT: optional(z.url()),
    S3_FORCE_PATH_STYLE: optional(booleanFlag),

    // SMTP via Nodemailer. Leave SMTP_HOST blank to log emails to the console instead.
    SMTP_HOST: optional(z.string()),
    SMTP_PORT: optional(z.coerce.number().int().positive()),
    SMTP_USER: optional(z.string()),
    SMTP_PASS: optional(z.string()),
    SMTP_SECURE: optional(booleanFlag),
    EMAIL_FROM_ADDRESS: optional(z.email()),
    EMAIL_FROM_NAME: z.string().default('Payload'),
  })
  .superRefine((value, ctx) => {
    const s3Keys = ['S3_BUCKET', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const
    const setS3Keys = s3Keys.filter((key) => value[key])
    if (setS3Keys.length > 0 && setS3Keys.length < s3Keys.length) {
      for (const key of s3Keys.filter((key) => !value[key])) {
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required when S3 is used` })
      }
    }

    if (value.SMTP_HOST && !value.EMAIL_FROM_ADDRESS) {
      ctx.addIssue({
        code: 'custom',
        path: ['EMAIL_FROM_ADDRESS'],
        message: 'EMAIL_FROM_ADDRESS is required when SMTP_HOST is set',
      })
    }
  })

export type Env = z.infer<typeof envSchema>

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source)
  if (!result.success) {
    throw new Error(`Invalid environment variables:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const env = parseEnv(process.env)

export const isS3Enabled = Boolean(
  env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY,
)
export const isSmtpEnabled = Boolean(env.SMTP_HOST)
