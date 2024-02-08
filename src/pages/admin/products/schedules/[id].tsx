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
import { GetApp } from '@/appspecs/theme';
import { AddPromo } from '@/modules/products/AddPromo';
import { ScheduleDetails } from '@/modules/products/ScheduleDetails';

interface Props {
  id: string;
  goBack: () => void;
}

function Component({ id, goBack }: Props) {
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabsChange = (index: number) => setTabIndex(index);

  return (
    <Layout>
      <Head>
        <title>Admin | Schedule Details</title>
        <meta name='description' content='schedule details' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack w='full'>
        <Breadcrumb fontFamily='primary' color={GetApp.ActiveColor} fontWeight='medium'>
          <BreadcrumbItem onClick={goBack}>
            <BreadcrumbSeparator />
            <BreadcrumbLink>Schedules</BreadcrumbLink>
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
            EDIT
          </Tab>
        </TabList>

        <TabIndicator mt='' height='2px' bg={GetApp.ActiveColor} borderRadius='1px' />

        <TabPanels mt='10px'>
          <TabPanel p='0'>
            <ScheduleDetails id={id} isIn={tabIndex === 0} />
          </TabPanel>
          <TabPanel p='0'>
            <AddPromo productId={id} isIn={tabIndex === 1} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Layout>
  );
}

function Schedule() {
  const router = useRouter();

  if (router.query.id) return <Component id={router.query.id as string} goBack={router.back} />;

  return '';
}

export default Schedule;
