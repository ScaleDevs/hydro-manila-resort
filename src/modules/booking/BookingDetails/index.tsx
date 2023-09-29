import { ReactNode } from 'react';
import dayjs from 'dayjs';
import { UseTRPCQueryResult } from '@trpc/react-query/shared';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/routers/_app';
import { TRPCClientErrorLike } from '@trpc/react-query';
import {
  Box,
  Spinner,
  SlideFade,
  Heading,
  Stack,
  Divider,
  Text,
  Badge,
  VStack,
  Center,
  IconButton,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { MdEmail } from 'react-icons/md';
import { RiRefund2Fill } from 'react-icons/ri';

import { tableFormatTimeDisplay } from '@/modules/utils/helper';
import { PHpeso } from '@/utils/helper';
import Modal from '@/components/Modal';
import { trpc } from '@/utils/trpc';
import UpdateRefund from './UpdateRefund';

const BadgeColor = {
  FAILED: 'gray',
  PROCESSING: 'gray',
  SUCCESS: 'red',
};

const InfoField = ({ label, value, children }: { label: string; value?: string | number | null; children?: ReactNode }) => {
  return (
    <VStack spacing={0} align='flex-start' wordBreak='break-word'>
      <Text color='gray.500' fontSize='sm'>
        {label}:
      </Text>
      {value || value === null || value === '' ? <Text>{value ? value : 'N/A'}</Text> : children}
    </VStack>
  );
};

export interface IDetailsProps {
  isIn?: boolean;
  isLoading: boolean;
  data: UseTRPCQueryResult<inferRouterOutputs<AppRouter>['booking']['getBookingByRefNo'], TRPCClientErrorLike<AppRouter>>['data'];
}

export function Details({ isLoading, isIn, data }: IDetailsProps) {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isOpenRefundModal, onOpen: onOpenRefundModal, onClose: closeRefundModal } = useDisclosure();
  const { mutate, isLoading: isResendingEmail } = trpc.booking.resendBookingInfo.useMutation();

  const getConvenienceFee = () => {
    if (!data?.receipt) return 0;

    let total = 0;

    total += data.receipt.productPrice;
    total += data.receipt.roomPrice || 0;
    total += data.receipt.additionalHeadsPrice || 0;

    return (data.receipt.bookingFee / 100) * total;
  };

  const getStatus = () => {
    if (!data) return 'INVALID';
    if (!data?.refund && dayjs.utc(data.startSession).unix() < dayjs.utc().unix()) return 'COMPLETED';
    else if (!data?.refund) return 'BOOKED';
    else if (data.refund.status === 'PROCESSING') return 'REFUND IN PROGRESS';
    else if (data.refund.status === 'SUCCESS') return 'REFUNDED';
    else return 'BOOKED';
  };

  const onConfirm = () => {
    if (!data?.id) return;
    mutate(data.id, {
      onSuccess(data) {
        if (!!data)
          toast({
            title: 'Booking Confirmation Resent',
            position: 'top-right',
            duration: 5000,
            isClosable: true,
            status: 'success',
          });

        onClose();
      },
    });
  };

  const openRefundModal = () => {
    if (!data?.refundId) return;
    onOpenRefundModal();
  };

  return (
    <SlideFade in={isIn} offsetY='20px'>
      <Modal title='Resend Email' {...{ isOpen, onClose, isLoading: isResendingEmail, onConfirm }}>
        <Text>Are you sure you want to resend booking confirmation email to customer?</Text>
      </Modal>
      <UpdateRefund isOpen={isOpenRefundModal} onClose={closeRefundModal} bookingRefundId={data?.refundId} />
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
            <Stack direction={{ base: 'column', md: 'row' }} justify='space-between'>
              <Stack direction='row' align='end'>
                <Badge
                  py={3}
                  px={5}
                  variant='subtle'
                  colorScheme={!!data?.refund ? BadgeColor[data.refund.status] : 'green'}
                  fontFamily='primary'
                >
                  {getStatus()}
                </Badge>
                <Stack spacing={0} justifyContent='space-between'>
                  <Text color='gray.400' fontSize='sm'>
                    Reference No:
                  </Text>
                  <Text fontSize={{ base: 'sm', md: 'md' }}>{data?.ref_no}</Text>
                </Stack>
              </Stack>

              <Stack direction='row'>
                <IconButton variant='outline' colorScheme='teal' aria-label='Send email' icon={<MdEmail />} onClick={onOpen} />
                <IconButton
                  variant='outline'
                  colorScheme='red'
                  aria-label='Update Refund'
                  icon={<RiRefund2Fill />}
                  onClick={openRefundModal}
                  isDisabled={!data?.refundId || data.refund?.status === 'SUCCESS'}
                />
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
                    {process.env.NEXT_PUBLIC_APP === 'VillaLeonora' && (
                      <InfoField label='Guests (Overnight)' value={data?.guests.overNightGuests || 0} />
                    )}
                    <InfoField
                      label={process.env.NEXT_PUBLIC_APP === 'VillaLeonora' ? 'Guests (Non-Overnight)' : 'Guests'}
                      value={data?.guests.nonOverNightGuests || 0}
                    />
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
                <InfoField label='Created At' value={!!data?.createdAt ? tableFormatTimeDisplay(data.createdAt) : 'N/A'} />
              </VStack>
            </Stack>
          </>
        )}
      </Box>

      {data?.refund && data.refundId && (
        <>
          <br />
          <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
            {isLoading || !data ? (
              <Center minH='210px'>
                <VStack gap='3'>
                  <Spinner size='lg' />
                  <Text>Fetching Details ...</Text>
                </VStack>
              </Center>
            ) : (
              <SlideFade in>
                <Heading size='lg' fontFamily='primary'>
                  REFUND
                </Heading>
                <br />
                <Stack spacing={{ md: 20 }} direction={{ base: 'column', md: 'row' }}>
                  <VStack align='flex-start'>
                    <InfoField label='Type' value={data.refund.type} />
                    <InfoField label='Process' value={data.refund.process} />
                    <InfoField label='Status' value={data.refund.status} />
                  </VStack>
                  <VStack align='flex-start'>
                    <InfoField label='Reference No' value={data.refund.referenceNo} />
                    <InfoField label='Paymongo Refund Id' value={data.refund.paymongoRefundId} />
                    <InfoField label='Amount' value={PHpeso.format(data.refund.amount ?? 0)} />
                  </VStack>
                  <VStack align='flex-start'>
                    <InfoField label='Reason' value={data.refund.reason} />
                    <InfoField label='Updated By' value={data.refund.updatedBy} />
                    <InfoField
                      label='Created At'
                      value={!!data.refund.createdAt ? tableFormatTimeDisplay(data.refund.createdAt) : 'N/A'}
                    />
                  </VStack>
                </Stack>
              </SlideFade>
            )}
          </Box>
        </>
      )}

      <br />

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        {isLoading || !data ? (
          <Center minH='210px'>
            <VStack gap='3'>
              <Spinner size='lg' />
              <Text>Fetching Details ...</Text>
            </VStack>
          </Center>
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
