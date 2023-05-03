import { InfiniteData } from '@tanstack/react-query';
import {
  AccountEvent,
  AccountEvents200Response,
  Action,
} from '@tonkeeper/core/dist/tonApiV1';

export const formatActivityDate = (
  language: string,
  key: string,
  timestamp: number
): string => {
  const date = new Date(timestamp * 1000);

  if (date.getFullYear() < new Date().getFullYear()) {
    return new Intl.DateTimeFormat(language, {
      day: 'numeric',
      month: 'short',
    }).format(date);
  } else if (key.startsWith('year')) {
    return new Intl.DateTimeFormat(language, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } else {
    return new Intl.DateTimeFormat(language, { timeStyle: 'short' }).format(
      date
    );
  }
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const getActivityTitle = (
  language: string,
  key: string,
  timestamp: number
) => {
  if (key == 'today') {
    return capitalize(
      new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(
        0,
        'day'
      )
    );
  }
  if (key == 'yesterday') {
    return capitalize(
      new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(
        -1,
        'day'
      )
    );
  }
  const date = new Date(timestamp * 1000);
  if (key.startsWith('week')) {
    return capitalize(
      new Intl.DateTimeFormat(language, { weekday: 'long' }).format(date)
    );
  } else if (key.startsWith('month')) {
    return capitalize(
      new Intl.DateTimeFormat(language, {
        day: 'numeric',
        month: 'long',
      }).format(date)
    );
  } else if (date.getFullYear() < new Date().getFullYear()) {
    return capitalize(
      new Intl.DateTimeFormat(language, {
        month: 'long',
        year: 'numeric',
      }).format(date)
    );
  } else {
    return capitalize(
      new Intl.DateTimeFormat(language, {
        month: 'long',
      }).format(date)
    );
  }
};

const getEventGroup = (
  timestamp: number,
  today: Date,
  yesterday: Date
): string => {
  const date = new Date(timestamp * 1000);

  if (today.toDateString() === date.toDateString()) {
    return 'today';
  }
  if (
    yesterday.toDateString() === date.toDateString() &&
    today.getMonth() === date.getMonth()
  ) {
    return 'yesterday';
  }
  if (
    today.getMonth() === date.getMonth() &&
    today.getFullYear() === date.getFullYear()
  ) {
    return `month-${date.getDay()}`;
  }

  return `year-${date.getFullYear()}-${date.getMonth() + 1}`;
};

export interface ActivityItem {
  timestamp: number;
  event: AccountEvent;
}

export type ActivityGroup = [string, ActivityItem[]];

export const groupActivityItems = (
  data: InfiniteData<AccountEvents200Response>
) => {
  const list = [] as ActivityItem[];

  data.pages.forEach((page) => {
    page.events.forEach((event) => {
      list.push({
        timestamp: event.timestamp,
        event,
      });
    });
  });

  return list;
};
export const groupAndFilterJettonActivityItems = (
  data: InfiniteData<AccountEvents200Response>,
  walletAddress: string
) => {
  const list = [] as ActivityItem[];

  data.pages.forEach((page) => {
    page.events.forEach((event) => {
      if (walletAddress) {
        event.actions = event.actions.filter((action) => {
          if (action.tonTransfer) {
            return (
              action.tonTransfer.sender.address === walletAddress ||
              action.tonTransfer.recipient.address === walletAddress
            );
          } else if (action.contractDeploy) {
            return action.contractDeploy.deployer.address === walletAddress;
          }
          return true;
        });
      }
      list.push({
        timestamp: event.timestamp,
        event,
      });
    });
  });
  return list;
};

const seeIfTonTransfer = (action: Action) => {
  if (action.type == 'TonTransfer') {
    return true;
  } else if (action.type == 'ContractDeploy') {
    if (action.contractDeploy?.interfaces?.includes('wallet')) {
      return true;
    }
  }
  return false;
};

export const groupAndFilterTonActivityItems = (
  data: InfiniteData<AccountEvents200Response>
) => {
  const list = [] as ActivityItem[];

  data.pages.forEach((page) => {
    page.events.forEach((event) => {
      const tonTransferEvent = event.actions.every(seeIfTonTransfer);
      if (tonTransferEvent) {
        list.push({
          timestamp: event.timestamp,
          event,
        });
      }
    });
  });
  return list;
};

export const groupActivity = (list: ActivityItem[]) => {
  list.sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1));

  const todayDate = new Date();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  const { today, yesterday, month, ...rest } = list.reduce((acc, item) => {
    const group = getEventGroup(item.timestamp, todayDate, yesterdayDate);
    if (acc[group]) {
      acc[group].push(item);
    } else {
      acc[group] = [item];
    }
    return acc;
  }, {} as Record<string, ActivityItem[]>);

  const result = [] as [] as ActivityGroup[];
  if (today) {
    result.push(['today', today]);
  }
  if (yesterday) {
    result.push(['yesterday', yesterday]);
  }

  Object.entries(rest)
    .filter(([key]) => key.startsWith('week'))
    .forEach((value) => result.push(value));

  Object.entries(rest)
    .filter(([key]) => key.startsWith('month'))
    .forEach((value) => result.push(value));

  Object.entries(rest)
    .filter(([key]) => key.startsWith('year'))
    .forEach((value) => result.push(value));

  return result;
};
