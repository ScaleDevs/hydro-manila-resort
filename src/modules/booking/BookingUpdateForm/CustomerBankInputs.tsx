import { Alert, AlertIcon, Button, SlideFade, Stack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { TextField } from '@/components/TextField';
import useBookingUpdateRequestStoreTrack, { customerBankInfoSchema, CustomerBankInfo } from '@/store/update_booking.store';

const schema = customerBankInfoSchema;

export interface ICustomerBankInputProps {
  nextStep: () => void;
  previousStep: () => void;
}

export default function CustomerBankInput({ nextStep, previousStep }: ICustomerBankInputProps) {
  const { customerBankInfo, setCustomerBankInfo } = useBookingUpdateRequestStoreTrack();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerBankInfo>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...customerBankInfo,
    },
  });

  const proceed = (data: CustomerBankInfo) => {
    setCustomerBankInfo(data);
    nextStep();
  };

  return (
    <SlideFade in={true} offsetY='20px'>
      <Stack w={{ base: '95%', md: '50%' }} mx='auto'>
        <form onSubmit={handleSubmit(proceed)}>
          <Stack spacing={5}>
            <Alert status='info' borderRadius='sm' color='blue.600'>
              <AlertIcon />
              Kindly input your bank details which will be used as destination for the refund
            </Alert>

            <TextField
              label='Bank Type:'
              register={register}
              property='bankType'
              placeholder='Bank Type'
              errMsg={!!errors.bankType?.message ? 'Required' : undefined}
            />
            <TextField
              label='Account Name:'
              register={register}
              property='accountName'
              placeholder='Account name'
              errMsg={!!errors.accountName?.message ? 'Required' : undefined}
            />
            <TextField
              label='Account No:'
              register={register}
              property='accountNo'
              placeholder='Account No'
              errMsg={!!errors.accountNo?.message ? 'Required' : undefined}
            />
          </Stack>

          <br />

          <Stack direction='row' justifyContent='space-between'>
            <Button onClick={previousStep}>BACK</Button>

            <Button type='submit'>PROCEED</Button>
          </Stack>
        </form>
      </Stack>
    </SlideFade>
  );
}
