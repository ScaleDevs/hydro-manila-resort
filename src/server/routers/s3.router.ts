import { z } from 'zod';
import { procedure, router } from '@/server/trpc';
import { S3Service } from '../services/s3.service';

export const s3Router = router({
  generateSignedUploadUrl: procedure
    .input(
      z.object({
        key: z.string(),
        contentType: z.string(),
      }),
    )
    .mutation(({ input }) => {
      return S3Service.generateUploadSignedUrl(input.key, input.contentType, 300);
    }),
});
