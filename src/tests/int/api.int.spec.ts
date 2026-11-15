import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { migrations } from '@/migrations'
import type { User } from '@/payload-types'

let payload: Payload

// Payload's generic migration API takes unknown arguments; the PostgreSQL adapter supplies its own.
const testMigrations = migrations.map(({ name, up, down }) => ({
  name,
  up: (args: unknown) => up(args as MigrateUpArgs),
  down: (args: unknown) => down(args as MigrateDownArgs),
}))

const createUser = (roles: User['roles']) =>
  payload.create({
    collection: 'users',
    data: { email: `test-${randomUUID()}@example.com`, password: randomUUID(), roles },
  })

describe('Payload with committed PostgreSQL migrations', () => {
  const created: number[] = []

  beforeAll(async () => {
    // Schema push is off outside development, so this uses only the committed migrations.
    payload = await getPayload({ config })

    // Refuse databases initialised by schema push before migrating over them.
    const { rows } = await payload.db.pool.query(
      "SELECT to_regclass('public.payload_migrations') AS table_name",
    )
    if (rows[0].table_name) {
      const pushed = await payload.count({
        collection: 'payload-migrations',
        where: { batch: { equals: -1 } },
      })
      if (pushed.totalDocs > 0) {
        throw new Error('Use a fresh test database: this one was initialised with schema push.')
      }
    }

    await payload.db.migrate({ migrations: testMigrations })

    // On an empty database the first account always becomes an admin (see assignFirstUserAdmin),
    // so create it up front to keep the role-specific tests deterministic.
    const bootstrap = await createUser(['user'])
    created.push(bootstrap.id)
  })

  it('makes the first account an admin on an empty database', async () => {
    const { totalDocs } = await payload.count({ collection: 'users' })
    const first = await payload.find({ collection: 'users', sort: 'createdAt', limit: 1 })
    expect(totalDocs).toBeGreaterThan(0)
    expect(first.docs[0].roles).toContain('admin')
  })

  afterAll(async () => {
    if (payload) {
      for (const id of created) {
        await payload.delete({ collection: 'users', id }).catch(() => undefined)
      }
      await payload.destroy()
    }
  })

  it('records every committed migration and skips them on a second run', async () => {
    const before = await payload.find({ collection: 'payload-migrations', pagination: false })
    expect(before.docs.map(({ name }) => name).sort()).toEqual(
      migrations.map(({ name }) => name).sort(),
    )
    expect(before.docs.every(({ batch }) => typeof batch === 'number' && batch > 0)).toBe(true)

    await payload.db.migrate({ migrations: testMigrations })
    const after = await payload.find({ collection: 'payload-migrations', pagination: false })
    expect(after.docs).toEqual(before.docs)
  })

  it('stops a regular user from promoting themselves', async () => {
    const user = await createUser(['user'])
    created.push(user.id)

    const updated = await payload.update({
      collection: 'users',
      id: user.id,
      data: { roles: ['admin'] },
      user,
      overrideAccess: false,
    })

    expect(updated.roles).toEqual(['user'])
  })

  it('lets a regular user read only their own account', async () => {
    const [alice, bob] = await Promise.all([createUser(['user']), createUser(['user'])])
    created.push(alice.id, bob.id)

    const visible = await payload.find({
      collection: 'users',
      user: alice,
      overrideAccess: false,
      pagination: false,
    })
    expect(visible.docs.map(({ id }) => id)).toEqual([alice.id])
  })

  it('allows only admins to create users', async () => {
    const [admin, editor] = await Promise.all([createUser(['admin']), createUser(['editor'])])
    created.push(admin.id, editor.id)
    // Admins may assign roles; editors may not create users at all.
    const data = {
      email: `test-${randomUUID()}@example.com`,
      password: randomUUID(),
      roles: ['editor' as const],
    }

    await expect(
      payload.create({ collection: 'users', data, user: editor, overrideAccess: false }),
    ).rejects.toThrow()

    const byAdmin = await payload.create({
      collection: 'users',
      data,
      user: admin,
      overrideAccess: false,
    })
    created.push(byAdmin.id)
    expect(byAdmin.roles).toEqual(['editor'])
  })
})
