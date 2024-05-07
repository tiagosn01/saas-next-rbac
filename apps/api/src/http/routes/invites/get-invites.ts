import { roleSchema } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/utils/get-user-permissions'

import { UnauthorizedError } from '../errors/unauthorized-error'

export async function getInvites(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/organizations/:slug/invites',
    {
      schema: {
        tags: ['Invites'],
        summary: 'Get all organization invites',
        params: z.object({
          slug: z.string().uuid(),
        }),
        response: {
          200: z.object({
            invites: z.array(
              z.object({
                id: z.string().uuid(),
                role: roleSchema,
                email: z.string().email(),
                createdAt: z.date(),
                author: z
                  .object({
                    id: z.string().uuid(),
                    name: z.string().nullable(),
                  })
                  .nullable(),
              }),
            ),
          }),
        },
      },
    },
    async (req) => {
      const { slug } = req.params
      const userId = await req.getCurrentUserId()
      const { organization, membership } = await req.getUserMembership(slug)

      const { cannot } = getUserPermissions(userId, membership.role)

      if (cannot('get', 'Invite')) {
        throw new UnauthorizedError(
          `You're not allowed to get organization invites.`,
        )
      }

      const invites = await prisma.invite.findMany({
        where: {
          organizationId: organization.id,
        },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      return { invites }
    },
  )
}
