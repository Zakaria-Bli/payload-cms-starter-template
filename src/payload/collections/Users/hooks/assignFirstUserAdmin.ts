import type { CollectionBeforeChangeHook } from 'payload'

import type { User } from '@/payload-types'

/**
 * The first account (created through the admin panel's "create first user" screen) becomes an
 * admin. Without this, nobody could manage roles because `roles` is admin-only.
 */
export const assignFirstUserAdmin: CollectionBeforeChangeHook<User> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data

  const { totalDocs } = await req.payload.count({ collection: 'users', req })
  if (totalDocs === 0) {
    return { ...data, roles: ['admin'] }
  }

  return data
}
