import type { CollectionConfig } from 'payload'

import { canAccessAdmin, isAdmin, isAdminField, isAdminOrSelf, ROLES } from '@/payload/access'

import { assignFirstUserAdmin } from './hooks/assignFirstUserAdmin'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'roles', 'updatedAt'],
  },
  auth: {
    // Seconds. Short-lived sessions; Payload refreshes the token while the admin panel is open.
    tokenExpiration: 60 * 60 * 2,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    admin: canAccessAdmin,
    // Public sign-up is off by default. Allow `anyone` here if a project needs self-registration;
    // the field access on `roles` still stops self-promotion.
    create: isAdmin,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
  },
  hooks: {
    beforeChange: [assignFirstUserAdmin],
  },
  fields: [
    // Email and password are added by `auth`.
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      hasMany: true,
      required: true,
      options: [...ROLES],
      defaultValue: ['user'],
      // Stored in the token so access checks don't need a database lookup.
      saveToJWT: true,
      access: {
        create: isAdminField,
        update: isAdminField,
      },
      admin: {
        position: 'sidebar',
      },
    },
  ],
  timestamps: true,
}
