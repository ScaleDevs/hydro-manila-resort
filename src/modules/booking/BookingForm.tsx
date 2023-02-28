import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import Link from 'next/link';
import { Box, Stack, Text, HStack, VStack, Button, Heading, Alert, AlertIcon, chakra } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';

import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';
import { PHpeso } from '@/modules/utils/helper';
import useBookingStoreTrack from '@/store/booking.store';
import CalenderInput from '@/components/CalendarInput';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { NumberField } from '@/components/NumberField';
import CostView from './CostView';

const NavLink = chakra(Link);

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phoneNumber: z.string().min(1, 'Required'),
  email: z.string().email(),
  guests: z.number(),
  productId: z.string().min(1, 'Required'),
  roomId: z.string().optional(),
  bookingDate: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IBookingFormProps {
  setStep: Dispatch<SetStateAction<number>>;
}

export default function BookingForm({ setStep }: IBookingFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);
  const [productActiveVersion, setProductActiveVersion] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<IRoom | undefined>(undefined);
  const [roomActiveVersion, setRoomActiveVersion] = useState(0);
  const [isSchedAvailable, setIsSchedAvailable] = useState(true);

  const { setWholeBookingState } = useBookingStoreTrack();

  const { data: productsData, isLoading: getProductsLoader } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();
  const { data: roomsData, isLoading: getRoomLoader } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate, isError } = trpc.payment.initiatePaymentSessionForBooking.useMutation();

  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const handleSelectRoom = (value: any) => {
    if (roomsData) setSelectedRoom(roomsData.records.find((v) => v.roomId === value));
  };

  const proceedToPayment = (data: FormSchemaType) => {
    if (!bookingSetting) return;
    if (!selectedProduct) return;

    const productDetails = selectedProduct.details[productActiveVersion];
    const endDate = dayjs(data.bookingDate)
      .add(!!productDetails.scheduleEndNextDay ? 1 : 0, 'day')
      .format('YYYY-MM-DD');
    let total = 0;

    total += productDetails.price;
    if (selectedRoom) total += selectedRoom.details[roomActiveVersion].price;
    if (data.guests && data.guests > bookingSetting.minPax)
      total += (data.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;

    const payload = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      startSession: dayjs
        .tz(
          dayjs(`${data.bookingDate} ${selectedProduct?.details[productActiveVersion].scheduleStart}`).format('YYYY-MM-DDTHH:mm'),
          process.env.NEXT_PUBLIC_TIMEZONE,
        )
        .toISOString(),
      endSession: dayjs
        .tz(
          dayjs(`${endDate} ${selectedProduct?.details[productActiveVersion].scheduleEnd}`).format('YYYY-MM-DDTHH:mm'),
          process.env.NEXT_PUBLIC_TIMEZONE,
        )
        .toISOString(),
      guests: data.guests,
      roomId: data.roomId === '' || !data.roomId ? null : data.roomId,
      roomVersion: selectedRoom?.activeVersion || 1,
      productId: data.productId,
      productVersion: selectedProduct?.activeVersion || 1,
      receipt: {
        productPrice: selectedProduct?.details[productActiveVersion].price || 0,
        roomPrice: selectedRoom?.details[roomActiveVersion].price || 0,
        additionalHeadsPrice:
          data.guests && data.guests > bookingSetting.minPax
            ? (data.guests - bookingSetting.minPax) * bookingSetting.extraHeadFee
            : 0,
        bookingFee: 0,
        total,
      },
    };

    mutate(payload, {
      onSuccess(data) {
        if ('isSchedAvailable' in data) {
          setIsSchedAvailable(data.isSchedAvailable);
          return;
        }

        setIsSchedAvailable(true);

        setWholeBookingState({
          ...payload,
          clientKey: data.data.attributes.client_key,
          paymentIntentId: data.data.id,
        });
        reset();
        setStep(2);
      },
    });
  };

  useEffect(() => {
    if (selectedProduct) setProductActiveVersion(selectedProduct.activeVersion - 1);

    if (selectedProduct?.details[selectedProduct.activeVersion - 1].withRooms) {
      setValue('roomId', '');
      setSelectedRoom(undefined);
    }
  }, [selectedProduct, setValue]);

  useEffect(() => {
    if (selectedRoom) setRoomActiveVersion(selectedRoom.activeVersion - 1);
  }, [selectedRoom]);

  return (
    <Box>
      <form onSubmit={handleSubmit(proceedToPayment)}>
        <Stack direction='column' w={{ base: '95%', md: '100%' }} mx='auto' alignItems='center'>
          <Box w={{ base: '95%', sm: '100%', lg: '90%' }}>
            <Heading as='h1' size='lg' noOfLines={1} textAlign={{ base: 'center', md: 'left' }}>
              BOOK A DATE!
            </Heading>
            {!isSchedAvailable || isError ? (
              <Alert status='error' borderRadius='sm' my='10px' fontFamily='primary' color='red.600'>
                <AlertIcon />
                {!isSchedAvailable ? 'Schedule is not available' : 'Something went wrong, Kindly Try Again'}
              </Alert>
            ) : (
              ''
            )}
          </Box>
          <Stack direction='row' w={{ base: '100%', lg: '90%' }} spacing='5'>
            <Box w={{ base: '100%', md: '50%' }} mx={{ base: 'auto', md: '0' }}>
              <Box display={{ base: 'block', md: 'none' }} mt='20px'>
                <CalenderInput setValue={setValue} product={selectedProduct} errMsg={errors.bookingDate?.message} />
              </Box>

              <Stack spacing='3' mt='20px'>
                <TextField register={register} property='name' placeholder='*Name' errMsg={errors.name?.message} />
                <TextField
                  register={register}
                  property='phoneNumber'
                  placeholder='*Contact Number'
                  errMsg={errors.phoneNumber?.message}
                />
                <TextField register={register} property='email' placeholder='*Email' errMsg={errors.email?.message} />
              </Stack>

              <VStack alignItems='left'>
                <HStack mt='15px'>
                  <Box h='100%' w='30%' p='-0'>
                    <NumberField register={register} property='guests' placeholder='*PAX' />
                  </Box>
                  <Box w='70%' fontSize='12px'>
                    <Text>MAX OF {bookingSetting?.minPax || 25} PAX</Text>
                    <Text>EXTRA PERSON ₱{bookingSetting?.extraHeadFee || 250}/HEAD</Text>
                    <Text mt='10px'>CHILDREN 2 YEARS BELOW ARE FREE</Text>
                    <Text>Do not add in # of pax</Text>
                  </Box>
                </HStack>
                <Stack w='100%'>
                  <Text color='red.500' textAlign='left'>
                    {errors.guests?.message ||
                      (bookingSetting
                        ? watch('guests') > bookingSetting.maxPax
                          ? `Extra Heads Allowed are only ${bookingSetting.maxPax - bookingSetting.minPax}!`
                          : ''
                        : '')}
                  </Text>
                </Stack>
              </VStack>

              <Stack spacing='3' mt='20px'>
                <SelectField
                  handleOnChange={handleSelectProduct}
                  register={register}
                  property='productId'
                  value={watch('productId')}
                  placeholder='*Schedule'
                  options={
                    productsData?.records.map((v) => ({
                      label: v.name,
                      value: v.productId,
                    })) || []
                  }
                  errMsg={!!errors.productId?.message ? 'Required!' : undefined}
                >
                  {!!selectedProduct ? (
                    <Box bg='primary.1' p='5' mt='3' borderRadius='sm'>
                      <Text fontSize='14px' color='white'>
                        {selectedProduct.name} | {selectedProduct.details[productActiveVersion].price}
                      </Text>
                      <Text fontSize='14px' color='white'>
                        {selectedProduct.details[productActiveVersion].scheduleStart} -{' '}
                        {selectedProduct.details[productActiveVersion].scheduleEnd} |{' '}
                        {selectedProduct.details[productActiveVersion].withRooms ? 'WITH ROOMS' : 'WITHOUT ROOMS'}
                      </Text>
                    </Box>
                  ) : (
                    ''
                  )}
                </SelectField>

                <SelectField
                  disabled={selectedProduct?.details[0].withRooms}
                  handleOnChange={handleSelectRoom}
                  register={register}
                  property='roomId'
                  value={watch('roomId')}
                  placeholder='ROOM RENTAL(optional)'
                  options={roomsData?.records.map((v) => ({ label: `${v.roomIdentityName}`, value: v.roomId })) || []}
                  errMsg={!!errors.roomId?.message ? 'Required!' : undefined}
                >
                  {!!selectedRoom ? (
                    <Box bg='primary.1' p='5' mt='3' borderRadius='sm'>
                      <Text fontSize='14px' color='white'>
                        {selectedRoom.roomIdentityName} | {selectedRoom.details[roomActiveVersion].withBathroom ? 'w/' : 'w/o'}{' '}
                        bathroom
                      </Text>
                      <Text fontSize='14px' color='white'>
                        ROOM {selectedRoom.details[roomActiveVersion].guests} PAX | ADDITIONAL{' '}
                        {PHpeso.format(selectedRoom.details[roomActiveVersion].price)}
                      </Text>
                    </Box>
                  ) : (
                    ''
                  )}
                </SelectField>
              </Stack>

              <VStack display={{ base: 'block', md: 'none' }}>
                <CostView product={selectedProduct} room={selectedRoom} guests={watch('guests')} />
              </VStack>

              <Box display={{ base: 'flex', md: 'none' }} justifyContent='right'>
                <Button
                  mt='20px'
                  type='submit'
                  isLoading={getProductsLoader || getRoomLoader}
                  disabled={bookingSetting ? watch('guests') > bookingSetting.maxPax : false}
                >
                  PROCEED TO PAYMENT
                </Button>
              </Box>
            </Box>

            <Box display={{ base: 'none', md: 'block' }} w={{ base: '100%', md: '50%' }}>
              <Box>
                <CalenderInput setValue={setValue} product={selectedProduct} errMsg={errors.bookingDate?.message} />
              </Box>

              <CostView product={selectedProduct} room={selectedRoom} guests={watch('guests')} />

              <Box display='flex' justifyContent='right'>
                <Button
                  mt='20px'
                  type='submit'
                  isLoading={getProductsLoader || getRoomLoader || bookingSettingLoader}
                  disabled={bookingSetting ? watch('guests') > bookingSetting.maxPax : false}
                >
                  PROCEED TO PAYMENT
                </Button>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </form>
      <br />
      <Stack direction='column' w={{ base: '95%', md: '100%', lg: '90%' }} mx='auto' alignItems='flex-start'>
        <Text color='primary.1' fontFamily='primary.1' fontSize='xl' fontWeight='semibold'>
          Want to cancel a Booking?
        </Text>
        <NavLink href='/booking/cancel' bg='gray.100' w='auto'>
          <Button w='300px' bg='red.500' _hover={{ bg: 'red.400' }}>
            Cancel your booking here
          </Button>
        </NavLink>
      </Stack>
    </Box>
  );
}
