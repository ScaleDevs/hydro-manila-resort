import { HStack, Box, Text } from '@chakra-ui/react';
import { PHpeso } from '@/modules/utils/helper';
import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';

export interface ICostViewProps {
  product?: IProduct;
  rooms?: IRoom[];
  guests?: number;
}

export default function CostView({ rooms = [], product, guests }: ICostViewProps) {
  const { data: bookingSetting } = trpc.bookingSetting.getBookingSetting.useQuery();

  const getTotal = () => {
    if (!bookingSetting) return 0;

    let total = 0;
    rooms.forEach((roomInfo) => (total += roomInfo.price));
    if (product) total += product.price;
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
            <Text>{PHpeso.format(product.price)}</Text>
          </HStack>
        ) : (
          ''
        )}
        {rooms.length > 0
          ? rooms.map((roomInfo) => (
              <HStack key={roomInfo.roomId} justifyContent='space-between'>
                <Text>ADDITIONAL ROOM ({roomInfo.roomIdentityName})</Text>
                <Text>{PHpeso.format(roomInfo.price)}</Text>
              </HStack>
            ))
          : ''}
        {bookingSetting && guests && guests > bookingSetting.minPax ? (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL PAX ({guests - bookingSetting.minPax})</Text>
            <Text>{PHpeso.format((guests - bookingSetting.minPax) * bookingSetting.extraHeadFee)}</Text>
          </HStack>
        ) : (
          ''
        )}

        {bookingSetting ? (
          <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
            <Text fontWeight='bold' color='white' textAlign='center'>
              TOTAL: {PHpeso.format(getTotal())}
            </Text>
          </Box>
        ) : (
          ''
        )}
      </Box>
    </>
  );
}
