/**
 * Idempotent seed: creates the first admin when no users exist.
 * Run with `pnpm seed` (uses `payload run`, which loads .env and the Payload config).
 */
import config from '@payload-config'
import { getPayload } from 'payload'

const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD

const payload = await getPayload({ config })

try {
  const { totalDocs } = await payload.count({ collection: 'users' })

  if (totalDocs > 0) {
    payload.logger.info('Users already exist; skipping admin seed.')
  } else if (!email || !password) {
    throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD to seed the first admin.')
  } else {
    await payload.create({
      collection: 'users',
      data: { email, password, name: 'Admin', roles: ['admin'] },
    })
    payload.logger.info(`Created admin ${email}.`)
  }
} finally {
  await payload.destroy()
}
