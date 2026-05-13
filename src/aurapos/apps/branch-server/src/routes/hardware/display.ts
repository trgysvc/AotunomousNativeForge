import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

interface DisplayRequestBody {
  total: number
  paymentMethod: string
  tip?: number
}

async function routes(fastify: FastifyInstance, _options: unknown) {
  fastify.post<{ Body: DisplayRequestBody }>('/api/hardware/display/show', async (request, reply) => {
    const { total, paymentMethod, tip } = request.body

    if (typeof total !== 'number' || typeof paymentMethod !== 'string') {
      return reply.status(400).send({ error: 'Invalid request: total (number) and paymentMethod (string) are required' })
    }

    const hardwareBridgeUrl = process.env.HARDWARE_BRIDGE_URL
    if (!hardwareBridgeUrl) {
      return reply.status(500).send({ error: 'Hardware Bridge Service URL not configured' })
    }

    const payload: Record<string, unknown> = { total, paymentMethod }
    if (tip !== undefined) {
      payload.tip = tip
    }

    try {
      const response = await fetch(`${hardwareBridgeUrl}/api/hardware/display/show`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        return reply.status(response.status).send({ error: `Hardware Bridge Service error: ${response.status}`, details: errorText })
      }

      return reply.send({ success: true })
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to contact Hardware Bridge Service', details: (error as Error).message })
    }
  })
}

export default routes
}