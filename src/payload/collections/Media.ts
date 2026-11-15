import type { CollectionConfig } from 'payload'

import { anyone, isAdminOrEditor } from '@/payload/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  access: {
    read: anyone,
    create: isAdminOrEditor,
    update: isAdminOrEditor,
    delete: isAdminOrEditor,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Local storage only; ignored when the S3 plugin is enabled (see src/payload/plugins).
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: undefined, position: 'centre' },
      { name: 'large', width: 1600, height: undefined, withoutEnlargement: true },
    ],
    adminThumbnail: 'thumbnail',
  },
}
