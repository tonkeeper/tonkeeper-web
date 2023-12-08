import { Message } from './message';

export const sendBackground = async <Result>(message: Message) => {
  const response = await window.backgroundApi.message(message);
  if (response instanceof Error) {
    throw response;
  }
  return response as Result;
};
