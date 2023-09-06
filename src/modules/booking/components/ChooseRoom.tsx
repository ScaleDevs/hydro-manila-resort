import { Dispatch, SetStateAction } from 'react';
import { Box, Skeleton, Stack, Text, Grid, GridItem, Center, List, ListIcon, ListItem } from '@chakra-ui/react';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { trpc } from '@/utils/trpc';
import { IRoom, ProductV2 } from '@/utils/types';
import { PHpeso } from '@/utils/helper';
import { GetApp } from '@/appspecs/theme';

export interface IChooseRoomProps {
  chosenSchedule: ProductV2;
  chosenRoomsMap: Map<string, IRoom>;
  setChosenRoomsMap: Dispatch<SetStateAction<Map<string, IRoom>>>;
}

export function ChooseRoom({ chosenSchedule, chosenRoomsMap, setChosenRoomsMap }: IChooseRoomProps) {
  const { data, isLoading } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });

  const getIcon = (doesHave: boolean) => {
    return doesHave ? AiOutlineCheck : AiOutlineClose;
  };

  const getColor = (doesHave: boolean) => {
    return doesHave ? 'green.800' : 'red.500';
  };

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
      <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} p='10px'>
        {isLoading ? (
          <>
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
            <Skeleton height='40px' w='100%' />
          </>
        ) : (
          data?.records.map((record, index) => {
            const isActive = !!chosenRoomsMap.get(record.roomId);
            const isIncludedInSched = chosenSchedule.includedRooms.some((roomId) => roomId === record.roomId);

            return (
              <GridItem
                colSpan={1}
                key={index}
                boxShadow='lg'
                borderRadius='sm'
                overflow='hidden'
                transition='outline 0.03s linear'
                cursor={isIncludedInSched ? 'not-allowed' : 'pointer'}
                _hover={isActive || isIncludedInSched ? {} : { outline: 'solid 2px', outlineColor: 'primary.1' }}
                outline={isActive || isIncludedInSched ? 'solid 4px' : '2px'}
                outlineColor={isActive || isIncludedInSched ? GetApp.ActiveColor : ''}
                onClick={() => {
                  if (isIncludedInSched) return;
                  const newMapValue = chosenRoomsMap;
                  if (isActive) newMapValue.delete(record.roomId);
                  else newMapValue.set(record.roomId, record);
                  setChosenRoomsMap(new Map(newMapValue));
                }}
              >
                <Center
                  bg={isIncludedInSched || isActive ? GetApp.ActiveColor : 'primary.1'}
                  py='7'
                  flexDirection='column'
                  transition='background-color 0.1s ease-in'
                >
                  <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                    {record.roomIdentityName}
                  </Text>
                  <Text textAlign='center' fontSize={{ base: 'xs', md: 'sm' }} fontWeight='semibold' color='white'>
                    {PHpeso.format(record.price)}
                  </Text>
                </Center>
                <Stack py='7' textAlign='left' px='25px' fontSize={{ base: 'xs', md: 'sm' }}>
                  <List spacing={3}>
                    <ListItem>
                      <ListIcon as={getIcon(!!record.guests)} color={getColor(!!record.guests)} />
                      {record.guests} Guest allowed
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(record.withBathroom)} color={getColor(record.withBathroom)} />
                      bathroom
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(record.withAircon)} color={getColor(record.withAircon)} />
                      Air Condition
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(record.withFan)} color={getColor(record.withFan)} />
                      Electric Fan
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(!!record.bedSingle)} color={getColor(!!record.bedSingle)} />
                      {record.bedSingle} Single bed
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(!!record.bedDouble)} color={getColor(!!record.bedDouble)} />
                      {record.bedDouble} Double bed
                    </ListItem>
                    <ListItem>
                      <ListIcon as={getIcon(!!record.bedQueen)} color={getColor(!!record.bedQueen)} />
                      {record.bedQueen} Queen bed
                    </ListItem>
                  </List>
                </Stack>
              </GridItem>
            );
          })
        )}
      </Grid>
    </Box>
  );
}
