import { describe, expect, it } from 'vitest'

import { parseEnv } from '@/lib/env'

const base = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/app',
  PAYLOAD_SECRET: 'x'.repeat(32),
}

describe('parseEnv', () => {
  it('accepts the minimal configuration and treats blank optional values as unset', () => {
    const env = parseEnv({ ...base, S3_BUCKET: '', SMTP_HOST: '' })
    expect(env.S3_BUCKET).toBeUndefined()
    expect(env.SMTP_HOST).toBeUndefined()
    expect(env.NEXT_PUBLIC_SERVER_URL).toBe('http://localhost:3000')
  })

  it('rejects a non-PostgreSQL database URL and a short secret', () => {
    expect(() => parseEnv({ ...base, DATABASE_URL: 'mysql://localhost/app' })).toThrow(/PostgreSQL/)
    expect(() => parseEnv({ ...base, PAYLOAD_SECRET: 'short' })).toThrow(/32 characters/)
  })

  it('requires the full S3 credential set once any part is given', () => {
    expect(() => parseEnv({ ...base, S3_BUCKET: 'uploads' })).toThrow(/S3_REGION/)
    expect(() =>
      parseEnv({
        ...base,
        S3_BUCKET: 'uploads',
        S3_REGION: 'auto',
        S3_ACCESS_KEY_ID: 'key',
        S3_SECRET_ACCESS_KEY: 'secret',
      }),
    ).not.toThrow()
  })

  it('requires a sender address when SMTP is configured', () => {
    expect(() => parseEnv({ ...base, SMTP_HOST: 'smtp.example.com' })).toThrow(/EMAIL_FROM_ADDRESS/)
  })
})
