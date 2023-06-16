import { procedure, router } from '@/server/trpc';
import { authRouter } from './auth.router';
import { productRouter } from './product.router';
import { roomRouter } from './room.router';
import { bookingRouter } from './booking.router';
import { paymentRouter } from './payment.router';
import { bookingSettingRouter } from './booksetting.router';
import { scheduledEventRouter } from './scheduledevent.router';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

/**
 * Create your application's root router
 * If you want to use SSG, you need export this
 * @link https://trpc.io/docs/ssg
 * @link https://trpc.io/docs/router
 * Apply auth routes
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
  payment: paymentRouter,
  bookingSetting: bookingSettingRouter,
  scheduledevent: scheduledEventRouter,
});

export type AppRouter = typeof appRouter;
