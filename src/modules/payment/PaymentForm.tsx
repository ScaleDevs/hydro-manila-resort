import { useState } from 'react';
import { Heading, Stack, Collapse, Box, Alert, AlertIcon, Button } from '@chakra-ui/react';
import { BsArrowLeft } from 'react-icons/bs';

import SelectPaymentMethod from './SelectPaymenthMethod';
import CardInputsForm from './CardMethod';
import GcashMethod from './GcashMethod';

export interface IPaymentFormProps {
  previousStep: () => void;
}

export default function PaymentForm({ previousStep }: IPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isTaken, setIsTaken] = useState(false);

  return (
    <Box px='10px'>
      <Button onClick={previousStep}>
        <BsArrowLeft />
      </Button>
      <br />
      <br />
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
        <br />
        <br />
      </Collapse>
    </Box>
  );
}
