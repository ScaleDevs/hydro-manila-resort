import { useState, useEffect } from 'react';
import Image from 'next/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Heading,
  VStack,
  Text,
  Box,
  Button,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Center,
} from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { BookingStatusDisplay } from '@/utils/types';
import GetAppComp from '@/appspecs/components';
import { GetApp } from '@/appspecs/theme';

const Component = ({ payment_intent_id }: { payment_intent_id: string }) => {
  const [statusDisplay, setStatusDisplay] = useState<BookingStatusDisplay | null>(null);
  const [confirmType, setConfirmType] = useState<'CREATE' | 'UPDATE'>('CREATE');

  const { data, isLoading } = trpc.payment.getPaymentIntentSession.useQuery({ paymentIntentId: payment_intent_id as string });

  const retryPayment = () => {
    if (data && data.attributes.next_action?.redirect?.url) window.location.href = data.attributes.next_action.redirect.url;
  };

  useEffect(() => {
    const result = data?.attributes as any;
    if (!result) return;
    const metadata = result.metadata;

    if (!!metadata.bookingUpdateParams) setConfirmType('UPDATE');
    if (metadata.statusDisplay) setStatusDisplay(JSON.parse(metadata.statusDisplay));
  }, [data]);

  return (
    <>
      <Head>
        <title>Booking | Status</title>
        <meta name='description' content='checking the status of booking' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>
      <Box h='100vh'>
        <br /> <br />
        <VStack spacing={10}>
          <Center h='150px' w={{ base: '250px', md: '300px' }}>
            <Image src={GetAppComp.ImgSrcLogoNonWhite} alt='Logo' width={300} height={300} />
          </Center>

          {isLoading && (
            <Stack justifyContent='center' alignItems='center' spacing={5}>
              <Text fontSize='x-large'>Resolving Payment</Text>
              <Spinner />
            </Stack>
          )}

          {data?.attributes.status === 'awaiting_next_action' && (
            <Button bg='primary.1' borderRadius='sm' size='lg' onClick={retryPayment}>
              RETRY PAYMENT!
            </Button>
          )}

          {data?.attributes.status === 'succeeded' && (
            <>
              <TableContainer>
                <Table size='sm' variant='simple' fontFamily='primary'>
                  <Tbody>
                    <Tr>
                      <Td fontWeight='semibold'>REFERENCE</Td>
                      <Td>{statusDisplay?.ref_no}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight='semibold'>NAME</Td>
                      <Td>{statusDisplay?.customerName}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight='semibold'>DATE</Td>
                      <Td>{statusDisplay?.bookedDate}</Td>
                    </Tr>
                    <Tr>
                      <Td fontWeight='semibold'>SCHEDULE</Td>
                      <Td>{statusDisplay?.scheduleType}</Td>
                    </Tr>
                    {statusDisplay && statusDisplay.guests.nonOverNightGuests > 0 && (
                      <Tr>
                        <Td fontWeight='semibold'>GUESTS (Non-Overnight)</Td>
                        <Td>{statusDisplay.guests.nonOverNightGuests}</Td>
                      </Tr>
                    )}
                    {statusDisplay && statusDisplay.guests.overNightGuests > 0 && (
                      <Tr>
                        <Td fontWeight='semibold'>GUESTS (Overnight)</Td>
                        <Td>{statusDisplay.guests.overNightGuests}</Td>
                      </Tr>
                    )}
                    {statusDisplay && statusDisplay?.roomName !== 'Whole Place' && (
                      <Tr>
                        <Td fontWeight='semibold'>ROOM</Td>
                        <Td>{statusDisplay.roomName}</Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </TableContainer>
              <Box bg='primary.1' p='20px' borderRadius='sm'>
                <Heading color='white' as='h1'>
                  PAYMENT COMPLETE!
                </Heading>
              </Box>
            </>
          )}
          {data?.attributes.status === 'succeeded' && (
            <Box w='90%'>
              <Text mt='10px' textAlign='center'>
                You should receive an email within a few minutes for the confirmation regarding your{' '}
                {confirmType === 'UPDATE' ? 'update' : 'booking'}.
              </Text>
              <Text mt='5px' textAlign='center'>
                If you have not receive any email after waiting long then kindly contact our team at{' '}
                {process.env.NEXT_PUBLIC_SUPPORT_EMAIL || ''} to confirm your booking schedule.
              </Text>
              <br /> <br />
            </Box>
          )}
        </VStack>
      </Box>
    </>
  );
};

export default function SuccessPayment() {
  const router = useRouter();

  if (!router.query.payment_intent_id) return '';

  return <Component payment_intent_id={router.query.payment_intent_id as string} />;
}
