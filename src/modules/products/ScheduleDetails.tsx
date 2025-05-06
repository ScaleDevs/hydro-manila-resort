import * as React from 'react';
import { Stack, Box, Center, Heading, Spinner, VStack, Text, SlideFade, HStack, Divider, Button } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { BsTrash } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import { PHpeso } from '../utils/helper';

export interface IScheduleDetailsProps {
  id: string;
  isIn?: boolean;
}

const InfoField = ({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) => {
  return (
    <VStack spacing={0} align='flex-start' wordBreak='break-word'>
      <Text color='gray.500' fontSize='sm'>
        {label}:
      </Text>
      {!!children ? children : <Text>{value || 'N/A'}</Text>}
    </VStack>
  );
};

export function ScheduleDetails({ id, isIn }: IScheduleDetailsProps) {
  const { data, isLoading, refetch } = trpc.product.getProductById.useQuery(id);
  const { mutate, isLoading: deletingPromo } = trpc.product.deletePromoByIdx.useMutation();

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Stack spacing={3}>
        <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
          {isLoading ? (
            <Center minH='210px'>
              <VStack gap='3'>
                <Spinner size='lg' />
                <Text>Fetching Details ...</Text>
              </VStack>
            </Center>
          ) : (
            <>
              <Stack direction={{ base: 'column', lg: 'row' }} justify='space-left' minH='210px' gap={20}>
                <VStack align='flex-start'>
                  <Heading size='md'>Product Details</Heading>
                  <InfoField label='Id' value={data?.productId} />
                  <InfoField label='Name' value={data?.name} />
                  <InfoField label='Price' value={!!data?.price ? PHpeso.format(data?.price) : 'N/A'} />
                </VStack>

                <Box bg='gray.400' w='0.5px' />

                <Stack>
                  <Heading size='md'>Schedule Details</Heading>
                  <Stack direction='row' align='flex-start' spacing={10}>
                    <VStack align='flex-start'>
                      <InfoField label='Start' value={data?.scheduleStart} />
                      <InfoField label='End' value={data?.scheduleEnd} />
                      <InfoField label='IS Overnight' value={!!data?.scheduleEndNextDay ? 'Yes' : 'No'} />
                    </VStack>
                  </Stack>
                </Stack>

                <Box bg='gray.400' w='0.5px' />

                <VStack align='flex-start'>
                  <Heading size='md'>Room Details</Heading>
                  <InfoField label='Number of rooms included' value={data?.includedRooms?.length ?? 'None'} />
                  <InfoField label='Is Whole Place Included' value={!!data?.isAllRooms ? 'Yes' : 'No'} />
                </VStack>
              </Stack>
            </>
          )}
        </Box>

        <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
          <Stack direction={{ base: 'column', lg: 'row' }} justify='space-left' minH='210px' gap={20}>
            <VStack align='flex-start'>
              <Heading size='md'>Guest Details (Non Overnight)</Heading>
              <InfoField label='Minimum Non Overnight Pax' value={data?.guestSetting.minNonOverNightGuestPax} />
              <InfoField label='Maximum Non Overnight Pax' value={data?.guestSetting.maxNonOverNightGuestPax} />
              <InfoField
                label='Extra Non Overnight Fee'
                value={!!data?.guestSetting.nonOverNightGuestFee ? PHpeso.format(data?.guestSetting.nonOverNightGuestFee) : 'N/A'}
              />
            </VStack>
            <VStack align='flex-start'>
              <Heading size='md'>Guest Details (Overnight)</Heading>
              <InfoField label='Minimum Overnight Pax' value={data?.guestSetting.minOverNightGuestPax} />
              <InfoField label='Maximum Overnight Pax' value={data?.guestSetting.maxOverNightGuestPax} />
              <InfoField
                label='Extra Overnight Fee'
                value={!!data?.guestSetting.overNightGuestFee ? PHpeso.format(data?.guestSetting.overNightGuestFee) : 'N/A'}
              />
            </VStack>
          </Stack>
        </Box>

        <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
          <Stack direction={{ base: 'column' }} minH='210px' gap={1}>
            {data?.promos.map((v, promoIdx) => (
              <Stack key={promoIdx}>
                <HStack>
                  <Heading size='md' whiteSpace='nowrap'>
                    Promo Details
                  </Heading>
                  <Divider borderColor='blackAlpha.600' />
                </HStack>

                <Stack flexDir='row' justifyContent='space-between' alignItems='center'>
                  <Stack>
                    <HStack align='flex-start' flexWrap='wrap' gap={5}>
                      <InfoField label='Name' value={v.promoName} />
                      <InfoField label='Pax' value={v.paxInclusion ?? 'N/A'} />
                      <InfoField label='Start' value={dayjs(v.promoStart).format('MMM DD, YYYY')} />
                      <InfoField
                        label='End'
                        value={dayjs.utc(v.promoEnd).tz(process.env.NEXT_PUBLIC_TIMEZONE).format('MMM DD, YYYY')}
                      />
                      <InfoField label='Price' value={!!v?.price ? PHpeso.format(v?.price) : 'N/A'} />
                    </HStack>

                    <Stack spacing={0}>
                      <Text color='gray.500' fontSize='sm'>
                        Day Rates: {v.dayRates.length > 0 ? '' : 'N/A'}
                      </Text>
                      <VStack align='flex-start'>
                        {v.dayRates.map((v, idx) => (
                          <Box key={idx}>
                            <Text>Price: {PHpeso.format(v.price)}</Text>
                            <Text>{v.days.map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}</Text>
                          </Box>
                        ))}
                      </VStack>
                    </Stack>
                  </Stack>

                  <Button
                    type='button'
                    onClick={() =>
                      mutate(
                        { productId: data.productId, idxToRemove: promoIdx },
                        {
                          onSuccess() {
                            refetch();
                          },
                        },
                      )
                    }
                    bg='red.400'
                    rounded='md'
                    _hover={{
                      bg: 'red.300',
                    }}
                  >
                    {deletingPromo ? <Spinner size='sm' /> : <BsTrash />}
                  </Button>
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>
    </SlideFade>
  );
}
