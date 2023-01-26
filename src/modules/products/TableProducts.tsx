import { useState } from 'react';
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td, Skeleton, Box, useToast, Button } from '@chakra-ui/react';
import { BsFillTrashFill } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import Paginator from '@/components/Paginator';

export interface ITableProductsProps {}

export default function TableProducts({}: ITableProductsProps) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = trpc.product.getProducts.useQuery({ page, limit: 5 });
  const { mutate } = trpc.product.deleteProduct.useMutation();
  const utils = trpc.useContext();

  const deleteProductRecord = (name: string, id: string) => {
    mutate(id, {
      onSuccess() {
        utils.product.getProducts.setData({ page, limit: 5 }, (rec: any) => {
          const newRecords = rec?.records.filter((value: { productId: string }) => value.productId !== id);
          return {
            pageCount: rec?.pageCount,
            records: newRecords,
          };
        });

        toast({
          title: `${name} Product deleted.`,
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
      <TableContainer>
        <Table fontFamily='primary' color='primary.1'>
          <Thead>
            <Tr>
              <Th fontSize='md' fontFamily='primary'>
                PRODUCT NAME
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                SCHEDULE
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                DESCRIPTION
              </Th>
              <Th fontSize='md' fontFamily='primary'>
                PRICE
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
                  <Td>{v.name}</Td>
                  <Td>
                    {v.details[(v.activeVersion || 1) - 1].scheduleStart} - {v.details[(v.activeVersion || 1) - 1].scheduleEnd}
                  </Td>
                  <Td>{v.details[(v.activeVersion || 1) - 1].description}</Td>
                  <Td>{v.details[(v.activeVersion || 1) - 1].price}</Td>
                  <Td>
                    <Button borderRadius='sm' onClick={() => deleteProductRecord(v.name, v.productId)}>
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
