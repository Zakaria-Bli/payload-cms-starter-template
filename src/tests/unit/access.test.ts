import type { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import { canAccessAdmin, hasRole, isAdmin, isAdminOrSelf } from '@/payload/access'

const req = (user: { id: number; roles: string[] } | null) =>
  ({ user: user && { ...user, collection: 'users' } }) as unknown as PayloadRequest

describe('access helpers', () => {
  it('hasRole matches any of the given roles', () => {
    expect(hasRole({ roles: ['editor'] }, 'admin', 'editor')).toBe(true)
    expect(hasRole({ roles: ['user'] }, 'admin')).toBe(false)
    expect(hasRole(null, 'admin')).toBe(false)
  })

  it('isAdmin allows only admins', () => {
    expect(isAdmin({ req: req({ id: 1, roles: ['admin'] }) })).toBe(true)
    expect(isAdmin({ req: req({ id: 1, roles: ['editor'] }) })).toBe(false)
    expect(isAdmin({ req: req(null) })).toBe(false)
  })

  it('isAdminOrSelf limits non-admins to their own document', () => {
    expect(isAdminOrSelf({ req: req({ id: 1, roles: ['admin'] }) })).toBe(true)
    expect(isAdminOrSelf({ req: req({ id: 7, roles: ['user'] }) })).toEqual({
      id: { equals: 7 },
    })
    expect(isAdminOrSelf({ req: req(null) })).toBe(false)
  })

  it('keeps plain users out of the admin panel', () => {
    expect(canAccessAdmin({ req: req({ id: 1, roles: ['editor'] }) })).toBe(true)
    expect(canAccessAdmin({ req: req({ id: 1, roles: ['user'] }) })).toBe(false)
  })
})
