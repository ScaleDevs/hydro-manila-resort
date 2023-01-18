import { useState } from 'react';
import { Box, Grid, GridItem, Heading, HStack, Text } from '@chakra-ui/react';
import dayjs from 'dayjs';

const CalCell = ({ children }: { children: any }) => {
  return (
    <Box w='50px'>
      <Text textAlign='center'>{children}</Text>
    </Box>
  );
};

interface ICalenderInputProps {}

export default function CalenderInput({}: ICalenderInputProps) {
  const [year] = useState(dayjs().year());
  const [month] = useState(dayjs().format('MMMM'));
  const [days] = useState(dayjs().daysInMonth());
  const [selectedDate, setSelecetedDate] = useState<string | null>();

  const handleChange = (value: any) => {
    const dayjsInstance = dayjs();
    console.log(dayjs(`${dayjsInstance.year()}-${dayjsInstance.month() + 1}-${value}`).format('DD-MM-YYYY'));
    setSelecetedDate(dayjs(`${dayjsInstance.year()}-${dayjsInstance.month() + 1}-${value}`).format('YYYY-MM-DD'));
  };

  return (
    <Box maxW={{ md: '350px' }} mx='auto'>
      <Heading size='md' textAlign={{ base: 'left', md: 'center' }} color='primary.1'>
        CHOOSE A DATE
      </Heading>
      <Box maxW={{ md: '350px' }} border='1px solid' borderColor='secondary.2' p='3' bg='white'>
        <Heading size='md' textAlign='center' color='primary.1'>
          {month} {year}
        </Heading>

        <HStack w='100%' borderY='2px' justifyContent='center' spacing='2'>
          <CalCell>Sun</CalCell>
          <CalCell>Mon</CalCell>
          <CalCell>Tue</CalCell>
          <CalCell>Wed</CalCell>
          <CalCell>Thu</CalCell>
          <CalCell>Fri</CalCell>
          <CalCell>Sat</CalCell>
        </HStack>

        <Grid w='100%' justifyContent='center' templateColumns='repeat(7, 1fr)' gap='2' mt='10px'>
          {Array(dayjs().startOf('M').day())
            .fill(1)
            .map((item, i) => {
              return (
                <GridItem key={i} textAlign='center' py='5px' _hover={{ bg: 'secondary.1', cursor: 'pointer' }}>
                  {' '}
                </GridItem>
              );
            })}
          {Array(days)
            .fill(1)
            .map((item, i) => {
              return (
                <GridItem
                  key={i}
                  textAlign='center'
                  py='5px'
                  border={!!selectedDate && dayjs(selectedDate).date() === i + item ? '1px solid' : ''}
                  borderColor={!!selectedDate && dayjs(selectedDate).date() === i + item ? 'primary.1' : ''}
                  _hover={{ bg: 'secondary.1', cursor: 'pointer' }}
                  onClick={() => handleChange(i + item)}
                >
                  {i + item}
                </GridItem>
              );
            })}
        </Grid>
      </Box>
    </Box>
  );
}
