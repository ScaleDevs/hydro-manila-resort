import { Dispatch, SetStateAction, useState } from 'react';
import dayjs from 'dayjs';
import { Box, IconButton, Stack, Text, chakra } from '@chakra-ui/react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { ProductV2 } from '@/utils/types';
import { GetApp } from '@/appspecs/theme';

const LeftArrowIcon = chakra(BsChevronLeft);
const RightArrowIcon = chakra(BsChevronRight);

export interface IChooseDateProps {
  chosenDate: string | undefined;
  setChosenDate: Dispatch<SetStateAction<string | undefined>>;
  setChosenSchedule: Dispatch<SetStateAction<ProductV2 | undefined>>;
}

export function ChooseDate({ chosenDate, setChosenDate, setChosenSchedule }: IChooseDateProps) {
  const [dayState, setDayState] = useState(
    (() => {
      if (!!chosenDate) {
        const currentPos = dayjs(chosenDate).diff(dayjs(), 'day') + 2;
        console.log(Math.ceil(currentPos / 7) * 7 - 6);
        return dayjs().add(Math.ceil(currentPos / 7) * 7 - 7, 'day');
      }

      return dayjs();
    })(),
  );

  const handleArrows = (arrow: 'NEXT' | 'PREV') => {
    if (arrow === 'NEXT') setDayState(dayState.add(7, 'day'));
    else setDayState(dayState.subtract(7, 'day'));
  };

  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>
        Choose Date - <Text as='span' color='gray.400' fontWeight='normal'>{`${dayState.format('MMM YYYY')}`}</Text>
      </Text>
      <Stack
        py='5'
        direction='row'
        justifyContent={{ base: 'start', md: 'center' }}
        alignItems='center'
        spacing={{ base: 3, md: 2, lg: 5 }}
        mx='auto'
        overflowX='auto'
      >
        {dayjs().format('MM-DD-YYYY') !== dayState.format('MM-DD-YYYY') && (
          <Box>
            <IconButton
              aria-label='Left Arrow'
              bg='none'
              size='xs'
              borderRadius='29px'
              _hover={{ bg: 'gray.100' }}
              icon={<LeftArrowIcon _hover={{ cursor: 'pointer' }} color='gray.500' w='15px' h='15px' />}
              onClick={() => handleArrows('PREV')}
            />
          </Box>
        )}

        {Array(7)
          .fill(1)
          .map((item, i) => {
            const dateDisplay = dayState.add(i, 'day');
            const isActive = chosenDate === dateDisplay.format('YYYY-MM-DD');

            return (
              <Box
                key={i}
                bg={isActive ? GetApp.ActiveColor : '#FBFBFB'}
                borderRadius='10px'
                boxShadow='md'
                border='1px'
                borderColor='gray.200'
                minW={{ base: '80px', lg: '100px' }}
                h='105px'
                p={5}
                cursor='pointer'
                _hover={isActive ? {} : { bg: 'gray.100' }}
                transition='background-color 0.25s'
                onClick={() => {
                  setChosenDate(dateDisplay.format('YYYY-MM-DD'));
                  setChosenSchedule(undefined);
                }}
              >
                <Text textAlign='center' color={isActive ? 'white' : 'gray.400'} fontSize={{ base: 'sm', lg: 'md' }}>
                  {dateDisplay.format('MMM')}
                </Text>
                <Text textAlign='center' color={isActive ? 'white' : 'gray.400'} fontSize={{ base: 'sm', lg: 'md' }}>
                  {dateDisplay.format('DD')}
                </Text>
                <Text textAlign='center' color={isActive ? 'white' : 'gray.500'} fontSize={{ base: 'sm', lg: 'md' }}>
                  {dateDisplay.format('ddd')}
                </Text>
              </Box>
            );
          })}

        <Box>
          <IconButton
            aria-label='Right Arrow'
            bg='none'
            size='xs'
            borderRadius='29px'
            _hover={{ bg: 'gray.100' }}
            icon={<RightArrowIcon _hover={{ cursor: 'pointer' }} color='gray.500' w='15px' h='15px' />}
            onClick={() => handleArrows('NEXT')}
          />
        </Box>
      </Stack>
    </Box>
  );
}
