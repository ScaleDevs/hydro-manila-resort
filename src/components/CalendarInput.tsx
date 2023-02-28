import { useEffect, useState } from 'react';
import { Box, Center, Grid, GridItem, Heading, HStack, Skeleton, Text, chakra } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { UseFormSetValue } from 'react-hook-form';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import { IBookingDates } from '@/server/repository/booking.repo';

const LeftArrowIcon = chakra(BsChevronLeft);
const RightArrowIcon = chakra(BsChevronRight);

const isDateBlocked = (currentDay: number, month: number, data?: { bookedDates: IBookingDates }, product?: IProduct) => {
  const dayjsInstance = dayjs().add(month, 'M');
  const key1 = `${dayjsInstance.format('YYYY-MM')}-${currentDay < 10 ? `0${currentDay}` : currentDay}`;
  const key2 = `${dayjsInstance.format('YYYY-MM')}-${currentDay < 10 ? `0${currentDay + 1}` : currentDay + 1}`;
  const isDateBeforeToday = dayjs(key1).unix() < dayjs().unix();
  // if (product) {
  //   const productDetails = product.details[product.activeVersion - 1];
  //   const startDate = dayjs
  //     .tz(dayjs(`${key1} ${productDetails.scheduleStart}`).format('YYYY-MM-DDTHH:mm'), process.env.NEXT_PUBLIC_TIMEZONE)
  //     .unix();
  //   const endDate = dayjs
  //     .tz(dayjs(`${key1} ${productDetails.scheduleEnd}`).format('YYYY-MM-DDTHH:mm'), process.env.NEXT_PUBLIC_TIMEZONE)
  //     .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'd')
  //     .unix();
  //   if (!isDateBeforeToday && data && (data.bookedDates[key1] || data.bookedDates[key2])) {
  //     if (data.bookedDates[key1])
  //       for (const check of data.bookedDates[key1]) {
  //         if (startDate >= check.start && startDate < check.end) return true;
  //         if (endDate > check.start && endDate <= check.end) return true;
  //         if (startDate < check.start && endDate > check.end) return true;
  //       }
  //     if (data.bookedDates[key2])
  //       for (const check of data.bookedDates[key2]) {
  //         if (startDate >= check.start && startDate < check.end) return true;
  //         if (endDate > check.start && startDate <= check.end) return true;
  //         if (startDate < check.start && endDate > check.end) return true;
  //       }
  //   } else if (isDateBeforeToday) return true;
  // } else if (isDateBeforeToday) return true;

  console.log(currentDay, month, data, product, key2, isDateBeforeToday);

  return false;
};

const CalCell = ({ children }: { children: any }) => {
  return (
    <Box w='50px'>
      <Text textAlign='center'>{children}</Text>
    </Box>
  );
};

interface ICalenderInputProps {
  setValue: UseFormSetValue<any>;
  errMsg?: string;
  product?: IProduct;
}

export default function CalenderInput({ setValue, product, errMsg }: ICalenderInputProps) {
  const [month, setMonth] = useState(0);
  const [selectedDate, setSelecetedDate] = useState<string | null>();
  const { data, isLoading } = trpc.booking.getAllBookingsByDates.useQuery({
    startDate: dayjs().add(month, 'M').startOf('M').subtract(2, 'd').format(),
    endDate: dayjs().add(month, 'M').endOf('M').add(1, 'd').format(),
  });

  const handleChange = (value: any) => {
    const dayjsInstance = dayjs().add(month, 'M');
    const dateValue = dayjs(`${dayjsInstance.year()}-${dayjsInstance.month() + 1}-${value}`).format('YYYY-MM-DD');
    setSelecetedDate(dayjs(`${dayjsInstance.year()}-${dayjsInstance.month() + 1}-${value}`).format('YYYY-MM-DD'));
    setValue('bookingDate', dateValue);
  };

  useEffect(() => {
    setSelecetedDate(null);
    setValue('bookingDate', '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  return (
    <Box maxW={{ base: '100%' }} mx='auto'>
      <Heading size='md' textAlign={{ base: 'left', md: 'center' }} color='primary.1'>
        CHOOSE A DATE
      </Heading>
      <Box border='1px solid' borderColor='secondary.2' p='3' bg='white'>
        <HStack justifyContent='center'>
          <LeftArrowIcon onClick={() => setMonth((currVal) => --currVal)} _hover={{ cursor: 'pointer' }} />

          <Heading size='md' textAlign='center' color='primary.1'>
            {dayjs().add(month, 'M').format('MMMM YYYY')}
          </Heading>

          <RightArrowIcon onClick={() => setMonth((currVal) => ++currVal)} _hover={{ cursor: 'pointer' }} />
        </HStack>

        <HStack w='100%' borderY='2px' borderColor='black' justifyContent='center' spacing='2'>
          <CalCell>Sun</CalCell>
          <CalCell>Mon</CalCell>
          <CalCell>Tue</CalCell>
          <CalCell>Wed</CalCell>
          <CalCell>Thu</CalCell>
          <CalCell>Fri</CalCell>
          <CalCell>Sat</CalCell>
        </HStack>

        {isLoading ? (
          <Grid w='100%' justifyContent='center' templateColumns='repeat(7, 1fr)' gap='2' mt='10px'>
            {Array(dayjs().add(month, 'M').startOf('M').day())
              .fill(1)
              .map((item, i) => {
                return (
                  <GridItem key={i} textAlign='center' py='5px' _hover={{ bg: 'secondary.1', cursor: 'pointer' }}>
                    {' '}
                  </GridItem>
                );
              })}
            {Array(dayjs().add(month, 'M').daysInMonth())
              .fill(1)
              .map((item, i) => {
                const currentDay = i + item;
                return (
                  <GridItem
                    key={i}
                    textAlign='center'
                    py='5px'
                    border={!!selectedDate && dayjs(selectedDate).date() === currentDay ? '2px solid' : ''}
                    borderColor={!!selectedDate && dayjs(selectedDate).date() === currentDay ? 'primary.1' : ''}
                    color='black'
                    _hover={{ bg: 'secondary.1', cursor: 'pointer' }}
                    onClick={() => handleChange(currentDay)}
                  >
                    <Center>
                      <Skeleton height='30px' w='30px' />
                    </Center>
                  </GridItem>
                );
              })}
          </Grid>
        ) : (
          <Grid w='100%' justifyContent='center' templateColumns='repeat(7, 1fr)' gap='2' mt='10px'>
            {Array(dayjs().add(month, 'M').startOf('M').day())
              .fill(1)
              .map((item, i) => {
                return (
                  <GridItem key={i} textAlign='center' py='5px' _hover={{ bg: 'secondary.1', cursor: 'pointer' }}>
                    {' '}
                  </GridItem>
                );
              })}
            {Array(dayjs().add(month, 'M').daysInMonth())
              .fill(1)
              .map((item, i) => {
                const currentDay = item + i;
                if (isDateBlocked(currentDay, month, data, product))
                  return (
                    <GridItem
                      key={i}
                      bg='gray.400'
                      textAlign='center'
                      py='5px'
                      borderRadius='sm'
                      color='black'
                      _hover={{ cursor: 'not-allowed' }}
                    >
                      {currentDay}
                    </GridItem>
                  );

                return (
                  <GridItem
                    key={i}
                    textAlign='center'
                    py='5px'
                    borderRadius='sm'
                    border={!!selectedDate && dayjs(selectedDate).date() === currentDay ? '2px solid' : ''}
                    borderColor={!!selectedDate && dayjs(selectedDate).date() === currentDay ? 'primary.1' : ''}
                    color='black'
                    _hover={{ bg: 'secondary.1', cursor: 'pointer' }}
                    onClick={() => handleChange(currentDay)}
                  >
                    {currentDay}
                  </GridItem>
                );
              })}
          </Grid>
        )}
      </Box>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
