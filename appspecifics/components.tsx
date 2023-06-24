import React from 'react';
import Image from 'next/image';
import { Stack } from '@chakra-ui/react';

type GetAppKeys = 'VillaLeonora' | 'HydroResortManila';

const GetAppComp = {
  AppHeaderLogo: (() => {
    const Component = {
      VillaLeonora() {
        return (
          <Stack position='absolute' mt='-10px' left={{ base: '100px', md: '50%' }} transform='translateX(-50%)'>
            <Image src='/VL_logo.png' alt='Villa Leonora Logo' width={200} height={200} priority />
          </Stack>
        );
      },
      HydroResortManila() {
        return (
          <Stack position='absolute' mt='-37px' left={{ base: '100px', md: '50%' }} transform='translateX(-50%)'>
            <Image src='/logo_white.png' alt='Hydro Resort Logo' width={200} height={200} priority />
          </Stack>
        );
      },
    };

    return Component[process.env.NEXT_PUBLIC_APP as GetAppKeys];
  })(),
};

export default GetAppComp;
