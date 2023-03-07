import { initTRPC } from '@trpc/server';
import { Context } from './createContext';
import { authMiddleware } from './util';

const t = initTRPC.context<Context>().create();

// Base router and procedure helpers
export const router = t.router;
export const procedure = t.procedure;
export const protectedProcedure = t.procedure.use(authMiddleware);
