import React from 'react';
import Link from 'next/link';
import { Box, Menu, MenuButton, MenuList, MenuItem, IconButton, Text, Button, chakra, Hide } from '@chakra-ui/react';
import { RxHamburgerMenu, RxChevronDown } from 'react-icons/rx';
import GetAppComp from '@/appspecs/components';

const HamburgerIcon = chakra(RxHamburgerMenu);

export default function Layout({ children }: any) {
  const HeaderLogo = GetAppComp.AppHeaderLogo;

  return (
    <Box bg='primary.2' height='100vh' overflowY='auto'>
      <Box h='140px' w='100%' py='0' bg='primary.1' pos='relative'>
        <HeaderLogo />

        <Box position='absolute' right={8} top={12}>
          <Menu>
            <Hide above='md'>
              <MenuButton
                as={IconButton}
                aria-label='Options'
                icon={<HamburgerIcon width='30px' height='30px' />}
                variant='solid'
                bg='primary.1'
                display={{ base: 'flex', md: 'none' }}
              />
            </Hide>
            <Hide below='md'>
              <MenuButton as={Button} rightIcon={<RxChevronDown />} display={{ base: 'none', md: 'flex' }} variant='ghost'>
                Manage Booking
              </MenuButton>
            </Hide>
            <MenuList>
              <MenuItem>
                <Link href='/'>
                  <Text>Book a Date</Text>
                </Link>
              </MenuItem>
              <MenuItem>
                <Link href='/booking/cancel'>
                  <Text>Cancel Booking</Text>
                </Link>
              </MenuItem>
              <MenuItem>
                <Link href='/booking/update'>
                  <Text>Update Booking</Text>
                </Link>
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      <Box w='100%' maxW={{ lg: 'container.xl' }} mx='auto'>
        {children}
      </Box>
    </Box>
  );
}
