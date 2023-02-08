import {
  adminCreateUser,
  adminVerifyEmail,
  initiateAuth,
  refreshTokens,
  respondToNewPasswordAuthChallenge,
  revokeToken,
} from '@/server/repository/cognito.repo';
import { getCookie, setCookie } from 'cookies-next';
import { TRPCError } from '@trpc/server';
import { ChallengeNameType, InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoAccessTokenPayload } from 'aws-jwt-verify/jwt-model';

import { sendUserInvite } from '@/server/repository/mailersend.repo';
import { createTempPassword } from '@/utils/helper';
import { decodeToken } from '../util';

class Service {
  private setReplyCookies(
    ctx: any,
    user: CognitoAccessTokenPayload,
    result: {
      authResult: InitiateAuthCommandOutput;
      cookieAge: number;
    },
  ) {
    setCookie('userId', user.sub, {
      req: ctx.req,
      res: ctx.res as any,
      maxAge: result.cookieAge,
      httpOnly: true,
    });

    setCookie('refreshToken', result.authResult?.AuthenticationResult?.RefreshToken, {
      req: ctx.req,
      res: ctx.res as any,
      maxAge: result.cookieAge,
      httpOnly: true,
    });
  }

  public async createUser(email: string) {
    const tmpPwd = createTempPassword();
    const result = await adminCreateUser(email, tmpPwd);
    await sendUserInvite(email, tmpPwd);
    return result;
  }

  public async signIn(ctx: any, username: string, password: string) {
    const result = await initiateAuth(username, password);
    if (!result) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });

    if (result.authResult.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED)
      return {
        authResult: result.authResult,
        expiresAt: null,
      };

    if (!result.authResult.AuthenticationResult)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });

    const user = await decodeToken(result.authResult.AuthenticationResult.AccessToken as string);

    this.setReplyCookies(ctx, user, result);

    return {
      authResult: result.authResult,
      expiresAt: user.exp,
    };
  }

  public async forceChangePassword(ctx: any, session: string, username: string, newPassword: string) {
    const result = await respondToNewPasswordAuthChallenge(session, username, newPassword);

    if (!result || !result.authResult.AuthenticationResult)
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong' });

    const user = await decodeToken(result.authResult.AuthenticationResult.AccessToken as string);
    await adminVerifyEmail(username);

    this.setReplyCookies(ctx, user, result);

    return {
      authResult: result.authResult,
      expiresAt: user.exp,
    };
  }

  public async signOut(refreshToken: string) {
    return revokeToken(refreshToken);
  }

  public async refreshTokens(ctx: any) {
    const username = getCookie('userId', { req: ctx.req, res: ctx.res as any })?.toString();
    const refreshToken = getCookie('refreshToken', { req: ctx.req, res: ctx.res as any })?.toString();

    if (!refreshToken || !username) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No Refresh Token' });

    const result = await refreshTokens(username, refreshToken);

    if (!!result?.AuthenticationResult) {
      const user = await decodeToken(result.AuthenticationResult.AccessToken as string);
      return {
        ...result,
        expiresAt: user.exp,
      };
    }

    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Refresh Token' });
  }
}

export const AuthService = new Service();
