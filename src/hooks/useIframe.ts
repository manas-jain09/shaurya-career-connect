
import { useState, useEffect } from 'react';

export const useIframe = () => {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Check if the app is running inside an iframe
    const checkIframe = () => {
      try {
        return window.self !== window.top;
      } catch (e) {
        // If we can't access window.top due to cross-origin restrictions,
        // we're likely in an iframe
        return true;
      }
    };

    setIsInIframe(checkIframe());
  }, []);

  return { isInIframe };
};
