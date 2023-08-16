import * as React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  ListItem,
  UnorderedList,
  Divider,
  Stack,
} from '@chakra-ui/react';

export interface ITermsAndConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const HydroTermsTC = () => {
  return (
    <>
      <Text fontWeight='semibold' pb='5px'>
        Rate Description:
      </Text>

      <Text>
        Our Best Available Rate is subject to the prevailing discount during the time of booking based on allocation and room
        availability. This is subject to change from time to time.
      </Text>

      <br />

      <Text>Please see Terms & Conditions for the Cancellation Policy.</Text>

      <br />

      <Text fontWeight='semibold' pb='5px'>
        *IMPORTANT:
      </Text>
      <Text>This promo rate does not include the security deposit and liquor corkage.</Text>

      <br />

      <Text fontWeight='semibold' pb='5px'>
        INCLUSIONS:
      </Text>
      <UnorderedList pl='10px'>
        <ListItem fontFamily='primary'>Wi-Fi Access</ListItem>
        <ListItem fontFamily='primary'>Swimming Pool</ListItem>
        <ListItem fontFamily='primary'>Videoke Machine</ListItem>
        <ListItem fontFamily='primary'>Kitchen and Dining Facility</ListItem>
        <ListItem fontFamily='primary'>Parking for 3 Cars</ListItem>
      </UnorderedList>

      <br />

      <Text fontWeight='semibold' pb='5px'>
        CHECK-IN INSTRUCTION:
      </Text>
      <Text>Upon arrival, please contact:</Text>
      <Text>Manang Eva</Text>
      <Text>+639772890414</Text>

      <br />

      <Text>Our caretakers will assist you during your stay.</Text>

      <br />

      <Text fontWeight='semibold' pb='5px'>
        TERMS AND CONDITIONS:
      </Text>
      <Text fontWeight='medium'>CHILD POLICY:</Text>
      <Text>0 to 2 years old: Free of charge</Text>
      <Text>3 years old and above: Adult rate</Text>
      <br />
      <Text>
        <Text as='span' fontWeight='medium'>
          Prepayment:
        </Text>{' '}
        Full prepayment is required to confirm your reservation.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          Modification:
        </Text>{' '}
        For booking modification, please cancel your current booking and create a new one.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          Cancellation:
        </Text>{' '}
        Guests can cancel until 5 days before check-in less 5% cancellation fee. 50% refund if the guest cancels 3 days before
        arrival. No refund for 24-hour cancellations. Promo Rate is non-refundable and cannot be changed or withdrawn.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          No Show:
        </Text>{' '}
        Your 100% prepayment will be forfeited if you do not arrive within 24 hours of the check-in date and time of the resort.
      </Text>

      <br />
      <Divider borderColor='black' />
      <br />

      <Text fontWeight='semibold' pb='5px'>
        RESORT POLICIES:
      </Text>
      <Stack>
        <Text>
          <Text as='span' fontWeight='medium'>
            Booking Confirmation:
          </Text>{' '}
          The reservation is considered confirmed when you receive a confirmation voucher thru email containing the reference ID.
          Present this together with a valid ID upon check-in. NO VOUCHER, NO CHECK-IN.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Booking Cancellation:
          </Text>{' '}
          Guests can cancel until 5 days before check-in less 5% cancellation fee. 50% refund if the guest cancels 3 days before
          arrival. No refund for 24-hour cancellations. Promo Rate is non-refundable and cannot be changed or withdrawn.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Cancellation Caused by Acts of Nature & National Events:
          </Text>{' '}
          The resort will not be held liable for services not rendered or for any loss or damage due to natural calamity and
          national events. If the client canceled a booking because of a natural calamity, such as a typhoon, there would be no
          refund. Still, the affected booking date can be rebooked to a new one within 30 days, subject to room availability and
          rate difference, if any. The rebooking is transferable and may be used by other people subject to the client's
          endorsement.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Check-in and Check-out Policy:
          </Text>{' '}
          Please refer to your reservation information above regarding the check-in and check-out schedule. Early check-in or late
          check-out will depend on room availability and with corresponding charges.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Credit Card Policy:
          </Text>{' '}
          The credit card used in this transaction must be presented at the resort upon check-in otherwise, the booking is
          considered unpaid, and will be required to make a new payment before they can check in. Charge-back brought by this is
          subject to a processing fee of 4% per booking. For third-party credit card transactions, guests must present the actual
          physical credit card used, a signed letter of authorization, and a photocopy of any government-issued ID (passport,
          driver’s license, etc.) from the credit card owner. All documents must bear the same details and signature.
          Non-compliance will be subjected to full payment upon check-in.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Extra Person:
          </Text>{' '}
          For an additional charge, please call +63 2 7745 3024 or email hydroresort.manila@gmail.com.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Kid Policy:
          </Text>{' '}
          Kids from 0 - 2 years old are free of charge.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            No-Show Policy:
          </Text>{' '}
          Full payment will be forfeited if guests do not arrive within 24 hours of the check-in date and time of the hotel.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Online Promo Rate:
          </Text>{' '}
          Online promo rates are not applicable for Senior Citizen and PWD (Persons with disabilities) discounts. Promo Rate is
          non-refundable and cannot be changed or canceled.
        </Text>
      </Stack>
    </>
  );
};

const VLTC = () => {
  return (
    <>
      <Text fontWeight='semibold' pb='5px'>
        INCLUSIONS:
      </Text>
      <UnorderedList pl='10px'>
        <ListItem fontFamily='primary'>Wi-Fi Access</ListItem>
        <ListItem fontFamily='primary'>Swimming Pool</ListItem>
        <ListItem fontFamily='primary'>Videoke Machine</ListItem>
        <ListItem fontFamily='primary'>Kitchen and Dining Facility</ListItem>
        <ListItem fontFamily='primary'>Parking for 3 Cars</ListItem>
      </UnorderedList>

      <br />

      <Text fontWeight='semibold' pb='5px'>
        CHECK-IN INSTRUCTION:
      </Text>
      <Text>Upon arrival, please contact:</Text>
      <Text>Manang Eva</Text>
      <Text>+639772890414</Text>

      <br />

      <Text>Our caretakers will assist you during your stay.</Text>

      <br />

      <Text fontWeight='medium'>CHILD POLICY:</Text>
      <Text>0 to 2 years old: Free of charge</Text>
      <Text>3 years old and above: Adult rate</Text>

      <br />
      <Text>
        <Text as='span' fontWeight='medium'>
          Prepayment:
        </Text>{' '}
        Full prepayment is required to confirm your reservation.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          Modification:
        </Text>{' '}
        For booking modification, go to Manage Booking on our website.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          Cancellation:
        </Text>{' '}
        Guests can cancel until 3 days before check-in, less 5% cancellation fee. No refund after that. Promo Rate is
        non-refundable and cannot be changed or withdrawn.
      </Text>
      <Text>
        <Text as='span' fontWeight='medium'>
          No Show:
        </Text>{' '}
        Your 100% prepayment will be forfeited if you do not arrive within 24 hours of the check-in date and time of the resort.
      </Text>

      <br />
      <Divider borderColor='black' />
      <br />

      <Text fontWeight='semibold' pb='5px'>
        RESORT POLICIES:
      </Text>
      <Stack>
        <Text>
          <Text as='span' fontWeight='medium'>
            Booking Confirmation:
          </Text>{' '}
          The reservation is confirmed when you receive a confirmation voucher thru email containing the reference ID. Present
          this together with a valid ID upon check-in. NO VOUCHER, NO CHECK-IN.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Booking Cancellation:
          </Text>{' '}
          Guests can cancel until 3 days before check-in, less 5% cancellation fee. No refund after that. Promo Rate is
          non-refundable and cannot be changed or withdrawn.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Cancellation Caused by Acts of Nature & National Events:
          </Text>{' '}
          The resort will not be held liable for services not rendered or for any loss or damage due to natural calamity and
          national events. If the client canceled a booking because of a natural calamity, such as a typhoon, there would be no
          refund. Still, the affected booking date can be rebooked to a new one within 30 days, subject to room availability and
          rate difference, if any. The rebooking is transferable and may be used by others subject to the client's endorsement.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Check-in and Check-out Policy:
          </Text>{' '}
          Please refer to your reservation information above regarding the check-in and check-out schedule. Early check-in or late
          check-out will depend on room availability and with corresponding charges.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Credit Card Policy:
          </Text>{' '}
          The credit card used in this transaction must be presented at the resort upon check-in. Otherwise, the booking is
          considered unpaid, and they will be required to make a new payment before they can check-in. Charge-back brought by this
          is subject to a processing fee of 5% per booking. For third-party credit card transactions, guests must present the
          actual physical credit card used, a signed letter of authorization, and a photocopy of any government-issued ID
          (passport, driver’s license, etc.) from the credit card owner. All documents must bear the same details and signature.
          Non-compliance will be subjected to full payment upon check-in.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Extra Person:
          </Text>{' '}
          Additional guests may be added for a fee. Go to Manage Booking to add guests.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Kid Policy:
          </Text>{' '}
          Kids from 0 - 2 years old are free of charge.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            No-Show Policy:
          </Text>{' '}
          Full payment will be forfeited if guests do not arrive within 24 hours of the check-in date and time of the hotel.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Online Promo Rate:
          </Text>{' '}
          Online promo rates are not applicable for Senior Citizens and PWD (Persons with Disabilities) discounts. Promo Rate is
          non-refundable and cannot be changed or canceled
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Pet-Friendly Policy:
          </Text>{' '}
          We are a pet-friendly resort. However, pets are not allowed to swim in the pool.
        </Text>
        <Text>
          <Text as='span' fontWeight='medium'>
            Non-Smoking Policy:
          </Text>{' '}
          In order to maintain the beauty and comfort of our resort, Villa Leonora strictly implements a NON-SMOKING POLICY inside
          the villa and rooms, and violators will be charged a penalty fee of Php 2,000.
        </Text>
      </Stack>
    </>
  );
};

export function TermsAndConditionModal({ isOpen, onClose, onAccept }: ITermsAndConditionModalProps) {
  return (
    <Modal isCentered onClose={onClose} isOpen={isOpen} motionPreset='slideInBottom' size='2xl'>
      <ModalOverlay backdropFilter='blur(10px)' />
      <ModalContent maxH='600px' overflowY='auto'>
        <ModalHeader mr='1px'>
          <Text fontSize='25px'>Terms and Condition</Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody maxH='600px' overflowY='auto' className='scrollbar' mr='1px'>
          {process.env.NEXT_PUBLIC_APP === 'HydroResortManila' ? <HydroTermsTC /> : <VLTC />}
        </ModalBody>
        <ModalFooter>
          <Button mr={3} onClick={onAccept}>
            Accept
          </Button>
          <Button colorScheme='red' mr={3} onClick={onClose} variant='outline'>
            Decline
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
