import { useRef, useCallback, useState } from 'react';

export const useVideoPlayer = () => {
  const playerRef = useRef(null);
  const [signedUrls, setSignedUrls] = useState(null);

  const updatePlayerState = useCallback((player) => {
    playerRef.current = player;
  }, []);

  const getPlayer = useCallback(() => {
    return playerRef.current;
  }, []);

  const updateSignedUrls = useCallback((urls) => {
    setSignedUrls(urls);
  }, []);

  return {
    updatePlayerState,
    getPlayer,
    signedUrls,
    setSignedUrls: updateSignedUrls
  };
};
