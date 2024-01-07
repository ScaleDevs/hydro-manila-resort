import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react';

export interface IErrorAlertProps {
  message?: string;
}

export function ErrorAlert({ message }: IErrorAlertProps) {
  return (
    <Alert status='error'>
      <AlertIcon />
      <AlertDescription color='red' fontFamily='primary' fontSize='14px'>
        {message || 'Something went wrong (Contact administrator)'}
      </AlertDescription>
    </Alert>
  );
}
