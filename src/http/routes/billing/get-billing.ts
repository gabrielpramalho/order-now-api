import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/billings/:billingId',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get billing by id',
          security: [{ bearerAuth: [] }],
          params: z.object({
            billingId: z.string().uuid(),
          }),
          response: {
            200: z.object({
              billing: z.object({
                id: z.string().uuid(),
                ownerName: z.string(),
                ownerEmail: z.string().email(),
                ownerPhone: z.string().nullable(),
                date: z.coerce.date(),
                value: z.string(),
                observation: z.string().nullable(),
                status: z.union([
                  z.literal('PENDING'),
                  z.literal('EXPIRED'),
                  z.literal('PAID'),
                ]),
              }),
            }),
          },
        },
      },
      async (request) => {
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
          select: {
            id: true,
            ownerName: true,
            ownerEmail: true,
            ownerPhone: true,
            status: true,
            observation: true,
            date: true,
            value: true,
          },
          where: {
            userId,
            id: billingId,
          },
        })

        if (!billing) {
          throw new BadRequestError('Billing not found')
        }

        return { billing }
      },
    )
}
