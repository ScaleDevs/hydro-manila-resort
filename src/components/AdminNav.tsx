import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Center, Button, chakra, Divider, SlideFade, VStack, Collapse } from '@chakra-ui/react';
import { BsFillArrowLeftSquareFill, BsFillArrowRightSquareFill, BsBook } from 'react-icons/bs';
import { BiLogOut } from 'react-icons/bi';
import { FaSwimmingPool } from 'react-icons/fa';
import { RxHamburgerMenu } from 'react-icons/rx';
import { BsCalendarEvent } from 'react-icons/bs';
import { IconType } from 'react-icons/lib';

import { useLogout } from '@/modules/hooks/useLogout.hook';
import useAppStoreTrack from '@/store/app.store';
import { GetApp } from '@/appspecs/theme';
import GetAppComp from '@/appspecs/components';

const RightArrowIconButton = chakra(BsFillArrowRightSquareFill);
const LeftArrowIconButton = chakra(BsFillArrowLeftSquareFill);
const ChakraLink = chakra(Link);
const HamburgerIcon = chakra(RxHamburgerMenu);
const CalendarIcon = chakra(BsCalendarEvent);

interface IParentLinkProps {
  Icon: IconType;
  appStateName: 'productsLinksOpen' | 'bookingLinksOpen';
  isOpen: boolean;
  headTitle: string;
  links: {
    path: string;
    title: string;
  }[];
}

const ParentLink = ({ Icon, appStateName, isOpen, links, headTitle }: IParentLinkProps) => {
  const router = useRouter();
  const { setToggleState } = useAppStoreTrack();

  const onToggle = () => {
    setToggleState(appStateName);
  };

  return (
    <>
      <Button
        fontWeight='normal'
        fontSize='20px'
        w='100%'
        justifyContent='left'
        leftIcon={<Icon />}
        onClick={() => onToggle()}
        variant='ghost'
      >
        {headTitle}
      </Button>
      <Collapse in={isOpen} animateOpacity>
        <VStack borderLeft='1px solid' borderColor='gray.200' pl='10px'>
          {links.map((val, index) => (
            <ChakraLink key={index} href={val.path} w='100%'>
              <Button
                fontWeight='normal'
                fontSize='md'
                w='100%'
                justifyContent='left'
                isActive={router.pathname === val.path}
                variant='ghost'
              >
                {val.title}
              </Button>
            </ChakraLink>
          ))}
        </VStack>
      </Collapse>
    </>
  );
};

export default function AdminNav() {
  const router = useRouter();
  const { sideNavOpen, setAppState, productsLinksOpen, bookingLinksOpen } = useAppStoreTrack();
  const { signOutWithMutate } = useLogout();

  const onToggle = () => {
    setAppState('sideNavOpen', !sideNavOpen);
  };

  return (
    <>
      <HamburgerIcon
        position='absolute'
        top='20px'
        right='25px'
        h='35px'
        w='35px'
        zIndex={10}
        display={{ md: 'none' }}
        onClick={() => onToggle()}
      />
      <Box
        bg='primary.1'
        h='100%'
        w={sideNavOpen ? '260px' : { base: '0px', md: '50px', lg: '70px' }}
        position={{ base: 'absolute', md: 'relative' }}
        zIndex={10}
        transition='width 0.4s'
      >
        {!sideNavOpen ? (
          <SlideFade in={!sideNavOpen}>
            <Center p={{ base: '10px', lg: '20px' }}>
              <RightArrowIconButton
                onClick={() => onToggle()}
                w='35px'
                h='35px'
                color='gray.300'
                transition='color 0.5s'
                _hover={{ cursor: 'pointer', color: GetApp.HoverButton }}
              />
            </Center>
          </SlideFade>
        ) : (
          <SlideFade in={sideNavOpen}>
            <Center h='150px'>
              <Image src={GetAppComp.ImgSrcLogo} width={200} height={200} alt='Hydro Resort Logo' />
            </Center>
            <Divider borderColor='gray' w='100%' />

            <VStack h='100%' w='90%' mx='auto' mt='20px'>
              <ParentLink
                isOpen={bookingLinksOpen}
                headTitle='BOOKINGS'
                appStateName='bookingLinksOpen'
                links={[
                  { path: '/admin/bookings', title: 'RECORDS' },
                  { path: '/admin/bookings/settings', title: 'SETTINGS' },
                ]}
                Icon={BsBook}
              />

              <ChakraLink href='/admin/events' w='100%'>
                <Button
                  fontWeight='normal'
                  fontSize='20px'
                  w='100%'
                  justifyContent='left'
                  leftIcon={<CalendarIcon />}
                  isActive={router.pathname === '/admin/scheduledevent'}
                  variant='ghost'
                >
                  EVENT
                </Button>
              </ChakraLink>

              <ParentLink
                isOpen={productsLinksOpen}
                headTitle='PRODUCT'
                appStateName='productsLinksOpen'
                links={[
                  { path: '/admin/products/schedules', title: 'SCHEDULES' },
                  { path: '/admin/products/rooms', title: 'ROOMS' },
                ]}
                Icon={FaSwimmingPool}
              />

              <Button
                fontWeight='normal'
                fontSize='20px'
                onClick={() => signOutWithMutate()}
                w='100%'
                justifyContent='left'
                leftIcon={<BiLogOut />}
                variant='ghost'
              >
                LOGOUT
              </Button>
            </VStack>

            <Center p='20px'>
              <LeftArrowIconButton
                onClick={() => onToggle()}
                w='35px'
                h='35px'
                color='gray.300'
                transition='color 0.5s'
                _hover={{ cursor: 'pointer', color: GetApp.HoverButton }}
              />
            </Center>
          </SlideFade>
        )}
      </Box>
    </>
  );
}
