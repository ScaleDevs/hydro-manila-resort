import { Dispatch, SetStateAction } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  Center,
  Collapse,
  Grid,
  GridItem,
  List,
  ListIcon,
  ListItem,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { AiOutlineCheck } from 'react-icons/ai';
import { trpc } from '@/utils/trpc';
import { PHpeso, getISOFormatFromSchedule, getProductPrice } from '@/utils/helper';
import { ProductV2 } from '@/utils/types';
import { GetApp } from '@/appspecs/theme';

const transformSchedule = (schedule: string) => {
  const schedArr = schedule.split(' ');
  const timeSplit = schedArr[0].split(':');

  return timeSplit[0] + ':' + timeSplit[1] + ' ' + schedArr[1];
};

export interface IChooseScheduleProps {
  chosenDate: string | undefined;
  chosenSchedule: ProductV2 | undefined;
  setChosenSchedule: Dispatch<SetStateAction<ProductV2 | undefined>>;
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

  const handleChosenSchedule = (product: ProductV2) => setChosenSchedule(product);

  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>
        Choose Time:
      </Text>
      <br />
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} p='10px'>
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
              <GridItem
                colSpan={1}
                key={index}
                borderRadius='md'
                boxShadow='lg'
                overflow='hidden'
                transition='outline 0.1s linear'
                cursor={isBlocked ? 'not-allowed' : 'pointer'}
                _hover={isActive || isBlocked ? {} : { outline: 'solid 2px', outlineColor: 'primary.1' }}
                outline={isActive ? 'solid 4px' : '2px'}
                outlineColor={isActive ? GetApp.ActiveColor : ''}
                onClick={() => !isBlocked && handleChosenSchedule(record)}
              >
                <Center
                  bg={isBlocked ? 'gray.300' : isActive ? GetApp.ActiveColor : 'primary.1'}
                  py='7'
                  flexDirection='column'
                  transition='background-color 0.1s ease-in'
                >
                  <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                    {record.name}
                  </Text>
                  <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                    {PHpeso.format(chosenDate ? getProductPrice(chosenDate, record) : 0)}
                  </Text>
                </Center>
                <Stack py='7' textAlign='left' px='25px' fontSize={{ base: 'xs', md: 'sm' }}>
                  <List spacing={3}>
                    <ListItem listStyleType='none'>
                      <ListIcon as={AiOutlineCheck} color='green.800' />
                      Check-in {transformSchedule(record.scheduleStart)}
                    </ListItem>
                    <ListItem listStyleType='none'>
                      <ListIcon as={AiOutlineCheck} color='green.800' />
                      Check-out {transformSchedule(record.scheduleEnd)}
                    </ListItem>
                    {!record.isAllRooms && (
                      <ListItem>
                        <ListIcon as={AiOutlineCheck} color='green.800' />
                        {record.includedRooms.length > 0 ? 'Rooms' : 'No Rooms'}
                      </ListItem>
                    )}
                  </List>
                </Stack>
              </GridItem>
            );
          })
        )}
      </Grid>

      <Collapse in={!!chosenSchedule && chosenSchedule.includedRooms.length > 0 && !chosenSchedule.isAllRooms} animateOpacity>
        <Stack p='10px'>
          <Alert status='info' fontFamily='primary'>
            <AlertIcon />
            {chosenSchedule?.includedRoomsName.join(', ')} are the rooms for this schedule
          </Alert>
        </Stack>
      </Collapse>
    </Box>
  );
}
