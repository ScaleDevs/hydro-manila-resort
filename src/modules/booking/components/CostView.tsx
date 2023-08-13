import { Guests } from '@prisma/client';
import { HStack, Box, Text } from '@chakra-ui/react';
import { PHpeso } from '@/modules/utils/helper';
import { IProduct, IRoom } from '@/utils/types';
import { getExtraHeadsTotal, getProductPrice } from '@/utils/helper';

export interface ICostViewProps {
  product?: IProduct;
  rooms?: IRoom[];
  guests?: Guests;
  bookedDate?: string;
}

export default function CostView({ bookedDate, rooms = [], product, guests }: ICostViewProps) {
  const getTotal = () => {
    if (!product) return 0;
    const { guestSetting } = product;
    let total = 0;

    rooms.forEach((roomInfo) => (total += roomInfo.price));

    if (product && bookedDate) total += getProductPrice(bookedDate, product);
    else if (product) total += product.price;

    if (guests) {
      if (guests.overNightGuests > guestSetting.minOverNightGuestPax)
        total += getExtraHeadsTotal(guests.overNightGuests, guestSetting.minOverNightGuestPax, guestSetting.overNightGuestFee);
      if (guests.nonOverNightGuests > guestSetting.minNonOverNightGuestPax)
        total += getExtraHeadsTotal(
          guests.nonOverNightGuests,
          guestSetting.minNonOverNightGuestPax,
          guestSetting.nonOverNightGuestFee,
        );
    }

    return total;
  };

  if (!product) return null;

  const { guestSetting } = product;

  return (
    <>
      <Box border='1px solid' borderColor='primary.1' mt='15px' p='10px'>
        <Text>BREAKDOWN:</Text>
        {product && bookedDate ? (
          <HStack mt='10px' justifyContent='space-between'>
            <Text>{product.name}:</Text>
            <Text>{PHpeso.format(getProductPrice(bookedDate, product))}</Text>
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
        {guests && guests.overNightGuests > guestSetting.minOverNightGuestPax && (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL OVERNIGHT PAX ({guests.overNightGuests - guestSetting.minOverNightGuestPax})</Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(guests.overNightGuests, guestSetting.minOverNightGuestPax, guestSetting.overNightGuestFee),
              )}
            </Text>
          </HStack>
        )}
        {guests && guests.nonOverNightGuests > guestSetting.minNonOverNightGuestPax && (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL NON-OVERNIGHT PAX ({guests.nonOverNightGuests - guestSetting.minNonOverNightGuestPax})</Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(
                  guests.nonOverNightGuests,
                  guestSetting.minNonOverNightGuestPax,
                  guestSetting.nonOverNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        )}

        <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
          <Text fontWeight='bold' color='white' textAlign='center'>
            TOTAL: {PHpeso.format(getTotal())}
          </Text>
        </Box>
      </Box>
    </>
  );
}
