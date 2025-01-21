import { atom, selector } from 'recoil';

export const playerState = atom({
  key: 'playerState',
  default: {
    player: null,
  }
});

export const playerControls = selector({
  key: 'playerControls',
  get: ({get}) => {
    const state = get(playerState);
    return {
      play: () => state.instance?.play(),
      pause: () => state.instance?.pause(),
      seek: (time) => state.instance?.currentTime(time),
      setVolume: (vol) => state.instance?.volume(vol),
      setQuality: (quality) => state.instance?.tech().hls.representations().forEach(rep => {
        rep.enabled(rep.height === parseInt(quality))
      })
    };
  }
});

export const playerStateSelector = selector({
  key: 'playerStateSelector',
  get: ({get}) => get(playerState),
  set: ({set}, newValue) => {
    set(playerState, prev => ({...prev, ...newValue}));
  }
});
