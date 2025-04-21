import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function getBillings(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .get(
      '/billings',
      {
        schema: {
          tags: ['billing'],
          summary: 'Get all billings by user',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              billings: z.array(
                z.object({
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
              ),
            }),
          },
        },
      },
      async (request) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const billings = await prisma.billing.findMany({
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
          },
        })

        return { billings }
      },
    )
}
