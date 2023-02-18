import { useState } from 'react';
import Link from 'next/link';
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
  useToast,
  Button,
  ScaleFade,
  chakra,
  HStack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { BsFillTrashFill, BsFilterCircleFill } from 'react-icons/bs';
import dayjs from 'dayjs';

import { tableFormatTimeDisplay } from '../utils/helper';
import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';
import ModalFilter, { SessionFilter } from './ModalFilter';

const FilterIcon = chakra(BsFilterCircleFill);

export default function TableScheduledEvent() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [startSessionFilter, setStartSessionFilter] = useState<undefined | SessionFilter>({
    startDate: dayjs.utc().startOf('day').toISOString(),
    endDate: dayjs.utc().endOf('month').toISOString(),
  });
  const [endSessionFilter, setEndSessionFilter] = useState<undefined | SessionFilter>();
  const { isOpen, onToggle } = useDisclosure();
  const { data, isLoading } = trpc.scheduledevent.getManyScheduledEvent.useQuery({
    page,
    limit: 5,
    startSession: startSessionFilter,
    endSession: endSessionFilter,
  });
  const { mutate } = trpc.scheduledevent.deleteScheduledEvent.useMutation();
  const utils = trpc.useContext();

  const deleteScheduledEvent = (id: string) => {
    mutate(id, {
      onSuccess() {
        utils.scheduledevent.getManyScheduledEvent.setData(
          { page, limit: 5, startSession: startSessionFilter, endSession: endSessionFilter },
          (rec: any) => {
            const newRecords = rec?.records.filter((value: { scheduledEventId: string }) => value.scheduledEventId !== id);
            return {
              pageCount: rec?.pageCount,
              records: newRecords,
            };
          },
        );

        toast({
          title: 'scheduled event deleted.',
          status: 'error',
          duration: 9000,
          isClosable: true,
        });
      },
    });
  };

  const handlePageChange = (pageNumber: number) => {
    setPage(pageNumber);
  };

  return (
    <>
      <ModalFilter onClose={onToggle} {...{ isOpen, setStartSessionFilter, setEndSessionFilter }} />
      <HStack justifyContent='space-between'>
        <HStack>
          <Link href='/admin/events/create'>
            <Button borderRadius='full' h='50px' w='50px' fontSize='25px' fontWeight='normal'>
              +
            </Button>
          </Link>
          <Text fontWeight='semibold' fontSize='18px'>
            Scheduled Event
          </Text>
        </HStack>

        <HStack>
          <FilterIcon h='40px' w='40px' color='primary.1' _hover={{ color: 'teal', cursor: 'pointer' }} onClick={onToggle} />
        </HStack>
      </HStack>

      <br />

      <ScaleFade initialScale={0.9} in>
        <TableContainer w='100%'>
          <Table fontFamily='primary' color='primary.1'>
            <Thead>
              <Tr>
                <Th fontSize='md' fontFamily='primary'>
                  START
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  END
                </Th>
                <Th fontSize='md' fontFamily='primary'>
                  DESCRIPTION
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
                    <Td>{tableFormatTimeDisplay(v.startSession)}</Td>
                    <Td>{tableFormatTimeDisplay(v.endSession)}</Td>
                    <Td>{v.description}</Td>
                    <Td>
                      <Button borderRadius='sm' onClick={() => deleteScheduledEvent(v.scheduledEventId)}>
                        <BsFillTrashFill />
                      </Button>
                    </Td>
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
