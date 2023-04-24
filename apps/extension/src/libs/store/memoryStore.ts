import { NotificationData } from '../event';

const memoryStore = () => {
  let notifications: NotificationData[] = [];

  return {
    getNotifications: () => notifications,
    addNotification: (item: NotificationData) => notifications.push(item),
    getNotification: () =>
      notifications.length ? notifications[0] : undefined,
    removeNotification: (id: number) => {
      notifications = notifications.filter((item) => item.id !== id);
    },
  };
};

const instance = memoryStore();

export default instance;
