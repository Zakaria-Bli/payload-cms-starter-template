import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { env, isSmtpEnabled } from '@/lib/env'

/**
 * Nodemailer over SMTP when SMTP_HOST is set. Without it Payload logs outgoing emails
 * (password resets, verification) to the console, which is fine for local development.
 */
export const email = isSmtpEnabled
  ? nodemailerAdapter({
      defaultFromAddress: env.EMAIL_FROM_ADDRESS!,
      defaultFromName: env.EMAIL_FROM_NAME,
      // Don't block startup on a mail server outage.
      skipVerify: true,
      transportOptions: {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT ?? 587,
        secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      },
    })
  : undefined
