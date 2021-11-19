import { useContext } from 'react';
import AppContext from '../common/app-context';

const useGlobals = () => {
  const { client, platforms, eventTypes, messageTypes, activeChatbots } = useContext(AppContext);

  return { client, platforms, eventTypes, messageTypes, activeChatbots };
};

export default useGlobals;