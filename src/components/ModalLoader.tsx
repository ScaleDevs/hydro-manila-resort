import * as React from 'react';
import { Modal, ModalOverlay, ModalContent, ModalBody, Spinner, Center, Heading } from '@chakra-ui/react';

export interface IModalLoaderProps {
  isOpen: boolean;
  title: string;
}

export default function ModalLoader({ isOpen, title }: IModalLoaderProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    <Modal isOpen={isOpen} closeOnOverlayClick={false} onClose={() => {}} isCentered>
      <ModalOverlay />
      <ModalContent borderRadius='md' p='5' bg='gray.100' w='90%'>
        <ModalBody>
          <Heading size='lg' color='primary.1' fontFamily='primary.1' textAlign='center'>
            {title}
          </Heading>
          <Center p='20px'>
            <Spinner thickness='4px' speed='0.65s' emptyColor='gray.200' color='teal.500' size='xl' />
          </Center>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
