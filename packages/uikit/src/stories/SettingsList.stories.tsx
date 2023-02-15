import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';
import { ThemeProvider } from 'styled-components';
import {
  RecoveryPhraseIcon,
  SubscriptionIcon,
} from '../components/settings/SettingsIcons';
import { SettingsList } from '../components/settings/SettingsList';
import { defaultTheme } from '../styles/defaultTheme';
import { GlobalStyle } from '../styles/globalStyle';

export default {
  title: 'Example/SettingsList',
  component: SettingsList,
} as ComponentMeta<typeof SettingsList>;

const Template: ComponentStory<typeof SettingsList> = (args) => (
  <ThemeProvider theme={defaultTheme}>
    <GlobalStyle />
    <SettingsList {...args} />
  </ThemeProvider>
);

export const Primary = Template.bind({});
Primary.args = {
  items: [
    {
      name: 'Subscriptions',
      icon: <SubscriptionIcon />,
    },
    {
      name: 'Recovery phrase',
      icon: <RecoveryPhraseIcon />,
    },
    {
      name: 'Active address',
      icon: 'v4R2',
    },
  ],
};
