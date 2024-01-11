import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Tab,
  TabIndicator,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Stack,
  BreadcrumbSeparator,
} from '@chakra-ui/react';

import Layout from '@/layouts/admin';
import { trpc } from '@/utils/trpc';
import AdminEditBookingForm from '@/modules/booking/AdminEditBookingForm';
import { GetApp } from '@/appspecs/theme';
import { Details } from '@/modules/booking/BookingDetails';
import { Logs } from '@/modules/booking/BookingDetails/Logs';

interface Props {
  id: string;
  goBack: () => void;
}

function Component({ id, goBack }: Props) {
  const [tabIndex, setTabIndex] = useState(0);
  const { data, isLoading } = trpc.booking.getBookingByRefNo.useQuery(id);

  const handleTabsChange = (index: number) => setTabIndex(index);

  return (
    <Layout>
      <Head>
        <title>Admin | Bookings Details</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack w='full'>
        <Breadcrumb fontFamily='primary' color={GetApp.ActiveColor} fontWeight='medium'>
          <BreadcrumbItem onClick={goBack}>
            <BreadcrumbSeparator />
            <BreadcrumbLink>Bookings</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href='#'>{id}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <br />

      <Tabs isLazy position='relative' variant='unstyled' w='100%' index={tabIndex} onChange={handleTabsChange}>
        <TabList>
          <Tab fontFamily='primary' fontWeight='medium'>
            DETAILS
          </Tab>
          <Tab fontFamily='primary' fontWeight='medium'>
            LOGS
          </Tab>
          <Tab fontFamily='primary' fontWeight='medium'>
            EDIT
          </Tab>
        </TabList>

        <TabIndicator mt='' height='2px' bg={GetApp.ActiveColor} borderRadius='1px' />

        <TabPanels mt='10px'>
          <TabPanel p='0'>
            <Details bookingRefNo={id} data={data} isLoading={isLoading} isIn={tabIndex === 0} />
          </TabPanel>
          <TabPanel p='0'>
            <Logs data={data} isIn={tabIndex === 1} />
          </TabPanel>
          <TabPanel p='0'>{data && <AdminEditBookingForm bookingInfo={data} bookingRefNo={id} isIn={tabIndex === 2} />}</TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  );
}

function Bookings() {
  const router = useRouter();

  if (router.query.id) return <Component id={router.query.id as string} goBack={router.back} />;

  return '';
}

export default Bookings;
