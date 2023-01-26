import * as React from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Link,
  ListItem,
  UnorderedList,
  Image,
  Box,
} from '@chakra-ui/react';
import { useLogout } from '@/modules/hooks/useLogout.hook';

export interface ISideNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideNav({ isOpen, onClose }: ISideNavProps) {
  const { signOutWithMutate } = useLogout();

  return (
    <>
      <Drawer placement='left' onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader bg='primary.1' h='110px'>
            <Box>
              <Image src='/logo_white.png' alt='Hydro Resort Logo' h='170px' marginTop='-50px' marginLeft='-5px' />
            </Box>
          </DrawerHeader>
          <DrawerBody>
            <UnorderedList
              listStyleType='none'
              spacing='2'
              mt='30px'
              color='primary.1'
              fontWeight='semibold'
              fontFamily='primary'
            >
              <ListItem _hover={{ bg: 'primary.1', color: 'white' }} p='7px' borderRadius='md' bg='gray.200'>
                <Link
                  href='/admin/bookings'
                  outline='0'
                  _active={{ textDecoration: 'none', outline: '0' }}
                  _focus={{ outline: '0' }}
                >
                  BOOKING RECORDS
                </Link>
              </ListItem>
              <ListItem _hover={{ bg: 'primary.1', color: 'white' }} p='7px' borderRadius='md' bg='gray.200'>
                <Link
                  href='/admin/products'
                  outline='0'
                  _active={{ textDecoration: 'none', outline: '0' }}
                  _focus={{ outline: '0' }}
                >
                  PRODUCTS
                </Link>
              </ListItem>
              <ListItem
                _hover={{ bg: 'primary.1', color: 'white' }}
                p='7px'
                borderRadius='md'
                bg='gray.200'
                onClick={() => signOutWithMutate()}
              >
                LOGOUT
              </ListItem>
            </UnorderedList>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
