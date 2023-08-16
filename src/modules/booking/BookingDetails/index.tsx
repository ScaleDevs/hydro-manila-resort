import * as React from 'react';
import { UseTRPCQueryResult } from '@trpc/react-query/shared';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/routers/_app';
import { TRPCClientErrorLike } from '@trpc/react-query';
import { Box, Spinner, SlideFade, Heading, Stack, Divider, Text } from '@chakra-ui/react';

import { tableFormatTimeDisplay } from '@/modules/utils/helper';
import { PHpeso } from '@/utils/helper';

export interface IDetailsProps {
  isIn?: boolean;
  isLoading: boolean;
  data: UseTRPCQueryResult<inferRouterOutputs<AppRouter>['booking']['getBookingByRefNo'], TRPCClientErrorLike<AppRouter>>['data'];
}

export function Details({ isLoading, isIn, data }: IDetailsProps) {
  const getConvenienceFee = () => {
    if (!data?.receipt) return 0;

    let total = 0;

    total += data.receipt.productPrice;
    total += data.receipt.roomPrice || 0;
    total += data.receipt.additionalHeadsPrice || 0;

    return (data.receipt.bookingFee / 100) * total;
  };

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        {isLoading ? (
          <Spinner size='lg' />
        ) : (
          <>
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
                <Text>Guests (Overnight):</Text>
                <Text>{data?.guests.overNightGuests || 0}</Text>
              </Stack>

              <Divider borderColor='gray.400' />

              <Stack spacing={0} direction='row' justifyContent='space-between'>
                <Text>Guests (Non-Overnight):</Text>
                <Text>{data?.guests.nonOverNightGuests || 0}</Text>
              </Stack>

              <Divider borderColor='gray.400' />

              <Stack spacing={0} direction='row' justifyContent='space-between'>
                <Text>ROOM:</Text>
                {!!data?.product.isAllRooms ? (
                  <Text>Whole Place</Text>
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
          </>
        )}
      </Box>

      <br />

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
    </SlideFade>
  );
}
