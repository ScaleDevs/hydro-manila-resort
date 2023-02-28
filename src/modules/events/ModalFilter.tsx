import { Dispatch, SetStateAction, useState } from 'react';
import dayjs from 'dayjs';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Heading,
  Stack,
  Button,
  ModalCloseButton,
  Alert,
  AlertDescription,
  AlertIcon,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DateTimeField } from '@/components/DateTimeField';

const schema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

type FormSchemaType = z.infer<typeof schema>;

export type SessionFilter = {
  startDate: string;
  endDate: string;
};

export interface IModalFilterProps {
  isOpen: boolean;
  onClose: () => void;
  setDateFilter: Dispatch<SetStateAction<SessionFilter>>;
}

export default function ModalFilter({ isOpen, onClose, setDateFilter }: IModalFilterProps) {
  const [error, setError] = useState('');
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const applyFilter = (data: FormSchemaType) => {
    const startDate = dayjs.tz(data.startDate, process.env.NEXT_PUBLIC_TIMEZONE);
    const endDate = dayjs.tz(data.endDate, process.env.NEXT_PUBLIC_TIMEZONE);

    if (startDate.unix() > endDate.unix()) {
      setError('END date must be greater than START date');
      return;
    }

    setError('');

    setDateFilter({ startDate: startDate.toISOString(), endDate: endDate.toISOString() });

    onClose();
  };

  return (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    <Modal isOpen={isOpen} closeOnOverlayClick={true} onClose={onClose} isCentered size='xl'>
      <ModalOverlay />
      <ModalContent borderRadius='md' p='5' bg='gray.100'>
        <ModalCloseButton />
        <ModalBody p='0'>
          <Heading size='lg' color='primary.1' fontFamily='primary.1' textAlign='center'>
            Schedule Filter
          </Heading>

          <br />

          {error && (
            <Alert status='error'>
              <AlertIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <br />

          <form onSubmit={handleSubmit(applyFilter)}>
            <Stack w='100%' spacing={5}>
              <Stack>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <DateTimeField
                    required
                    label='START:'
                    register={register}
                    property='startDate'
                    errMsg={errors.startDate?.message}
                  />
                  <DateTimeField required label='END:' register={register} property='endDate' errMsg={errors.endDate?.message} />
                </Stack>
              </Stack>
            </Stack>
            <br />
            <Button type='submit'>APPLY</Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
