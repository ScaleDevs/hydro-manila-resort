import { useState } from 'react';
import { Heading, Stack, Collapse, Box, Alert, AlertIcon } from '@chakra-ui/react';

import SelectPaymentMethod from './SelectPaymenthMethod';
import CardInputsForm from './CardMethod';
import GcashMethod from './GcashMethod';

export interface IPaymentFormProps {}

export default function PaymentForm({}: IPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isTaken, setIsTaken] = useState(false);

  return (
    <Box px='10px'>
      <Heading as='h1' size='lg' noOfLines={1} textAlign={{ bas: 'center', md: 'left' }}>
        Select Payment Method:
      </Heading>

      {isTaken ? (
        <Alert status='error' borderRadius='sm' my='10px' fontFamily='primary' color='red.600'>
          <AlertIcon />
          Schedule Already Taken, Kindly choose another schedule
        </Alert>
      ) : (
        ''
      )}

      <Stack>
        <SelectPaymentMethod paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
      </Stack>

      <Collapse in={paymentMethod === 'gcash'} animateOpacity>
        <GcashMethod setIsTaken={setIsTaken} />
      </Collapse>

      <Collapse in={paymentMethod === 'card'} animateOpacity>
        <CardInputsForm setIsTaken={setIsTaken} />
      </Collapse>
    </Box>
  );
}
