import { useState } from 'react';
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td, Skeleton, Box, useToast, Button } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { BsFillTrashFill } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';

export default function TableScheduledEvent() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.scheduledevent.getManyScheduledEvent.useQuery({ page, limit: 5 });
  const { mutate } = trpc.scheduledevent.deleteScheduledEvent.useMutation();
  const utils = trpc.useContext();

  const deleteScheduledEvent = (id: string) => {
    mutate(id, {
      onSuccess() {
        utils.scheduledevent.getManyScheduledEvent.setData({ page, limit: 5 }, (rec: any) => {
          const newRecords = rec?.records.filter((value: { scheduledEventId: string }) => value.scheduledEventId !== id);
          return {
            pageCount: rec?.pageCount,
            records: newRecords,
          };
        });

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
                  <Td>{dayjs(v.startSession).format('MMM DD, YYYY hh:mm A')}</Td>
                  <Td>{dayjs(v.endSession).format('MMM DD, YYYY hh:mm A')}</Td>
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
    </>
  );
}
