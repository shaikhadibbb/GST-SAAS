import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

type RequestPart = 'body' | 'query' | 'params'

// ✅ FIXED: proper typing, correct variable name (result.error not error)
export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[part])

    if (!result.success) {
      const errors = result.error.errors.reduce<Record<string, string>>((acc, err) => {
        acc[err.path.join('.') || 'root'] = err.message
        return acc
      }, {})
      res.status(400).json({ success: false, message: 'Validation failed', errors })
      return
    }

    // ✅ FIXED: safer cast using type assertion on specific parts
    if (part === 'body') req.body = result.data
    else if (part === 'query') req.query = result.data as typeof req.query
    else if (part === 'params') req.params = result.data as typeof req.params

    next()
  }
}
