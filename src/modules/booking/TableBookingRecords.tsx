import { useState } from 'react';
import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Skeleton,
  Box,
  ScaleFade,
  chakra,
  HStack,
  useDisclosure,
} from '@chakra-ui/react';
import { BsFilterCircleFill } from 'react-icons/bs';

import { tableFormatTimeDisplay } from '../utils/helper';
import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';
import ModalFilter from './ModalFilter';

const FilterIcon = chakra(BsFilterCircleFill);

export default function TableBookingRecords() {
  const [page, setPage] = useState(1);
  const [refNo, setRefNo] = useState<undefined | string>(undefined);
  const { isOpen, onToggle } = useDisclosure();
  const { data, isLoading } = trpc.booking.getManyBooking.useQuery({
    page,
    limit: 5,
    ref_no: refNo,
  });

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <>
      <ModalFilter isOpen={isOpen} onClose={onToggle} setRefNo={setRefNo} />

      <HStack justifyContent='space-between'>
        <FilterIcon h='40px' w='40px' color='primary.1' _hover={{ color: 'teal', cursor: 'pointer' }} onClick={onToggle} />
      </HStack>

      <br />

      <ScaleFade initialScale={0.9} in>
        <TableContainer w='100%'>
          <Table fontFamily='primary' color='primary.1'>
            <Thead>
              <Tr>
                <Th fontSize='md' fontFamily='primary'>
                  REFERENCE
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  NAME
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  SCHEDULE
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  GUESTS
                </Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                Array(5)
                  .fill(1)
                  .map((v, i) => (
                    <Tr key={i}>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                      <Td>
                        <Skeleton height='20px' />
                      </Td>
                    </Tr>
                  ))
              ) : data?.records.length === 0 ? (
                <Tr _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                  <Td colSpan={4} textAlign='center' fontSize='lg'>
                    No Records Found
                  </Td>
                </Tr>
              ) : (
                data?.records.map((v, i) => (
                  <Tr key={i} _hover={{ cursor: 'pointer', bg: 'secondary.1' }}>
                    <Td>{v.ref_no}</Td>
                    <Td>{v.name}</Td>
                    <Td>
                      {tableFormatTimeDisplay(v.startSession)} - {tableFormatTimeDisplay(v.endSession)}
                    </Td>
                    <Td>{v.guests}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
        <Box w='100%' mt='20px'>
          <Paginator currentPage={page} pageCount={data?.pageCount || 0} handlePageChange={handlePageChange} />
        </Box>
      </ScaleFade>
    </>
  );
}
