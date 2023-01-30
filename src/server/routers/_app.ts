import { procedure, router } from '../trpc';
import { authRouter } from './auth.router';
import { productRouter } from './product.router';
import { roomRouter } from './room.router';
import { bookingRouter } from './booking.router';

/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 */
export const appRouter = router({
  health: procedure.query(() => {
    return {
      code: 200,
      status: 'healthy',
    };
  }),
  auth: authRouter,
  product: productRouter,
  room: roomRouter,
  booking: bookingRouter,
});

export type AppRouter = typeof appRouter;
