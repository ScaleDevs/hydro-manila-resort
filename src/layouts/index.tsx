import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Stack, Menu, MenuButton, MenuList, MenuItem, IconButton, Text, Button, chakra, Hide } from '@chakra-ui/react';
import { RxHamburgerMenu, RxChevronDown } from 'react-icons/rx';

const HamburgerIcon = chakra(RxHamburgerMenu);

export default function Layout({ children }: any) {
  return (
    <Box bg='primary.2' height='100vh' overflowY='auto'>
      <Box h='100px' w='100%' py='0' bg='primary.1' pos='relative'>
        <Stack position='absolute' mt='-57px' left={{ base: '100px', md: '50%' }} transform='translateX(-50%)'>
          <Image src='/logo_white.png' alt='Hydro Resort Logo' width={200} height={200} priority />
        </Stack>

        <Box position='absolute' right={5} top={7}>
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
                <Text color='white'>Manage Booking</Text>
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
