import type { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'

import { BadRequestError } from '@/http/routes/errors/bad-request-error'
import { UnauthorizedError } from '@/http/routes/errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, req, res) => {
  if (error instanceof ZodError) {
    res.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BadRequestError) {
    res.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    res.status(401).send({
      message: error.message,
    })
  }

  console.error(error)

  // TODO: send error to some observability platform

  res.status(500).send({ message: 'Internal server error' })
}
