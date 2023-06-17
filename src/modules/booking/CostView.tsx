import { useEffect, useState } from 'react';
import { HStack, Box, Text, Center, SlideFade, Spinner } from '@chakra-ui/react';
import { PHpeso } from '@/modules/utils/helper';
import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';

export interface ICostViewProps {
  productId?: string;
  roomId?: string | null;
  guests: number;
}

export default function CostView({ productId, roomId, guests }: ICostViewProps) {
  const [product, setProduct] = useState<IProduct | undefined>(undefined);
  const [room, setRoom] = useState<IRoom | undefined>(undefined);

  const { data: bookingSetting } = trpc.bookingSetting.getBookingSetting.useQuery();
  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });

  const getTotal = () => {
    if (!bookingSetting) return 0;

    let total = 0;
    if (product) total += product.price;
    if (room) total += room.price;
    if (guests && guests > bookingSetting.minPax) total += (guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;
    return total;
  };

  useEffect(() => {
    const product = productsData?.records.find((row) => row.productId === productId);
    const room = roomsData?.records.find((row) => row.roomId === roomId);

    setProduct(product);
    setRoom(room);
  }, [productId, productsData?.records, roomId, roomsData?.records]);

  if (fetchingProducts || fetchingRooms)
    return (
      <Box border='1px solid' borderColor='primary.1' mt='15px' p='10px'>
        <SlideFade in>
          <Center w='50%' h='300px' mx='auto'>
            <Spinner size='xl' />
          </Center>
        </SlideFade>
      </Box>
    );

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
        {room ? (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL ROOM ({room.roomIdentityName})</Text>
            <Text>{PHpeso.format(room.price)}</Text>
          </HStack>
        ) : (
          ''
        )}
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
