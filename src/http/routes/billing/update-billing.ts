import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function updateBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .put(
      '/billings/:billingId',
      {
        schema: {
          tags: ['billing'],
          summary: 'Update a billing',
          security: [{ bearerAuth: [] }],
          params: z.object({
            billingId: z.string().uuid(),
          }),
          body: z.object({
            ownerName: z.string(),
            ownerEmail: z.string().email(),
            ownerPhone: z.string().nullable(),
            date: z.coerce.date(),
            value: z.string(),
            status: z.union([
              z.literal('PENDING'),
              z.literal('EXPIRED'),
              z.literal('PAID'),
            ]),
            observation: z.string().nullable(),
          }),
          response: {
            204: z.null(),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { billingId } = request.params

        const {
          date,
          observation,
          ownerEmail,
          ownerName,
          ownerPhone,
          value,
          status,
        } = request.body

        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
        })

        if (!user) {
          throw new BadRequestError('User not found')
        }

        const dateIsValid = dayjs(date).isBefore()

        if (dateIsValid) {
          throw new BadRequestError('Date is invalid')
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

        await prisma.billing.update({
          where: {
            id: billingId,
            userId,
          },
          data: {
            date,
            observation,
            ownerEmail,
            ownerName,
            ownerPhone,
            value,
            status,
          },
        })

        return reply.status(204).send()
      },
    )
}
