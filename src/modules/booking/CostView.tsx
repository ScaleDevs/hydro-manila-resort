import { Guests } from '@prisma/client';
import { HStack, Box, Text } from '@chakra-ui/react';
import { PHpeso } from '@/modules/utils/helper';
import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';
import { getExtraHeadsTotal } from '@/utils/helper';

export interface ICostViewProps {
  product?: IProduct;
  rooms?: IRoom[];
  guests?: Guests;
}

export default function CostView({ rooms = [], product, guests }: ICostViewProps) {
  const { data: bookingSetting } = trpc.bookingSetting.getBookingSetting.useQuery();

  const getTotal = () => {
    if (!bookingSetting) return 0;
    const { guests: guestSettings } = bookingSetting;
    let total = 0;
    rooms.forEach((roomInfo) => (total += roomInfo.price));
    if (product) total += product.price;
    if (guests) {
      if (guests.overNightGuests > guestSettings.minOverNightGuestPax)
        total += getExtraHeadsTotal(guests.overNightGuests, guestSettings.minOverNightGuestPax, guestSettings.overNightGuestFee);
      if (guests.nonOverNightGuests > guestSettings.minNonOverNightGuestPax)
        total += getExtraHeadsTotal(
          guests.nonOverNightGuests,
          guestSettings.minNonOverNightGuestPax,
          guestSettings.nonOverNightGuestFee,
        );
    }
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
        {bookingSetting && guests && guests.overNightGuests > bookingSetting.guests.minOverNightGuestPax && (
          <HStack justifyContent='space-between'>
            <Text>ADDITIONAL OVERNIGHT PAX ({guests.overNightGuests - bookingSetting.guests.minOverNightGuestPax})</Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(
                  guests.overNightGuests,
                  bookingSetting.guests.minOverNightGuestPax,
                  bookingSetting.guests.overNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        )}
        {bookingSetting && guests && guests.nonOverNightGuests > bookingSetting.guests.minNonOverNightGuestPax && (
          <HStack justifyContent='space-between'>
            <Text>
              ADDITIONAL NON-OVERNIGHT PAX ({guests.nonOverNightGuests - bookingSetting.guests.minNonOverNightGuestPax})
            </Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(
                  guests.nonOverNightGuests,
                  bookingSetting.guests.minNonOverNightGuestPax,
                  bookingSetting.guests.nonOverNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
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
