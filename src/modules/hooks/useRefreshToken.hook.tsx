import { useState } from 'react';
import { useRouter } from 'next/router';
import useAuthStoreTrack from '@/store/auth.store';
import { InitiateAuthCommandOutput } from '@aws-sdk/client-cognito-identity-provider';
import { setToken, trpc } from '@/utils/trpc';
import { publicRoutes } from '@/modules/utils/helper';
import { useSyncTabs } from './useSyncTabs';

export default function useRefreshToken() {
  const router = useRouter();
  const { setAuthState, resetAuthState, authLoader } = useAuthStoreTrack();
  const { logoutAllTabs } = useSyncTabs();
  const [errMessage, setErrMessage] = useState<string | null>(null);
  const { mutate, isSuccess, isError, data } = trpc.auth.refreshToken.useMutation({
    onSuccess(data) {
      setErrMessage(null);
      if (data) updateAuthStates(data);
    },
    onError(error) {
      setErrMessage(error.message);

      setTimeout(() => {
        setErrMessage(null);
      }, 5000);

      resetAuthState();
      setAuthState('authLoader', false);
      logoutAllTabs();
      router.push(publicRoutes['/admin/login']);
    },
  });

  const updateAuthStates = (data: InitiateAuthCommandOutput & { expiresAt: number }) => {
    if (!data.AuthenticationResult?.AccessToken) return;
    setToken(data.AuthenticationResult.AccessToken);
    setAuthState('accessToken', data?.AuthenticationResult?.AccessToken);
    setAuthState('idToken', data?.AuthenticationResult?.IdToken);
    setAuthState('expiresIn', data?.AuthenticationResult?.ExpiresIn);
    setAuthState('expiresAt', data.expiresAt);
    setAuthState('authLoader', false);
    if (!publicRoutes[router.pathname as keyof typeof publicRoutes]) return;
    else router.push(publicRoutes['/admin/login']);
  };

  const refreshAccessToken = () => mutate();

  return {
    isLoading: authLoader,
    isSuccess,
    isError,
    data,
    errMessage,
    updateAuthStates,
    refreshAccessToken,
  };
}
