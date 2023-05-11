import { z } from 'zod';
import { deleteCookie, getCookie } from 'cookies-next';

import { procedure, router } from '../trpc';
import { AuthService } from '@/server/services/auth.service';

export const authRouter = router({
  signIn: procedure
    .input(
      z.object({
        username: z.string().email(),
        password: z.string(),
      }),
    )
    .mutation(({ input, ctx }) => {
      return AuthService.signIn(ctx, input.username, input.password);
    }),
  forceChangePassword: procedure
    .input(
      z.object({
        session: z.string(),
        username: z.string().email(),
        newPassword: z.string(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return AuthService.forceChangePassword(ctx, input.session, input.username, input.newPassword);
    }),
  signOut: procedure.mutation(async ({ ctx }) => {
    const refreshToken = getCookie('refreshToken', { req: ctx.req, res: ctx.res as any });

    if (!refreshToken)
      return {
        status: false,
        message: 'missing refresh token',
      };

    await AuthService.signOut(refreshToken.toString());

    deleteCookie('refreshToken', { req: ctx.req, res: ctx.res as any });
    deleteCookie('userId', { req: ctx.req, res: ctx.res as any });
  }),
  refreshToken: procedure.mutation(({ ctx }) => {
    return AuthService.refreshTokens(ctx);
  }),
});
