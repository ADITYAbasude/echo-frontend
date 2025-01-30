import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import { AlertCircle, Radio, Volume2, Volume1, VolumeX, Maximize2, Settings2, Pause, Play, RefreshCcw } from "lucide-react";
import { cn } from "../../lib/utils";
import "../../styles/sharedVideoPlayer.css";

const LiveStreamPlayer = forwardRef(({
  streams,
  isMainBroadcaster,
  onReady,
  onError,
  onStreamStatusChange,
  showStats = false,
  onRetry,
}, ref) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const controlsTimeoutRef = useRef(null);

  const initializePlayer = () => {
    if (!videoRef.current || !mounted) return;

    const stream = streams[0]; // Only use first stream
    console.log('Initializing player with stream:', stream);

    const videoJsOptions = {
      autoplay: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: true,
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          handleManifestRedirects: true,
          withCredentials: false,
          // Add low latency settings
          liveSyncDurationCount: 1, // Reduce live sync duration
          liveMaxLatencyDurationCount: 3,
          liveBackBufferLength: 0,
          maxMaxBufferLength: 2,
          useBandwidthFromLocalStorage: true,
          useDevicePixelRatio: true,
          limitRenditionByPlayerDimensions: true
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false
      },
      liveTracker: {
        trackingThreshold: 0.5, // Lower threshold for faster updates
        liveTolerance: 1 // Reduce tolerance for live playback
      },
      sources: [{
        src: stream.url,
        type: 'application/x-mpegURL'
      }],
      controlBar: {
        children: [],  // Remove default controls
      },
      className: 'video-stream-player',
      errorDisplay: false, // Disable default error display
    };

    try {
      const player = videojs(videoRef.current, videoJsOptions);
      playerRef.current = player;

      player.ready(() => onReady?.(player));
      player.on("error", (error) => {
        console.error('Player Error:', error);
        setErrorState(error);
        onError?.(error);
      });
      player.on("playing", () => onStreamStatusChange?.("live"));

      // Debug logs
      player.on('waiting', () => console.log('Player waiting'));
      player.on('playing', () => console.log('Player playing'));

      // Add custom event listeners
      player.on('volumechange', () => setVolume(player.volume() * 100));
      player.on('play', () => setIsPlaying(true));
      player.on('pause', () => setIsPlaying(false));
      player.on('fullscreenchange', () => setIsFullscreen(player.isFullscreen()));
      player.on('progress', () => {
        const buffer = player.buffered();
        if (buffer.length > 0) {
          setBufferHealth((buffer.end(0) - buffer.start(0)) * 100);
        }
      });
    } catch (error) {
      console.error('Error initializing video player:', error);
      setErrorState(error);
      onError?.(error);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    initializePlayer();
  }, [streams, mounted]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  if (!mounted) return null;

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  return (
    <div className="bg-[var(--card-background)] rounded-lg overflow-hidden shadow-lg">
      <div className="gradient-border" />
      
      <div className="relative aspect-video bg-black">
        <div className="video-container">
          <video
            ref={videoRef}
            className="video-js video-stream-player vjs-default-skin vjs-big-play-centered"
          />
        </div>

        {/* Controls Overlay */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 p-4",
          "bg-gradient-to-t from-[var(--card-background)] via-black/40 to-transparent",
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}>
          {/* Progress Bar */}
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${bufferHealth}%` }}
            />
          </div>

          <div className="flex flex-col gap-2">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${bufferHealth}%` }}
              />
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <button 
                  className="custom-control-button"
                  onClick={() => playerRef.current?.paused() ? playerRef.current?.play() : playerRef.current?.pause()}
                >
                  {isPlaying ? 
                    <Pause className="w-5 h-5 text-white/90" /> : 
                    <Play className="w-5 h-5 text-white/90" />
                  }
                </button>

                {/* Volume Control */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => playerRef.current?.muted(!playerRef.current?.muted())}
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : volume < 50 ? (
                      <Volume1 className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      setVolume(value);
                      if (playerRef.current) {
                        playerRef.current.volume(value / 100);
                      }
                    }}
                    className="w-20 accent-primary"
                  />
                </div>

                {/* Live Indicator */}
                <div className="px-2 py-1 rounded-full bg-red-500/20 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-medium text-red-500">LIVE</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Settings */}
                <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
                  <Settings2 className="w-5 h-5 text-white" />
                </button>

                {/* Fullscreen */}
                <button 
                  onClick={() => playerRef.current?.requestFullscreen()}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Maximize2 className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stream Info */}
        <div className="absolute top-4 left-4 overlay-panel px-3 py-2">
          <div className="p-1.5 rounded-full bg-primary/20">
            <Radio className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm text-white/90 font-medium">
            {streams[0]?.broadcasterName}
          </span>
        </div>

        {/* Stats Overlay */}
        {showStats && (
          <div className="absolute top-4 right-4 overlay-panel px-3 py-2">
            <div className="text-xs text-white/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/80" />
                Buffer: {bufferHealth.toFixed(1)}%
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-primary/80" />
                Volume: {volume}%
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center overlay-panel">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-white/90 mb-2">Stream unavailable</p>
            <p className="text-sm text-white/60 mb-4 text-center">
              The stream could not be loaded. Please try again.
            </p>
            <button 
              onClick={() => {
                setErrorState(null);
                onRetry?.();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

LiveStreamPlayer.displayName = 'LiveStreamPlayer';

export default LiveStreamPlayer;
