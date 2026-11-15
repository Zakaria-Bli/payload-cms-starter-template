import { sql } from '@payloadcms/db-postgres'

import { getPayload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/** Readiness check: the app is up and can reach PostgreSQL. Use `/api/health` for liveness. */
export async function GET() {
  const headers = { 'Cache-Control': 'no-store' }

  try {
    const payload = await getPayload()
    await payload.db.drizzle.execute(sql`select 1`)
    return Response.json({ status: 'ok' }, { headers })
  } catch (error) {
    console.error('Readiness check failed', error)
    return Response.json({ status: 'unavailable' }, { status: 503, headers })
  }
}
