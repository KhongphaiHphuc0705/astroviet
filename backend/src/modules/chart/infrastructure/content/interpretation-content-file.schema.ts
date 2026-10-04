import { z } from 'zod';

export const InterpretationContentItemSchema = z
  .object({
    subjectType: z.string(),
    subjectKey: z.string(),
    bodyText: z.string().trim().min(1),
  })
  .strict();

export const InterpretationContentFileSchema = z
  .object({
    language: z.string(),
    version: z.string(),
    status: z.enum(['Draft', 'Published']),
    contentSource: z
      .enum(['HumanAuthored', 'AIGenerated', 'Hybrid'])
      .optional()
      .default('HumanAuthored'),
    items: z.array(InterpretationContentItemSchema),
  })
  .strict();

export type InterpretationContentFile = z.infer<typeof InterpretationContentFileSchema>;
export type InterpretationContentItem = z.infer<typeof InterpretationContentItemSchema>;
