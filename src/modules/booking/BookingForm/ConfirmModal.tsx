import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
} from '@chakra-ui/react';
import { TextField } from '@/components/TextField';

export interface IProp {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (paymentId: string | null) => void;
  isLoading: boolean;
}

export function ConfirmModal({ isOpen, onClose, onAccept, isLoading }: IProp) {
  const [paymentId, setPaymentId] = useState<string | null>(null);

  return (
    <Modal isCentered onClose={onClose} isOpen={isOpen} motionPreset='slideInBottom' size='2xl'>
      <ModalOverlay backdropFilter='blur(10px)' />
      <ModalContent maxH='600px' overflowY='auto'>
        <ModalHeader mr='1px'>
          <Text fontSize='25px'>Fill out input below (optional)</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH='600px' overflowY='auto' className='scrollbar' mr='1px'>
          <TextField label='Payment ID' property='paymentId' onChange={(val) => setPaymentId(val)} />
          <br />
          <Text color='gray.500'>note: clicking "YES" will proceed to create booking</Text>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={() => onAccept(paymentId)} isLoading={isLoading}>
            Yes
          </Button>
          <Button colorScheme='red' mr={3} onClick={onClose} variant='outline'>
            No
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
