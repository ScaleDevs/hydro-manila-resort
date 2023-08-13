import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Box, Button, Divider, Heading, SlideFade, Spinner, Stack, Text } from '@chakra-ui/react';

import Layout from '@/layouts/admin';
import { trpc } from '@/utils/trpc';
import { PHpeso, tableFormatTimeDisplay } from '@/modules/utils/helper';
import AdminEditBookingForm from '@/modules/booking/AdminEditBookingForm';
import { GetApp } from '@/appspecs/theme';

interface Props {
  id: string;
}

function Component({ id }: Props) {
  const [showReschedForm, setShowReschedForm] = useState(false);
  const { data, isLoading } = trpc.booking.getBookingByRefNo.useQuery(id);

  const getConvenienceFee = () => {
    if (!data?.receipt) return 0;

    let total = 0;

    total += data.receipt.productPrice;
    total += data.receipt.roomPrice || 0;
    total += data.receipt.additionalHeadsPrice || 0;

    return (data.receipt.bookingFee / 100) * total;
  };

  return (
    <Layout>
      <Head>
        <title>Admin | Bookings Details</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack w='100%' alignItems='flex-end'>
        <Button onClick={() => setShowReschedForm(!showReschedForm)}>{showReschedForm ? 'BACK' : 'EDIT'}</Button>
      </Stack>

      {showReschedForm ? (
        <AdminEditBookingForm bookingRefNo={id} />
      ) : (
        <>
          <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
            {isLoading ? (
              <Spinner size='lg' />
            ) : (
              <SlideFade in>
                <Heading textAlign='center'>BASIC DETAILS</Heading>
                <br />
                <Stack spacing={2}>
                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Reference No:</Text>
                    <Text>{data?.ref_no}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Status:</Text>
                    <Text>{data?.refundId ? 'REFUNDED' : 'BOOKED'}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Name:</Text>
                    <Text>{data?.name}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Email:</Text>
                    <Text>{data?.email}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Contact Number:</Text>
                    <Text>{data?.phoneNumber}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Schedule Type:</Text>
                    <Text>{data?.product.name}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Start Schedule:</Text>
                    <Text>{tableFormatTimeDisplay(data?.startSession as string)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>End Schedule:</Text>
                    <Text>{tableFormatTimeDisplay(data?.endSession as string)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Guests (Non-Overnight):</Text>
                    <Text>{data?.guests.nonOverNightGuests || 0}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Guests (Overnight):</Text>
                    <Text>{data?.guests.overNightGuests || 0}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>ROOM:</Text>
                    {!!data?.product.isAllRooms ? (
                      <Text>All Rooms</Text>
                    ) : (
                      <Text>
                        {data?.roomsObject && data?.roomsObject.length > 0
                          ? data.roomsObject.map((info) => info.roomIdentityName).join(', ')
                          : 'N/A'}
                      </Text>
                    )}
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>PAYMENT ID:</Text>
                    <Text>{data?.paymentId}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>Created At:</Text>
                    <Text>{tableFormatTimeDisplay(data?.createdAt || '')}</Text>
                  </Stack>
                </Stack>
              </SlideFade>
            )}
          </Box>

          <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
            {isLoading || !data ? (
              <Spinner size='lg' />
            ) : (
              <SlideFade in>
                <Heading textAlign='center'>RECEIPT DETAILS</Heading>
                <br />
                <Stack spacing={2}>
                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>PRODUCT PRICE:</Text>
                    <Text>{PHpeso.format(data?.receipt.productPrice)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>ROOM PRICE:</Text>
                    <Text>{PHpeso.format(data?.receipt.roomPrice || 0)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>ADDITIONAL HEADS PRICE:</Text>
                    <Text>{PHpeso.format(data?.receipt.additionalHeadsPrice || 0)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>CONVENIENCE FEE:</Text>
                    <Text>{PHpeso.format(getConvenienceFee())}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />

                  <Stack spacing={0} direction='row' justifyContent='space-between'>
                    <Text>TOTAL:</Text>
                    <Text>{PHpeso.format(data.receipt.total)}</Text>
                  </Stack>

                  <Divider borderColor='gray.400' />
                </Stack>
              </SlideFade>
            )}
          </Box>
        </>
      )}
    </Layout>
  );
}

function Bookings() {
  const router = useRouter();

  if (router.query.id) return <Component id={router.query.id as string} />;

  return '';
}

export default Bookings;
