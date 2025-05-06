import { Guests } from '@prisma/client';
import { HStack, Box, Text, Collapse } from '@chakra-ui/react';
import { PHpeso } from '@/modules/utils/helper';
import { IProduct, IRoom } from '@/utils/types';
import { getExtraHeadsTotal, getProductPrice, getPromo, getSubtractedHeadsTotal } from '@/utils/helper';

export interface ICostViewProps {
  product?: IProduct;
  rooms?: IRoom[];
  guests?: Guests;
  bookedDate?: string;
  originalBooking?: {
    rooms?: IRoom[];
    guests?: Guests;
    bookedDate?: string;
  };
}

export default function CostView({ bookedDate, rooms = [], product, guests, originalBooking }: ICostViewProps) {
  const getTotal = () => {
    if (!product) return 0;
    const { guestSetting } = product;
    const promo = bookedDate ? getPromo(bookedDate, product) : null;
    const minOverNightGuestPax = promo?.paxInclusion ?? guestSetting.minOverNightGuestPax;

    let total = 0;

    if (bookedDate) total += getProductPrice(bookedDate, product);

    // subtracting (for update form)
    if (!!originalBooking?.bookedDate) {
      const originalProductPrice = getProductPrice(originalBooking.bookedDate, product);
      total = total - originalProductPrice;
    }

    if (guests) {
      if (guests.overNightGuests > minOverNightGuestPax)
        total += getExtraHeadsTotal(
          guests.overNightGuests,
          originalBooking?.guests?.overNightGuests || minOverNightGuestPax,
          guestSetting.overNightGuestFee,
        );
      if (guests.nonOverNightGuests > guestSetting.minNonOverNightGuestPax)
        total += getExtraHeadsTotal(
          guests.nonOverNightGuests,
          originalBooking?.guests?.nonOverNightGuests || guestSetting.minNonOverNightGuestPax,
          guestSetting.nonOverNightGuestFee,
        );

      // subtracting (for update form)
      if (!!originalBooking?.guests?.overNightGuests && guests.overNightGuests < originalBooking.guests.overNightGuests)
        total += getSubtractedHeadsTotal(
          guests.overNightGuests,
          originalBooking.guests.overNightGuests,
          guestSetting.overNightGuestFee,
        );
      if (!!originalBooking?.guests?.nonOverNightGuests && guests.nonOverNightGuests < originalBooking.guests.nonOverNightGuests)
        total += getSubtractedHeadsTotal(
          guests.nonOverNightGuests,
          originalBooking.guests.nonOverNightGuests,
          guestSetting.nonOverNightGuestFee,
        );
    }

    rooms.forEach((roomInfo) => {
      if (product.includedRooms.includes(roomInfo.roomId)) return;
      if (!!originalBooking?.rooms && originalBooking.rooms.some((v) => v.roomId === roomInfo.roomId)) return;
      total += roomInfo.price;
    });

    // subtracting (for update form)
    if (!!originalBooking?.rooms && originalBooking.rooms.length > 0)
      originalBooking.rooms.forEach((orig) => {
        if (!rooms.some((v) => v.roomId === orig.roomId)) total -= orig.price;
      });

    return total;
  };

  if (!product) return null;

  const { guestSetting, includedRooms } = product;
  const promo = bookedDate ? getPromo(bookedDate, product) : null;
  const minOverNightGuestPax = promo?.paxInclusion ?? guestSetting.minOverNightGuestPax;

  return (
    <>
      <Box border='1px solid' borderColor='primary.1' mt='15px' p='10px'>
        <Text>BREAKDOWN:</Text>

        <Collapse
          in={
            !!product &&
            !!bookedDate &&
            (!!originalBooking?.bookedDate
              ? getProductPrice(bookedDate, product) - getProductPrice(originalBooking.bookedDate, product) !== 0
              : true)
          }
        >
          <HStack mt='10px' justifyContent='space-between'>
            <Text>{product.name}:</Text>
            {originalBooking?.bookedDate ? (
              <Text>
                {PHpeso.format(
                  !!bookedDate ? getProductPrice(bookedDate, product) - getProductPrice(originalBooking.bookedDate, product) : 0,
                )}
              </Text>
            ) : (
              <Text>{PHpeso.format(!!bookedDate ? getProductPrice(bookedDate, product) : 0)}</Text>
            )}
          </HStack>
        </Collapse>

        {rooms.length > 0 &&
          rooms.map((roomInfo) => {
            if (!!originalBooking?.rooms && originalBooking.rooms.some((v) => v.roomId === roomInfo.roomId)) return null;
            if (includedRooms.includes(roomInfo.roomId)) return null;

            return (
              <HStack key={roomInfo.roomId} justifyContent='space-between'>
                <Text>ADDITIONAL ROOM ({roomInfo.roomIdentityName})</Text>
                <Text>{PHpeso.format(roomInfo.price)}</Text>
              </HStack>
            );
          })}

        {/* For Update Form subtracting unselected rooms */}
        {!!originalBooking?.rooms &&
          originalBooking.rooms.length > 0 &&
          originalBooking.rooms.map((roomInfo) => {
            if (!rooms.some((v) => v.roomId === roomInfo.roomId))
              return (
                <HStack key={roomInfo.roomId} justifyContent='space-between'>
                  <Text>REMOVED ROOM ({roomInfo.roomIdentityName})</Text>
                  <Text>{PHpeso.format(-Math.abs(roomInfo.price))}</Text>
                </HStack>
              );

            return null;
          })}

        <Collapse in={guests && guests.overNightGuests > (originalBooking?.guests?.overNightGuests || minOverNightGuestPax)}>
          <HStack justifyContent='space-between'>
            <Text>
              ADDITIONAL OVERNIGHT PAX (
              {guests?.overNightGuests
                ? (guests?.overNightGuests || 0) - (originalBooking?.guests?.overNightGuests || minOverNightGuestPax)
                : ''}
              )
            </Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(
                  guests?.overNightGuests || 0,
                  originalBooking?.guests?.overNightGuests || minOverNightGuestPax,
                  guestSetting.overNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        </Collapse>

        {/* For Update Form subtracting of overnight guests */}
        <Collapse
          in={
            guests &&
            !!originalBooking?.guests?.overNightGuests &&
            (guests.overNightGuests || 0) < originalBooking.guests.overNightGuests
          }
        >
          <HStack justifyContent='space-between'>
            <Text>
              REMOVED OVERNIGHT PAX (
              {guests?.overNightGuests
                ? (guests?.overNightGuests || 0) - (originalBooking?.guests?.overNightGuests || minOverNightGuestPax)
                : ''}
              )
            </Text>
            <Text>
              {PHpeso.format(
                getSubtractedHeadsTotal(
                  guests?.overNightGuests || 0,
                  originalBooking?.guests?.overNightGuests || minOverNightGuestPax,
                  guestSetting.overNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        </Collapse>

        <Collapse
          in={
            guests &&
            guests.nonOverNightGuests > (originalBooking?.guests?.nonOverNightGuests || guestSetting.minNonOverNightGuestPax)
          }
        >
          <HStack justifyContent='space-between'>
            <Text>
              ADDITIONAL {product.isAllRooms ? 'NON-OVERNIGHT' : ''} PAX (
              {guests
                ? guests.nonOverNightGuests -
                  (originalBooking?.guests?.nonOverNightGuests || guestSetting.minNonOverNightGuestPax)
                : ''}
              )
            </Text>
            <Text>
              {PHpeso.format(
                getExtraHeadsTotal(
                  guests?.nonOverNightGuests || 0,
                  originalBooking?.guests?.nonOverNightGuests || guestSetting.minNonOverNightGuestPax,
                  guestSetting.nonOverNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        </Collapse>

        {/* For Update Form subtracting of non overnight guests */}
        <Collapse
          in={
            guests &&
            !!originalBooking?.guests?.nonOverNightGuests &&
            guests.nonOverNightGuests < originalBooking.guests.nonOverNightGuests
          }
        >
          <HStack justifyContent='space-between'>
            <Text>
              REMOVED {product.isAllRooms ? 'NON-OVERNIGHT' : ''} PAX (
              {guests ? guests.nonOverNightGuests - (originalBooking?.guests?.nonOverNightGuests ?? 0) : ''})
            </Text>
            <Text>
              {PHpeso.format(
                getSubtractedHeadsTotal(
                  guests?.nonOverNightGuests || 0,
                  originalBooking?.guests?.nonOverNightGuests ?? 0,
                  guestSetting.nonOverNightGuestFee,
                ),
              )}
            </Text>
          </HStack>
        </Collapse>

        <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
          <Text fontWeight='bold' color='white' textAlign='center'>
            TOTAL: {PHpeso.format(getTotal())}
          </Text>
        </Box>
      </Box>
    </>
  );
}
