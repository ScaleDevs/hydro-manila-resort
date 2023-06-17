import * as React from 'react';
import { Box, Button, Card, CardBody, Heading, Stack, StackDivider, Text } from '@chakra-ui/react';
import { PHpeso } from '@/utils/helper';
import CostView from '../CostView';

const FieldValueReport = ({ fieldName, value }: { fieldName: string; value: string }) => {
  return (
    <Stack direction='row'>
      <Text pt='2' fontSize='sm' fontWeight='semibold'>
        {fieldName}:
      </Text>
      <Text pt='2' fontSize='sm'>
        {value}
      </Text>
    </Stack>
  );
};

export interface IStep4Props {}

export function Step4 (props: IStep4Props) {
  return (
    <Stack spacing={5}>
      <Heading fontSize='3xl' fontWeight='medium'>Review Details</Heading>

      <Card>
        <CardBody>
          <Stack divider={<StackDivider />} spacing='4'>
            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Schedule
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Reference No' value='asdasd' />
                <FieldValueReport fieldName='Guests' value='asdasd' />
                <FieldValueReport fieldName='Booked Date' value='asdasd' />
              </Stack>
            </Box>
            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Addons
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Reference No' value='asdasd' />
                <FieldValueReport fieldName='Guests' value='asdasd' />
                <FieldValueReport fieldName='Booked Date' value='asdasd' />
              </Stack>
            </Box>
            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Personal Details
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Reference No' value='asdasd' />
                <FieldValueReport fieldName='Guests' value='asdasd' />
                <FieldValueReport fieldName='Booked Date' value='asdasd' />
              </Stack>
            </Box>
          </Stack>
        </CardBody>
      </Card>
      
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
