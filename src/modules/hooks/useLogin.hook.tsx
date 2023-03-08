import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuthStoreTrack from '@/store/auth.store';
import { setToken, trpc } from '@/utils/trpc';
import { useSyncTabs } from './useSyncTabs';

const schema = z.object({
  username: z.string(),
  password: z.string(),
});

export default function useLogin() {
  const router = useRouter();
  const { setAuthState } = useAuthStoreTrack();
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const { mutate, isLoading: isSignInLoading } = trpc.auth.signIn.useMutation();
  const { loginAllTabs } = useSyncTabs();

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const updateAuthStates = (data: { AccessToken?: string; IdToken?: string; ExpiresIn?: number; expiresAt?: number }) => {
    if (!data.AccessToken) return;
    setToken(data.AccessToken);
    setAuthState('accessToken', data.AccessToken);
    setAuthState('idToken', data.IdToken);
    setAuthState('expiresIn', data.ExpiresIn);
    setAuthState('expiresAt', data.expiresAt);
    router.push('/admin/bookings');
    loginAllTabs();
  };

  const signIn = (formData: typeof schema._input) => {
    mutate(formData, {
      onSuccess(data) {
        const { authResult, expiresAt } = data;
        setErrMessage(null);
        if (authResult?.ChallengeName === ChallengeNameType.NEW_PASSWORD_REQUIRED) {
          setAuthState('forceChangePassword', true);
          setAuthState('username', formData.username);
          authResult.Session && setAuthState('session', authResult.Session);
        } else if (authResult.AuthenticationResult && typeof expiresAt === 'number')
          updateAuthStates({
            AccessToken: authResult.AuthenticationResult.AccessToken,
            IdToken: authResult.AuthenticationResult.IdToken,
            ExpiresIn: authResult.AuthenticationResult.ExpiresIn,
            expiresAt,
          });
      },
      onError(error) {
        setErrMessage(error.message);

        setTimeout(() => {
          setErrMessage(null);
        }, 5000);
      },
    });
  };

  return {
    isSignInLoading,
    errMessage,
    handleSubmit,
    register,
    signIn,
    updateAuthStates,
  };
}
