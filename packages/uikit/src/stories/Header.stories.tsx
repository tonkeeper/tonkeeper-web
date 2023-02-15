import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { Header } from '../components/Header';
import { defaultTheme } from '../styles/defaultTheme';
import { GlobalStyle } from '../styles/globalStyle';

export default {
  title: 'Block/Header',
  component: Header,
} as ComponentMeta<typeof Header>;

const Template: ComponentStory<typeof Header> = (args) => (
  <ThemeProvider theme={defaultTheme}>
    <GlobalStyle />
    <Header />
  </ThemeProvider>
);

export const Primary = Template.bind({});
