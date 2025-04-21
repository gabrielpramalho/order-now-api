import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function deleteBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .delete(
      '/billings/:billingId',
      {
        schema: {
          tags: ['billing'],
          summary: 'Delete a billing',
          security: [{ bearerAuth: [] }],
          params: z.object({
            billingId: z.string().uuid(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { billingId } = await request.params

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const billing = await prisma.billing.findUnique({
          where: {
            id: billingId,
            userId,
          },
        })

        if (!billing) {
          throw new BadRequestError('Billing not found')
        }

        await prisma.billing.delete({
          where: {
            id: billingId,
            userId,
          },
        })

        return reply.status(204).send()
      },
    )
}
