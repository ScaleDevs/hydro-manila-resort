import { ReactNode } from 'react';
import { UseTRPCQueryResult } from '@trpc/react-query/shared';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/routers/_app';
import { TRPCClientErrorLike } from '@trpc/react-query';
import { Box, Spinner, SlideFade, Heading, Stack, Divider, Text, Badge, VStack } from '@chakra-ui/react';

import { tableFormatTimeDisplay } from '@/modules/utils/helper';
import { PHpeso } from '@/utils/helper';

const InfoField = ({ label, value = 'N/A', children }: { label: string; value?: string | number; children?: ReactNode }) => {
  return (
    <VStack spacing={0} align='flex-start' wordBreak='break-word'>
      <Text color='gray.500' fontSize='sm'>
        {label}:
      </Text>
      {value ? <Text>{value}</Text> : children}
    </VStack>
  );
};

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
            <Stack direction='row' align='end'>
              <Badge py={3} px={5} variant='subtle' colorScheme='green' fontFamily='primary'>
                BOOKED
              </Badge>
              <Stack spacing={0} justifyContent='space-between'>
                <Text color='gray.400' fontSize='sm'>
                  Reference No:
                </Text>
                <Text fontSize={{ base: 'sm', md: 'md' }}>{data?.ref_no}</Text>
              </Stack>
            </Stack>

            <br />
            <Stack direction={{ base: 'column', lg: 'row' }} justify='space-around' minH='210px'>
              <VStack align='flex-start'>
                <Heading size='md'>Personal Details</Heading>
                <InfoField label='Name' value={data?.name} />
                <InfoField label='Email' value={data?.email} />
                <InfoField label='Phone' value={data?.phoneNumber} />
              </VStack>

              <Box bg='gray.400' w='0.5px' />

              <Stack>
                <Heading size='md'>Booking Details</Heading>
                <Stack direction='row' align='flex-start' spacing={10}>
                  <VStack align='flex-start'>
                    <InfoField label='Type' value={data?.product.name} />
                    <InfoField label='Check In' value={tableFormatTimeDisplay(data?.startSession as string)} />
                    <InfoField label='Check Out' value={tableFormatTimeDisplay(data?.endSession as string)} />
                  </VStack>
                  <VStack align='flex-start'>
                    <InfoField label='Guests (Overnight)' value={data?.guests.overNightGuests || 0} />
                    <InfoField label='Guests (Non-Overnight)' value={data?.guests.nonOverNightGuests || 0} />
                    <InfoField label='ROOM'>
                      {!!data?.product.isAllRooms ? (
                        <Text>Whole Place</Text>
                      ) : (
                        <Text>
                          {data?.roomsObject && data?.roomsObject.length > 0
                            ? data.roomsObject.map((info) => info.roomIdentityName).join(', ')
                            : 'N/A'}
                        </Text>
                      )}
                    </InfoField>
                  </VStack>
                </Stack>
              </Stack>

              <Box bg='gray.400' w='0.5px' />

              <VStack align='flex-start'>
                <Heading size='md'>Extra Details</Heading>
                <InfoField label='Payment ID' value={data?.paymentId} />
                <InfoField label='Created At' value={data?.createdAt} />
              </VStack>
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
            <Heading size='lg' fontFamily='primary'>
              RECEIPT
            </Heading>
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
