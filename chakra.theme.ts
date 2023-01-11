import { extendTheme } from '@chakra-ui/react';
import Input from './theme/input.comp';
import Button from './theme/button.comp';
import Heading from './theme/heading.comp';

export const theme = extendTheme({
  colors: {
    primary: {
      1: '#2c5155',
      2: '#fffbf8',
      3: '#ffffff',
    },
    secondary: {
      1: '#ebebeb',
      2: '#7f9193',
    },
  },
  fonts: {
    primary: 'Poppins, sans-serif',
  },
  components: {
    Heading,
    Button,
    Input,
  },
});
