import { Dispatch, SetStateAction } from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody, Heading, Stack, Button, ModalCloseButton } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextField } from '@/components/TextField';

const schema = z.object({
  ref_no: z.string(),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IModalFilterProps {
  isOpen: boolean;
  onClose: () => void;
  setRefNo: Dispatch<SetStateAction<string | undefined>>;
}

export default function ModalFilter({ isOpen, onClose, setRefNo }: IModalFilterProps) {
  const { handleSubmit, register } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const applyFilter = (data: FormSchemaType) => {
    setRefNo(data.ref_no === '' ? undefined : data.ref_no);
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
            Booking Records Filter
          </Heading>

          <br />

          <form onSubmit={handleSubmit(applyFilter)}>
            <Stack w='100%' spacing={5}>
              <TextField label='REFERENCE NO:' register={register} property='ref_no' placeholder='Enter reference number here' />
            </Stack>
            <br />
            <Button type='submit'>APPLY</Button>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
