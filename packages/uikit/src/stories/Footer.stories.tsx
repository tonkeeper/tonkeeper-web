import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { Footer } from '../components/Footer';
import { defaultTheme } from '../styles/defaultTheme';
import { GlobalStyle } from '../styles/globalStyle';

export default {
  title: 'Block/Footer',
  component: Footer,
  argTypes: {
    active: {
      control: 'select',
      options: ['wallet', 'activity', 'settings'],
      defaultValue: 'wallet',
    },
  },
} as ComponentMeta<typeof Footer>;

const Template: ComponentStory<typeof Footer> = (args) => (
  <ThemeProvider theme={defaultTheme}>
    <GlobalStyle />
    <Footer {...args} />
  </ThemeProvider>
);

export const Primary = Template.bind({});
