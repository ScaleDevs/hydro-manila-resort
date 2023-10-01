import { Dispatch, SetStateAction, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Heading,
  Stack,
  Button,
  ModalCloseButton,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Tabs,
  Alert,
  AlertDescription,
  AlertIcon,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import dayjs from 'dayjs';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { TextField } from '@/components/TextField';
import { DateTimeField } from '@/components/DateTimeField';

const refFormSchema = z.object({
  ref_no: z.string().min(1, 'Required'),
});

const dateFilterFormSchema = z.object({
  startDate: z.string().min(1, 'Required'),
  endDate: z.string().min(1, 'Required'),
});

type RefFormSchemaType = z.infer<typeof refFormSchema>;
type DateFilterFormSchemaType = z.infer<typeof dateFilterFormSchema>;

export type SessionFilter = {
  startDate: string;
  endDate: string;
};
type IFormProps = {
  onClose: () => void;
  setDateFilter: Dispatch<SetStateAction<SessionFilter | undefined>>;
  setRefNo: Dispatch<SetStateAction<string | undefined>>;
};

const DateFilterForm = ({ setDateFilter, setRefNo, onClose }: IFormProps) => {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<DateFilterFormSchemaType>({
    resolver: zodResolver(dateFilterFormSchema),
  });

  const applyFilter = (data: DateFilterFormSchemaType) => {
    const startDate = dayjs.tz(data.startDate, process.env.NEXT_PUBLIC_TIMEZONE);
    const endDate = dayjs.tz(data.endDate, process.env.NEXT_PUBLIC_TIMEZONE);

    if (startDate.unix() > endDate.unix()) {
      setError('END date must be greater than START date');
      return;
    }

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    setError('');
    setRefNo(undefined);
    setDateFilter({
      startDate: startISO,
      endDate: endISO,
    });

    router.push(`/admin/bookings/?startDate=${startISO}&endDate=${endISO}`, undefined, { shallow: true });

    onClose();
  };

  return (
    <>
      {error && (
        <Alert status='error'>
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit(applyFilter)}>
        <Stack direction={{ base: 'column', md: 'row' }}>
          <DateTimeField required label='START:' register={register} property='startDate' errMsg={errors.startDate?.message} />
          <DateTimeField required label='END:' register={register} property='endDate' errMsg={errors.endDate?.message} />
        </Stack>
        <br />
        <Button type='submit'>APPLY</Button>
      </form>
    </>
  );
};

const ReferenceNumberForm = ({ setRefNo, setDateFilter, onClose }: IFormProps) => {
  const { handleSubmit, register } = useForm<RefFormSchemaType>({
    resolver: zodResolver(refFormSchema),
  });

  const applyFilter = (data: RefFormSchemaType) => {
    setDateFilter(undefined);
    setRefNo(data.ref_no === '' ? undefined : data.ref_no);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(applyFilter)}>
      <Stack w='100%' spacing={5}>
        <TextField
          required
          label='REFERENCE NO:'
          register={register}
          property='ref_no'
          placeholder='Enter reference number here'
        />
      </Stack>
      <br />
      <Button type='submit'>APPLY</Button>
    </form>
  );
};

export interface IModalFilterProps {
  isOpen: boolean;
}

export default function ModalFilter({ isOpen, onClose, setRefNo, setDateFilter }: IModalFilterProps & IFormProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    <Modal isOpen={isOpen} closeOnOverlayClick={true} onClose={onClose} isCentered size='xl'>
      <ModalOverlay />
      <ModalContent borderRadius='md' p='5' bg='gray.100'>
        <ModalCloseButton />
        <ModalBody p='0'>
          <Heading size='lg' color='primary.1' fontFamily='primary.1' textAlign='center'>
            Booking Records Filter
          </Heading>

          <br />
          <Tabs>
            <TabList>
              <Tab>Reference No</Tab>
              <Tab>Date Range</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <ReferenceNumberForm {...{ onClose, setRefNo, setDateFilter }} />
              </TabPanel>
              <TabPanel>
                <DateFilterForm {...{ onClose, setRefNo, setDateFilter }} />
              </TabPanel>
            </TabPanels>
          </Tabs>
          <br />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
