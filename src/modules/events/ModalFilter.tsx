import { Dispatch, SetStateAction } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Text,
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
  startSession: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
    })
    .optional(),
  endSession: z
    .object({
      startDate: z.string(),
      endDate: z.string(),
    })
    .optional(),
});

type FormSchemaType = z.infer<typeof schema>;

export type SessionFilter = {
  startDate: string;
  endDate: string;
};

export interface IModalFilterProps {
  isOpen: boolean;
  onClose: () => void;
  setStartSessionFilter: Dispatch<SetStateAction<SessionFilter | undefined>>;
  setEndSessionFilter: Dispatch<SetStateAction<SessionFilter | undefined>>;
}

export default function ModalFilter({ isOpen, onClose, setStartSessionFilter, setEndSessionFilter }: IModalFilterProps) {
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const applyFilter = (data: FormSchemaType) => {
    if (
      (!data.startSession?.startDate || data.startSession.startDate !== '') &&
      (!data.startSession?.endDate || data.startSession.endDate !== '')
    ) {
      setStartSessionFilter(data.startSession);
    }

    if (
      (!data.endSession?.startDate || data.endSession.startDate !== '') &&
      (!data.endSession?.endDate || data.endSession.endDate !== '')
    ) {
      setEndSessionFilter(data.endSession);
    }

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

          <Alert status='info'>
            <AlertIcon />
            <AlertDescription>You can fillup either start session or end session or both</AlertDescription>
          </Alert>

          <br />

          <form onSubmit={handleSubmit(applyFilter)}>
            <Stack w='100%' spacing={5}>
              <Stack>
                <Text fontSize='2xl'>START SESSION:</Text>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <DateTimeField
                    required
                    label='START:'
                    register={register}
                    property='startSession.startDate'
                    errMsg={errors.startSession?.startDate?.message}
                  />
                  <DateTimeField
                    required
                    label='END:'
                    register={register}
                    property='startSession.endDate'
                    errMsg={errors.startSession?.endDate?.message}
                  />
                </Stack>
              </Stack>
              <Stack>
                <Text fontSize='2xl'>END SESSION:</Text>
                <Stack direction={{ base: 'column', md: 'row' }}>
                  <DateTimeField
                    required
                    label='START:'
                    register={register}
                    property='endSession.startDate'
                    errMsg={errors.endSession?.startDate?.message}
                  />
                  <DateTimeField
                    required
                    label='END:'
                    register={register}
                    property='endSession.endDate'
                    errMsg={errors.endSession?.endDate?.message}
                  />
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
