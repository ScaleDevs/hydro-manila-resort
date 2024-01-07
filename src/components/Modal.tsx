import { ReactNode, useRef } from 'react';
import {
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
} from '@chakra-ui/react';

export interface IModalProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
}

export default function Modal({ title, confirmText = 'Confirm', children, isOpen, isLoading, onConfirm, onClose }: IModalProps) {
  const initialRef = useRef(null);

  return (
    <ChakraModal initialFocusRef={initialRef} isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader fontFamily='primary'>{title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>{children}</ModalBody>

        {onConfirm && (
          <ModalFooter>
            <Button
              type='submit'
              onClick={() => {
                !!onConfirm && onConfirm();
              }}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </ModalFooter>
        )}
      </ModalContent>
    </ChakraModal>
  );
}
