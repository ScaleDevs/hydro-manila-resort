import { extendTheme } from '@chakra-ui/react';

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  primary: {
    1: '#319795',
    2: '#153e75',
    3: '#CBD5E0',
  },
};

export const theme = extendTheme({ colors });
