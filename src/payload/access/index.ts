import type { Access, FieldAccess, PayloadRequest } from 'payload'

import type { User } from '@/payload-types'

export const ROLES = ['admin', 'editor', 'user'] as const
export type Role = (typeof ROLES)[number]

type MaybeUser = Pick<User, 'roles'> | null | undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean =>
  Boolean(user?.roles?.some((role) => roles.includes(role)))

const userFrom = (req: PayloadRequest) => req.user as (User & { collection: 'users' }) | null

/** Anyone, including anonymous visitors. */
export const anyone: Access = () => true

/** Any signed-in user. */
export const authenticated: Access = ({ req }) => Boolean(req.user)

export const isAdmin: Access = ({ req }) => hasRole(userFrom(req), 'admin')

export const isAdminOrEditor: Access = ({ req }) => hasRole(userFrom(req), 'admin', 'editor')

/** Admins see every user; everyone else only their own document. */
export const isAdminOrSelf: Access = ({ req }) => {
  const user = userFrom(req)
  if (!user) return false
  if (hasRole(user, 'admin')) return true
  return { id: { equals: user.id } }
}

export const isAdminField: FieldAccess = ({ req }) => hasRole(userFrom(req), 'admin')

/** Who may open the admin panel. Plain `user` accounts can only use the API and frontend. */
export const canAccessAdmin = ({ req }: { req: PayloadRequest }) =>
  hasRole(userFrom(req), 'admin', 'editor')
