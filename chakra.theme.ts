import { extendTheme } from '@chakra-ui/react';
import Button from './theme/button.comp';
import Heading from './theme/heading.comp';
import Text from './theme/text.comp';
import { GetApp } from '@/appspecs/theme';

export const theme = extendTheme({
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
  colors: GetApp.ThemeColors,
  fonts: {
    primary: 'Poppins, sans-serif',
  },
  components: {
    Heading,
    Button,
    Text,
  },
});
