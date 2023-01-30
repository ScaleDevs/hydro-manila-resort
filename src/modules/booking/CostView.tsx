import * as React from 'react';
import { HStack, Box, Text } from '@chakra-ui/react';
import { IProduct, IRoom } from '@/utils/types';
import { PHpeso } from '@/utils/helper';

export interface ICostViewProps {
  product?: IProduct;
  room?: IRoom;
  guests: number;
}

export default function CostView({ product, room, guests }: ICostViewProps) {
  const getTotal = () => {
    let total = 0;
    if (product) total += product.details[product.activeVersion - 1].price;
    if (room) total += room.details[room.activeVersion - 1].price;
    if (guests && guests > 25) total += (guests - 25) * 250;
    return total;
  };

  return (
    <>
      <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
        <Text fontWeight='bold' color='white' textAlign='center'>
          TOTAL: {PHpeso.format(getTotal())}
        </Text>
      </Box>

      <Box border='1px solid' borderColor='primary.1' mt='15px' p='10px'>
        <Text>BREAKDOWN:</Text>
        {product ? (
          <HStack mt='10px' justifyContent='space-between'>
            <Text>{product.name}:</Text>
            <Text>{PHpeso.format(product.details[product.activeVersion - 1].price)}</Text>
          </HStack>
        ) : (
          ''
        )}
        {room ? (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL ROOM (ROOM {room.roomNumber})</Text>
            <Text>{PHpeso.format(room.details[room.activeVersion - 1].price)}</Text>
          </HStack>
        ) : (
          ''
        )}
        {guests && guests > 25 ? (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL PAX ({guests - 25})</Text>
            <Text>{PHpeso.format((guests - 25) * 250)}</Text>
          </HStack>
        ) : (
          ''
        )}
      </Box>
    </>
  );
}
