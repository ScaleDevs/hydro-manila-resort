import { extendTheme } from '@chakra-ui/react';

// 2. Extend the theme to include custom colors, fonts, etc
const colors = {
  primary: {
    1: '#2c5155',
    2: '#fffbf8',
    3: '#ffffff',
  },
  secondary: {
    1: '#ebebeb',
    2: '#7f9193',
  },
};

export const theme = extendTheme({ colors });
