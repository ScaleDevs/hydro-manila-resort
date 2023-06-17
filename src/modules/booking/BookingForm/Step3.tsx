import * as React from 'react';
import { Stack, Heading, Box, Button } from '@chakra-ui/react';
import { TextField } from '@/components/TextField';
import CostView from '../CostView';

export interface IStep3Props {}

export function Step3 (props: IStep3Props) {
  return (
    <Stack spacing={5}>
      <Heading fontSize='3xl' fontWeight='medium'>Personal Details</Heading>

      <Stack spacing='3' mt='20px'>
        <TextField 
          property='name' 
          placeholder='*Name' 
          label='Name:'
        />
        <TextField
          property='phoneNumber'
          placeholder='*Contact Number'
          label='Contact Number:'
        />
        <TextField 
          property='email' 
          placeholder='*Email'
          label='Email:'
        />
      </Stack>

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='300px'>
          <CostView guests={26} />
        </Box>
      </Stack>
      
      <Stack direction='row' justifyContent='space-between'>
        <Button>
          Back
        </Button>
        <Button>
          Proceed
        </Button>
      </Stack>
    </Stack>
  );
}
