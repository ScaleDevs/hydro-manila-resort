import * as React from 'react';
import { Guests } from '@prisma/client';
import { Control, Controller } from 'react-hook-form';
import { Grid, Skeleton, GridItem, Center, Stack, List, ListItem, ListIcon, Text } from '@chakra-ui/react';
import { AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';

import { GetApp } from '@/appspecs/theme';
import { PHpeso } from '@/utils/helper';
import { IProduct, IRoom } from '@/utils/types';

export interface IControlledChooseRoomsProps {
  control: Control<
    {
      productId: string;
      guests: Guests;
      rooms: string[];
      bookingDate: string;
    },
    any
  >;
  isLoading: boolean;
  records: IRoom[];
  selectedProduct: IProduct | undefined;
  onAdd?: (room: IRoom) => void;
  onRemove?: (roomId: string) => void;
}

export default function ControlledChooseRooms({
  control,
  isLoading,
  records,
  selectedProduct,
  onAdd,
  onRemove,
}: IControlledChooseRoomsProps) {
  const getIcon = (doesHave: boolean) => {
    return doesHave ? AiOutlineCheck : AiOutlineClose;
  };

  const getColor = (doesHave: boolean) => {
    return doesHave ? 'green.800' : 'red.500';
  };

  return (
    <Controller
      control={control}
      name='rooms'
      render={({ field: { onChange, value } }) => {
        return (
          <Grid templateColumns={{ base: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={4} p='10px'>
            {isLoading ? (
              <>
                <Skeleton height='40px' w='100%' />
                <Skeleton height='40px' w='100%' />
                <Skeleton height='40px' w='100%' />
                <Skeleton height='40px' w='100%' />
              </>
            ) : (
              records.map((record, index) => {
                const isActive = value.some((roomId) => roomId === record.roomId);
                const isIncludedInSched = selectedProduct?.includedRooms.some((roomId) => roomId === record.roomId);

                return (
                  <GridItem
                    colSpan={1}
                    key={index}
                    borderRadius='md'
                    boxShadow='lg'
                    overflow='hidden'
                    transition='outline 0.1s linear'
                    cursor={isIncludedInSched ? 'not-allowed' : 'pointer'}
                    _hover={isActive || isIncludedInSched ? {} : { outline: 'solid 2px', outlineColor: 'primary.1' }}
                    outline={isActive || isIncludedInSched ? 'solid 4px' : '2px'}
                    outlineColor={isActive || isIncludedInSched ? GetApp.ActiveColor : ''}
                    onClick={() => {
                      if (isIncludedInSched) return;
                      if (isActive) {
                        onChange({ target: { value: [...value].filter((roomId) => roomId !== record.roomId) } });
                        onRemove && onRemove(record.roomId);
                      } else {
                        onChange({ target: { value: [...value, record.roomId] } });
                        onAdd && onAdd(record);
                      }
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
        );
      }}
    />
  );
}
