import { useRef } from 'react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { ProcessType, TransactionType } from '@prisma/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  HStack,
  Heading,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  Box,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { BsPlusLg } from 'react-icons/bs';

import { PHpeso } from '@/utils/helper';
import { trpc } from '@/utils/trpc';
import useAuthStoreTrack from '@/store/auth.store';
import { TextField } from '@/components/TextField';
import { SelectField } from '@/components/SelectField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';

const schema = z.object({
  refNo: z.string(),
  process: z.enum(['BANK', 'CASH'], {
    errorMap: (issue) => {
      switch (issue.code) {
        case 'invalid_enum_value':
          return { message: 'Please choose value!' };
        default:
          return { message: issue.code };
      }
    },
  }),
  type: z.enum(['REFUND', 'PAYMENT']),
  amount: z
    .number({
      required_error: 'Enter Amount!',
    })
    .min(1, 'Must be greater than 0!'),
});

type FormSchemaType = z.infer<typeof schema>;

const processTypes = [
  {
    label: 'CASH',
    value: 'CASH',
  },
  {
    label: 'BANK',
    value: 'BANK',
  },
];

interface ICreateTransactionLogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
}

const CreateTransactionLog = ({ bookingId, isOpen, onClose }: ICreateTransactionLogProps) => {
  const router = useRouter();
  const { username } = useAuthStoreTrack();
  const ctx = trpc.useContext();
  const initialRef = useRef(null);
  const toast = useToast();

  const { mutate, isLoading } = trpc.booking.addTransactionLog.useMutation();

  const {
    register,
    control,
    formState: { errors },
    trigger,
    getValues,
    reset,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      refNo: '',
      amount: 0,
    },
  });

  const onExit = () => {
    reset();
    onClose();
  };

  const save = async () => {
    const isValid = await trigger();

    if (!isValid) return;
    if (!bookingId) {
      toast({
        title: 'Invalid Booking Record!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

    if (!username) {
      toast({
        title: 'Invalid Admin User!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

    const data = getValues();

    mutate(
      {
        bookingId,
        username,
        data,
      },
      {
        onSuccess(data) {
          const newTransactionLogs = data.transactionLogs;
          if (router.query.id && typeof router.query.id === 'string')
            ctx.booking.getBookingByRefNo.setData(router.query.id, (currentData: any) => {
              return { ...currentData, transactionLogs: newTransactionLogs };
            });
          toast({
            title: 'Transaction Log Saved',
            position: 'top-right',
            duration: 5000,
            isClosable: true,
            status: 'success',
          });
          reset();
          onClose();
        },
      },
    );
  };

  return (
    <Modal initialFocusRef={initialRef} isOpen={isOpen} onClose={onExit} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily='primary'>Create New Transaction Log</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={5}>
            <SelectField
              register={register}
              property='type'
              placeholder='Choose Type'
              label='Type:'
              options={Object.values(TransactionType).map((v) => ({
                label: v,
                value: v,
              }))}
              errMsg={errors.process?.message}
              required
            />

            <SelectField
              register={register}
              property='process'
              placeholder='Choose Process'
              label='Process:'
              options={processTypes}
              errMsg={errors.process?.message}
              required
            />

            <TextField
              register={register}
              property='refNo'
              placeholder='Reference No'
              label='Reference No:'
              errMsg={errors.refNo?.message}
            />

            <NumberFieldV2 required control={control} property='amount' label='Amount:' errMsg={errors.amount?.message} />
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button type='submit' onClick={save} isLoading={isLoading}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

interface ITransactionLogsProps {
  bookingId?: string;
  logs: {
    refNo: string | null;
    process: ProcessType;
    type: TransactionType;
    amount: number;
    createdAt: string | null;
    paymentIntentId: string | null;
    addedBy: string | null;
  }[];
}

export default function TransactionLogs({ bookingId, logs }: ITransactionLogsProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
      <CreateTransactionLog {...{ bookingId, isOpen, onClose }} />

      <HStack justify='space-between'>
        <Heading size='lg'>TRANSACTION LOGS</Heading>
        <IconButton colorScheme='teal' aria-label='Call Segun' size='md' icon={<BsPlusLg />} onClick={onOpen} />
      </HStack>

      <br />
      <TableContainer>
        <Table fontFamily='primary' color='black' variant='striped'>
          <Thead>
            <Tr>
              <Th fontSize='md' fontFamily='primary'>
                TYPE
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                PROCESS
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                REFERENCE
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                AMOUNT
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                ADDED BY
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                CREATED AT
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.length === 0 ? (
              <Tr _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                <Td colSpan={6} textAlign='center' fontSize='lg'>
                  No Records Found
                </Td>
              </Tr>
            ) : (
              logs.map((v, i) => (
                <Tr key={i} _hover={{ cursor: 'pointer', bg: 'secondary.1' }} fontSize={{ base: 'xs', xl: 'sm' }}>
                  <Td>{v.type}</Td>
                  <Td>{v.process ?? 'N/A'}</Td>
                  <Td>{v.refNo ?? 'N/A'}</Td>
                  <Td>{PHpeso.format(v.process && v.process === 'PAYMONGO' ? v.amount / 100 : v.amount)}</Td>
                  <Td>{v.createdAt ? dayjs(v.createdAt).format('MMM DD, YYYY hh:mm A') : 'N/A'}</Td>
                  <Td>{v.addedBy ?? 'N/A'}</Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}
