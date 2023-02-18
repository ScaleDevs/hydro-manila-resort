import * as React from 'react';
import { HStack, Box, Text } from '@chakra-ui/react';
import { IProduct, IRoom } from '@/utils/types';
import { PHpeso } from '@/modules/utils/helper';
import { trpc } from '@/utils/trpc';

export interface ICostViewProps {
  product?: IProduct;
  room?: IRoom;
  guests: number;
}

export default function CostView({ product, room, guests }: ICostViewProps) {
  const { data: bookingSetting } = trpc.bookingSetting.getBookingSetting.useQuery();

  const getTotal = () => {
    if (!bookingSetting) return 0;

    let total = 0;
    if (product) total += product.details[product.activeVersion - 1].price;
    if (room) total += room.details[room.activeVersion - 1].price;
    if (guests && guests > bookingSetting.minPax) total += (guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;
    return total;
  };

  return (
    <>
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
        {bookingSetting && guests && guests > bookingSetting.minPax ? (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL PAX ({guests - bookingSetting.minPax})</Text>
            <Text>{PHpeso.format((guests - bookingSetting.minPax) * 250)}</Text>
          </HStack>
        ) : (
          ''
        )}

        {bookingSetting && (product || guests || room) ? (
          <HStack justifyContent='space-between'>
            <Text>Convenience Fee ({bookingSetting.bookingFee}%)</Text>
            <Text>{PHpeso.format((bookingSetting.bookingFee / 100) * getTotal())}</Text>
          </HStack>
        ) : (
          ''
        )}

        {bookingSetting ? (
          <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
            <Text fontWeight='bold' color='white' textAlign='center'>
              TOTAL: {PHpeso.format(getTotal() + (bookingSetting.bookingFee / 100) * getTotal())}
            </Text>
          </Box>
        ) : (
          ''
        )}
      </Box>
    </>
  );
}
