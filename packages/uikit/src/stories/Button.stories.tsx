import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import { Button } from '../components/Button';
import { defaultTheme } from '../styles/defaultTheme';

// More on default export: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
export default {
  title: 'Example/Button',
  component: Button,
  // More on argTypes: https://storybook.js.org/docs/react/api/argtypes
  argTypes: {
    size: { control: 'select', options: ['small', 'medium', 'large'] },
    disabled: { control: 'boolean' },
    primary: { control: 'boolean' },
    secondary: { control: 'boolean' },
    children: { control: 'text' },
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => (
  <ThemeProvider theme={defaultTheme}>
    <Button {...args} />
  </ThemeProvider>
);

export const Primary = Template.bind({});
Primary.args = {
  size: 'small',
  primary: true,
  disabled: false,
  children: 'Label',
};

export const Secondary = Template.bind({});
Secondary.args = {
  secondary: true,
  disabled: true,
  children: 'Button',
};

export const Large = Template.bind({});
Large.args = {
  size: 'large',
  children: 'Large',
};
