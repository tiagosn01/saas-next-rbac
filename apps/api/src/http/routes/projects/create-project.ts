import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { UnauthorizedError } from '@/http/routes/errors/unauthorized-error'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'
import { getUserPermissions } from '@/utils/get-user-permissions'

export async function createProject(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/organizations/:slug/projects',
      {
        schema: {
          tags: ['Projects'],
          summary: 'Create a new project',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            description: z.string(),
          }),
          params: z.object({
            slug: z.string(),
          }),
          response: {
            201: z.object({
              projectId: z.string().uuid(),
            }),
          },
        },
      },
      async (req, res) => {
        const { slug } = req.params
        const userId = await req.getCurrentUserId()
        const { organization, membership } = await req.getUserMembership(slug)

        const { cannot } = getUserPermissions(userId, membership.role)

        if (cannot('create', 'Project')) {
          throw new UnauthorizedError(
            `You're not allowed to create new projects.`,
          )
        }

        const { name, description } = req.body

        const project = await prisma.project.create({
          data: {
            name,
            slug: createSlug(name),
            description,
            organizationId: organization.id,
            ownerId: userId,
          },
        })

        return res.status(201).send({
          projectId: project.id,
        })
      },
    )
}
