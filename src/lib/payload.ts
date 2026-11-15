import config from '@payload-config'
import { getPayload as getPayloadInstance } from 'payload'

/** Payload Local API for server components, route handlers and server actions. Cached by Payload. */
export const getPayload = () => getPayloadInstance({ config })
