import { Dispatch, SetStateAction } from 'react';
import { Box, Skeleton, Stack, Text } from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';
import { IRoom } from '@/utils/types';
import { PHpeso } from '@/utils/helper';
import { GetApp } from '@/appspecs/theme';

export interface IChooseRoomProps {
  chosenRoom: IRoom | null;
  setChosenRoom: Dispatch<SetStateAction<IRoom | null>>;
}

export function ChooseRoom({ chosenRoom, setChosenRoom }: IChooseRoomProps) {
  const { data, isLoading } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });

  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>
        Choose Rooms{' '}
        <Text as='span' fontWeight='normal' color='gray.500'>
          (optional)
        </Text>
        :
      </Text>
      <br />
      <Stack
        direction='column'
        justifyContent={{ base: 'start', md: 'center' }}
        alignItems='center'
        spacing={1.5}
        mx='auto'
        overflowX='auto'
      >
        {isLoading ? (
          <>
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
          </>
        ) : (
          data?.records.map((record, index) => {
            const isActive = record.roomId === chosenRoom?.roomId;

            return (
              <Stack
                key={index}
                direction='row'
                bg={isActive ? GetApp.ActiveColor : 'blackAlpha.200'}
                borderRadius='10px'
                w='100%'
                py='7'
                justifyContent='space-around'
                cursor='pointer'
                _hover={isActive ? {} : { bg: 'blackAlpha.300' }}
                transition='background-color 0.25s'
                onClick={() => setChosenRoom(record)}
              >
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {record.roomIdentityName}
                </Text>
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {record.withBathroom ? 'w bathroom' : 'w/o bathroom'}
                </Text>
                <Text
                  textAlign='center'
                  fontSize={{ base: 'xs', sm: 'sm', lg: 'md' }}
                  fontWeight='semibold'
                  color={isActive ? 'white' : 'black'}
                >
                  {PHpeso.format(record.price)}
                </Text>
              </Stack>
            );
          })
        )}
      </Stack>
    </Box>
  );
}
