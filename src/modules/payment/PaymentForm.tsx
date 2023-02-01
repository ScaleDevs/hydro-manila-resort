import { useState } from 'react';
import { Heading, Stack, Collapse, Box } from '@chakra-ui/react';

import SelectPaymentMethod from './SelectPaymenthMethod';
import CardInputsForm from './CardMethod';
import GcashMethod from './GcashMethod';

export interface IPaymentFormProps {}

export default function PaymentForm({}: IPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('');

  return (
    <Box px='10px'>
      <Heading as='h1' size='lg' noOfLines={1} textAlign={{ bas: 'center', md: 'left' }}>
        Select Payment Method:
      </Heading>
      <Stack>
        <SelectPaymentMethod paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} />
      </Stack>

      <Collapse in={paymentMethod === 'gcash'} animateOpacity>
        <GcashMethod />
      </Collapse>

      <Collapse in={paymentMethod === 'card'} animateOpacity>
        <CardInputsForm />
      </Collapse>
    </Box>
  );
}
