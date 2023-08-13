import React from 'react';
import { Box } from '@chakra-ui/react';
import GetAppComp from '@/appspecs/components';

export default function Layout({ children }: any) {
  const HeaderLogo = GetAppComp.AdminLogoinHeaderLogo;

  return (
    <Box bg='primary.2' height='100vh'>
      <Box h='140px' w='100%' py='0' bg='primary.1' pos='relative'>
        <HeaderLogo />
      </Box>
      {children}
    </Box>
  );
}
