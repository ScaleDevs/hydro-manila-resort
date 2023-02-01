import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Box, Stack, Text, HStack, VStack, Button, Heading } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';

import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';
import { PHpeso } from '@/utils/helper';
import useBookingStoreTrack from '@/store/booking.store';
import CalenderInput from '@/components/CalendarInput';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { NumberField } from '@/components/NumberField';
import CostView from './CostView';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phoneNumber: z.string(),
  email: z.string().email(),
  guests: z.number().max(30, 'Max Additional Heads 5'),
  productId: z.string(),
  roomId: z.string(),
  bookingDate: z.string(),
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

  const { setWholeBookingState } = useBookingStoreTrack();

  const { data: productsData, isLoading: getProductsLoader } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: getRoomLoader } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate } = trpc.payment.initiatePaymentSessionForBooking.useMutation();

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
    console.log('SUBMIT');
    console.log(data);

    // let total = 0;
    // if (selectedProduct) total += selectedProduct.details[selectedProduct.activeVersion - 1].price;
    // if (selectedRoom) total += selectedRoom.details[selectedRoom.activeVersion - 1].price;
    // if (data.guests && data.guests > 25) total += (data.guests - 25) * 250;

    const endDate = dayjs(data.bookingDate).add(1, 'day').format('YYYY-MM-DD');

    const payload = {
      name: data.name,
      email: data.email,
      phoneNumber: data.phoneNumber,
      startSession: new Date(`${data.bookingDate} ${selectedProduct?.details[productActiveVersion].scheduleStart}`).toString(),
      endSession: new Date(`${endDate} ${selectedProduct?.details[productActiveVersion].scheduleEnd}`).toString(),
      guests: data.guests,
      roomId: data.roomId,
      roomVersion: selectedRoom?.activeVersion || 1,
      productId: data.productId,
      productVersion: selectedProduct?.activeVersion || 1,
      receipt: {
        productPrice: selectedProduct?.details[productActiveVersion].price || 0,
        roomPrice: selectedRoom?.details[roomActiveVersion].price || 0,
        additionalHeadsPrice: data.guests && data.guests > 25 ? (data.guests - 25) * 250 : 0,
        total: 100,
      },
    };

    mutate(payload, {
      onSuccess(data) {
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
    <>
      <form onSubmit={handleSubmit(proceedToPayment)}>
        <Stack direction='column' w={{ md: '100%', lg: '75%' }} mx='auto' alignItems='center'>
          <Box w={{ base: '100%', md: '90%' }}>
            <Heading as='h1' size='lg' noOfLines={1} textAlign={{ base: 'center', md: 'left' }}>
              BOOK THE PLACE!
            </Heading>
          </Box>
          <Stack direction='row' w='90%' spacing='5'>
            <Box w={{ base: '100%', md: '100%' }} mx={{ base: 'auto', md: '0' }}>
              <Box display={{ base: 'block', md: 'none' }} mt='20px'>
                <CalenderInput setValue={setValue} />
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

              <HStack mt='15px'>
                <Box h='100%' w='30%' p='-0'>
                  <NumberField register={register} property='guests' placeholder='*PAX' errMsg={errors.guests?.message} />
                  {/* <Input placeholder='*PAX' /> */}
                </Box>
                <Box w='70%' fontSize='12px'>
                  <Text>MAX OF 25 PAX</Text>
                  <Text>EXTRA PERSON ₱250/HEAD</Text>
                  <Text mt='10px'>CHILDREN 2 YEARS BELOW ARE FREE</Text>
                  <Text>Do not add in # of pax</Text>
                </Box>
              </HStack>

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
                        {selectedProduct.name} | {PHpeso.format(selectedProduct.details[productActiveVersion].price)}
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
                  options={roomsData?.records.map((v) => ({ label: <Text>ROOM {v.roomNumber}</Text>, value: v.roomId })) || []}
                  errMsg={!!errors.roomId?.message ? 'Required!' : undefined}
                >
                  {!!selectedRoom ? (
                    <Box bg='primary.1' p='5' mt='3' borderRadius='sm'>
                      <Text fontSize='14px' color='white'>
                        ROOM {selectedRoom.roomNumber} | {selectedRoom.details[roomActiveVersion].withBathroom ? 'w/' : 'w/o'}{' '}
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
                <Button mt='20px' type='submit' isLoading={getProductsLoader || getRoomLoader}>
                  PROCEED TO PAYMENT
                </Button>
              </Box>
            </Box>

            <Box display={{ base: 'none', md: 'block' }}>
              <Box>
                <CalenderInput setValue={setValue} />
              </Box>

              <CostView product={selectedProduct} room={selectedRoom} guests={watch('guests')} />

              <Box display='flex' justifyContent='right'>
                <Button mt='20px' type='submit' isLoading={getProductsLoader || getRoomLoader}>
                  PROCEED TO PAYMENT
                </Button>
              </Box>
            </Box>
          </Stack>
        </Stack>
      </form>
    </>
  );
}
