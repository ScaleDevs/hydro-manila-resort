import { Dispatch, SetStateAction } from 'react';
import { Box, Skeleton, Stack, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { trpc } from '@/utils/trpc';
import { PHpeso, getISOFormatFromSchedule } from '@/utils/helper';
import { IProduct } from '@/utils/types';
import { GetApp } from '@/appspecs/theme';

const transformSchedule = (schedule: string) => {
  const schedArr = schedule.split(' ');
  const timeSplit = schedArr[0].split(':');

  return timeSplit[0] + ':' + timeSplit[1] + ' ' + schedArr[1];
};

export interface IChooseScheduleProps {
  chosenDate: string | null;
  chosenSchedule: IProduct | null;
  setChosenSchedule: Dispatch<SetStateAction<IProduct | null>>;
}

export function ChooseSchedule({ chosenDate, chosenSchedule, setChosenSchedule }: IChooseScheduleProps) {
  const { data: productsData, isLoading: isFetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });

  const { data, isLoading: isFetchingBookedDates } = trpc.booking.getAllBookingsByDates.useQuery({
    startDate: dayjs(chosenDate).subtract(2, 'd').format(),
    endDate: dayjs(chosenDate).add(2, 'd').format(),
  });

  const handleChosenSchedule = (product: IProduct) => setChosenSchedule(product);

  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>
        Choose Time:
      </Text>
      <br />
      <Stack
        direction='column'
        justifyContent={{ base: 'start', md: 'center' }}
        alignItems='center'
        spacing={1.5}
        mx='auto'
        overflowX='auto'
      >
        {isFetchingProducts || isFetchingBookedDates ? (
          <>
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
          </>
        ) : (
          productsData?.records.map((record, index) => {
            const isActive = chosenSchedule?.productId === record.productId;
            let isBlocked = false;

            if (!!data) {
              const startDate = dayjs
                .tz(
                  dayjs(getISOFormatFromSchedule(`${chosenDate} ${record.scheduleStart}`)).format('YYYY-MM-DDTHH:mm'),
                  process.env.NEXT_PUBLIC_TIMEZONE,
                )
                .unix();

              const endDate = dayjs
                .tz(
                  dayjs(getISOFormatFromSchedule(`${chosenDate} ${record.scheduleEnd}`)).format('YYYY-MM-DDTHH:mm'),
                  process.env.NEXT_PUBLIC_TIMEZONE,
                )
                .add(!!record.scheduleEndNextDay ? 1 : 0, 'd')
                .unix();

              Object.values(data.bookedDates).forEach((entry) => {
                entry?.forEach((check) => {
                  if (check.start <= startDate && check.end > startDate) isBlocked = true;
                  else if (check.start < endDate && check.end >= endDate) isBlocked = true;
                  else if (check.start > startDate && check.end < endDate) isBlocked = true;
                });
              });
            }

            return (
              <Stack
                key={index}
                direction='row'
                bg={isActive ? GetApp.ActiveColor : isBlocked ? 'blackAlpha.500' : 'blackAlpha.100'}
                borderRadius='10px'
                w='100%'
                py='7'
                justifyContent='space-around'
                cursor={isBlocked ? 'not-allowed' : 'pointer'}
                _hover={isActive || isBlocked ? {} : { bg: 'blackAlpha.300' }}
                transition='background-color 0.25s'
                onClick={() => !isBlocked && handleChosenSchedule(record)}
              >
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {`${transformSchedule(record.scheduleStart)} - ${transformSchedule(record.scheduleEnd)}`}
                </Text>
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {record.withRooms ? 'WITH ROOMS' : 'NO ROOMS'}
                </Text>
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {PHpeso.format(record.price)}
                </Text>
              </Stack>
            );
          })
        )}
      </Stack>
    </Box>
  );
}
