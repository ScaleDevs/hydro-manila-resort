import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  SlideFade,
  Heading,
  Skeleton,
  Stack,
  Button,
  Alert,
  AlertIcon,
  Center,
  Grid,
  GridItem,
  List,
  ListIcon,
  ListItem,
  Text,
} from '@chakra-ui/react';

import { PHpeso } from '../utils/helper';
import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import { SelectField } from '@/components/SelectField';
import { NumberField } from '@/components/NumberField';
import { DateTimeField } from '@/components/DateTimeField';
import { GetApp } from '@/appspecs/theme';

const schema = z.object({
  guests: z.number(),
  productId: z.string().min(1, 'Required'),
  rooms: z.map(z.string().min(1), z.string().min(1)),
  bookingDate: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IRescheduleFormProps {
  bookingRefNo: string;
}

export default function AdminEditBookingForm({ bookingRefNo }: IRescheduleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: bookingInfo, isLoading: fetchingBookingInfo } = trpc.booking.getBookingByRefNo.useQuery(bookingRefNo);
  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate, isLoading: isUpdating, isSuccess, error } = trpc.booking.updateBooking.useMutation();
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
    setValue,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      rooms: new Map(bookingInfo?.rooms.map((roomId) => [roomId, roomId])),
    },
  });

  const getIcon = (doesHave: boolean) => {
    return doesHave ? AiOutlineCheck : AiOutlineClose;
  };

  const getColor = (doesHave: boolean) => {
    return doesHave ? 'green.800' : 'red.500';
  };

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const submitUpdate = (data: FormSchemaType) => {
    if (!bookingInfo || !bookingSetting) return;
    if (data.bookingDate && dayjs(data.bookingDate).unix() < dayjs().unix()) {
      setFormError('Schedule is not available! Kindly choose another date');
      return;
    }
    if (bookingSetting.maxPax < data.guests) {
      setFormError(`Max guests allowed is ${bookingSetting.maxPax}!`);
      return;
    }

    setFormError(null);

    console.log('dirtyFields', dirtyFields);

    return;

    const updates = new Map();
    Object.entries(dirtyFields).forEach((entry) => {
      const val = entry[1];
      // updates[key] = data[key as keyof typeof data];
    });

    mutate(
      {
        bookingId: bookingInfo.id,
        data: updates,
      },
      {
        onSuccess(data) {
          console.log(data);
        },
      },
    );
  };

  if (fetchingBookingInfo || fetchingProducts || fetchingRooms || bookingSettingLoader)
    return (
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>
        <br />
        <SlideFade in>
          <Stack w='50%' mx='auto' spacing={5}>
            <Skeleton height='20px' />
            <Skeleton height='20px' />
            <Skeleton height='20px' />
            <Skeleton height='20px' />
          </Stack>
        </SlideFade>
      </Box>
    );

  return (
    <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
      <Heading textAlign='center'>EDIT BOOKING</Heading>

      <br />

      <SlideFade in>
        <Box w={{ base: '95%', md: '90%' }} mx='auto'>
          {isSuccess && (
            <>
              <Alert status='success' borderRadius='sm' color='green.600'>
                <AlertIcon />
                Booking Successfuly updated!
              </Alert>
              <br />
            </>
          )}

          {(!!formError || error) && (
            <>
              <Alert status='error' borderRadius='sm' color='red.600'>
                <AlertIcon />
                {formError || error?.message || ''}
              </Alert>
              <br />
            </>
          )}

          <form onSubmit={handleSubmit(submitUpdate)}>
            <Stack spacing={5}>
              <NumberField
                register={register}
                property='guests'
                placeholder='*PAX'
                label='Guests'
                required
                defaultvalue={bookingInfo?.guests}
              />

              <DateTimeField
                type='date'
                required
                label='Booking Date:'
                register={register}
                property='bookingDate'
                errMsg={errors.bookingDate?.message}
                defaultValue={bookingInfo?.startSession.split('T')[0]}
              />

              <SelectField
                handleOnChange={handleSelectProduct}
                register={register}
                property='productId'
                placeholder='*Swimming Schedule'
                label='Schedule'
                options={
                  productsData?.records.map((v) => ({
                    label: v.name,
                    value: v.productId,
                  })) || []
                }
                value={watch('productId') || bookingInfo?.productId}
                errMsg={!!errors.productId?.message ? 'Required!' : undefined}
                required
              />

              <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} p='10px'>
                {fetchingRooms ? (
                  <>
                    <Skeleton height='40px' w='100%' />
                    <Skeleton height='40px' w='100%' />
                    <Skeleton height='40px' w='100%' />
                    <Skeleton height='40px' w='100%' />
                  </>
                ) : (
                  roomsData?.records.map((record, index) => {
                    // const isActive = !!chosenRoomsMap.get(record.roomId);
                    // const isIncludedInSched = chosenSchedule.includedRooms.some((roomId) => roomId === record.roomId);
                    const isActive = !!watch('rooms')?.get(record.roomId);
                    const isIncludedInSched = selectedProduct?.includedRooms.some((roomId) => roomId === record.roomId);

                    return (
                      <GridItem
                        colSpan={1}
                        key={index}
                        borderRadius='md'
                        boxShadow='lg'
                        overflow='hidden'
                        transition='outline 0.1s linear'
                        cursor={isIncludedInSched ? 'not-allowed' : 'pointer'}
                        _hover={isActive || isIncludedInSched ? {} : { outline: 'solid 2px', outlineColor: 'primary.1' }}
                        outline={isActive || isIncludedInSched ? 'solid 4px' : '2px'}
                        outlineColor={isActive || isIncludedInSched ? GetApp.ActiveColor : ''}
                        onClick={() => {
                          if (isIncludedInSched) return;
                          // const newMapValue = chosenRoomsMap;
                          // if (isActive) newMapValue.delete(record.roomId);
                          // else newMapValue.set(record.roomId, record);
                          // setChosenRoomsMap(new Map(newMapValue));

                          const newMapValue = watch('rooms');
                          if (isActive) newMapValue.delete(record.roomId);
                          else newMapValue.set(record.roomId, record.roomId);

                          setValue('rooms', newMapValue);
                        }}
                      >
                        <Center
                          bg={isIncludedInSched || isActive ? GetApp.ActiveColor : 'primary.1'}
                          py='7'
                          flexDirection='column'
                          transition='background-color 0.1s ease-in'
                        >
                          <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                            {record.roomIdentityName}
                          </Text>
                          <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                            {PHpeso.format(record.price)}
                          </Text>
                        </Center>
                        <Stack py='7' textAlign='left' px='25px' fontSize={{ base: 'xs', md: 'sm' }}>
                          <List spacing={3}>
                            <ListItem>
                              <ListIcon as={getIcon(!!record.guests)} color={getColor(!!record.guests)} />
                              {record.guests} Guest allowed
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(record.withBathroom)} color={getColor(record.withBathroom)} />
                              bathroom
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(record.withAircon)} color={getColor(record.withAircon)} />
                              Air Condition
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(record.withFan)} color={getColor(record.withFan)} />
                              Electric Fan
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(!!record.bedSingle)} color={getColor(!!record.bedSingle)} />
                              {record.bedSingle} Single bed
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(!!record.bedDouble)} color={getColor(!!record.bedDouble)} />
                              {record.bedDouble} Double bed
                            </ListItem>
                            <ListItem>
                              <ListIcon as={getIcon(!!record.bedQueen)} color={getColor(!!record.bedQueen)} />
                              {record.bedQueen} Queen bed
                            </ListItem>
                          </List>
                        </Stack>
                      </GridItem>
                    );
                  })
                )}
              </Grid>
            </Stack>

            <br />

            <Button type='submit' isLoading={isUpdating}>
              UPDATE BOOKING
            </Button>
          </form>
        </Box>
      </SlideFade>

      <br />
    </Box>
  );
}
