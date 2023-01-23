import { useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner, Center } from '@chakra-ui/react';

import { getCurrentTimestamp, isPublicRoute, publicRoutes } from '@/utils/helper';
import useRefreshToken from '@/modules/hooks/useRefreshToken.hook';
import { useLogout } from '@/modules/hooks/useLogout.hook';
import { useRefreshTokenJob } from '@/modules/hooks/useRefreshTokenJob';
import { useSyncTabs } from '@/modules/hooks/useSyncTabs';
import useAuthStoreTrack from '@/store/auth.store';

const LoaderNow = () => {
  return (
    <Center className='h-screen w-full flex flex-row justify-center items-center' h='100vh' w='100%'>
      <Spinner thickness='4px' speed='0.65s' emptyColor='gray.200' color='blue.500' size='xl' />
    </Center>
  );
};

interface AuthGuardMainComponentProps {
  children: any;
}

const AuthGuardMainComponent = ({ children }: AuthGuardMainComponentProps) => {
  const router = useRouter();
  const { expiresAt, accessToken, authLoader, refreshTokenJobInterval } = useAuthStoreTrack();
  const { refreshAccessToken } = useRefreshToken();
  const { runRefreshTokenJob, clearRefreshTokenJob } = useRefreshTokenJob();
  const { signOut } = useLogout();
  const { initiateAuthChannel } = useSyncTabs();

  const refreshTokenJobRef = useRef(0);
  const checkAuth = () => {
    if (!authLoader) {
      initiateAuthChannel();

      // not logged in
      if (!expiresAt || !accessToken) {
        if (refreshTokenJobInterval) clearRefreshTokenJob();
        if (isPublicRoute(router.pathname)) return;
        signOut();
        return;
      }

      // run refresh token job if not yet running
      if (process.env.NODE_ENV !== 'development' || refreshTokenJobRef.current !== 1) {
        refreshTokenJobRef.current = 1;
        runRefreshTokenJob();
      } else if (refreshTokenJobRef.current === 1) refreshTokenJobRef.current = 2;

      // if token expired then refresh access token
      if (getCurrentTimestamp() > expiresAt && !isPublicRoute(router.pathname)) refreshAccessToken();

      // loggedIn but in login page
      if (expiresAt && accessToken && publicRoutes['/login'] === router.pathname) return router.push('/');
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.pathname, accessToken, expiresAt, refreshTokenJobInterval]);

  return <>{children}</>;
};

const AuthGuard = ({ children }: any) => {
  const { refreshAccessToken, isLoading } = useRefreshToken();

  const effectRender = useRef(0);
  useEffect(() => {
    if (effectRender.current === 0) {
      refreshAccessToken();
      effectRender.current = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isLoading) return <LoaderNow />;

  return <AuthGuardMainComponent>{children}</AuthGuardMainComponent>;
};

export default AuthGuard;
