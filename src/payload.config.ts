import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { env } from './lib/env'
import { migrations } from './migrations'
import { collections } from './payload/collections'
import { Users } from './payload/collections/Users'
import { email } from './payload/email'
import { globals } from './payload/globals'
import { plugins } from './payload/plugins'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  cors: [env.NEXT_PUBLIC_SERVER_URL],
  csrf: [env.NEXT_PUBLIC_SERVER_URL],
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: ' | Admin',
    },
  },
  collections,
  globals,
  editor: lexicalEditor(),
  email,
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    migrationDir: path.resolve(dirname, 'migrations'),
    // Schema push is a development convenience only. Tests and production use the committed
    // migrations, so they exercise exactly what will be deployed.
    push: env.NODE_ENV === 'development',
    // Applied on startup when NODE_ENV=production.
    prodMigrations: migrations,
  }),
  sharp,
  plugins,
  telemetry: false,
})
