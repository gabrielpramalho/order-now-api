import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

export async function createBilling(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/billing',
      {
        schema: {
          tags: ['billing'],
          summary: 'Create a billing',
          security: [{ bearerAuth: [] }],
          body: z.object({
            ownerName: z.string(),
            ownerEmail: z.string().email(),
            ownerPhone: z.string().nullable(),
            date: z.string(),
            value: z.string(),
            observation: z.string().nullable(),
          }),
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const { date, observation, ownerEmail, ownerName, ownerPhone, value } =
          request.body

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

        const billing = await prisma.billing.create({
          data: {
            date,
            ownerEmail,
            ownerName,
            value,
            observation,
            ownerPhone,
            userId,
            status: 'PENDING',
          },
        })

        return reply.status(201).send({ billingId: billing.id })
      },
    )
}
