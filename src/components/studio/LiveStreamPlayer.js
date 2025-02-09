import React, { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/http-streaming";
import { AlertCircle, Radio, RefreshCcw } from "lucide-react";
import "../../styles/sharedVideoPlayer.css";

const LiveStreamPlayer = forwardRef(({
  stream,
  onReady,
  onError,
  onStreamStatusChange,
  showStats = false,
  onRetry,
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [volume, ] = useState(100);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const controlsTimeoutRef = useRef(null);

  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !mounted) return;

    // Use stream key from props
    const hlsServer = process.env.REACT_APP_HLS_SERVER || 'localhost:8000';
    const streamKey = stream?.url ? new URL(stream.url).pathname.split('/').pop().replace('.m3u8', '') : '';
    const hlsUrl = stream?.url || `http://${hlsServer}/hls/${streamKey}.m3u8`;

    console.log('Initializing player with HLS URL:', hlsUrl);

    const videoJsOptions = {
      autoplay: true,
      muted: true, 
      controls: false,
      responsive: true,
      fluid: true,
      liveui: true,
      playbackRates: [1],
      html5: {
        vhs: {
          overrideNative: true,
          enableLowInitialPlaylist: true,
          handleManifestRedirects: true,
          withCredentials: false,
          useBandwidthFromLocalStorage: true,
          experimentalBufferBasedABR: true,
          // Optimize for live streaming
          allowSeeksWithinUnsafeLiveWindow: true,
          experimentalLLHLS: true,
          // Buffer settings
          liveBackBufferLength: 30,
          maxMaxBufferLength: 30,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false
      },
      liveTracker: {
        trackingThreshold: 0.5,
        liveTolerance: 15
      },
      sources: [{
        src: hlsUrl,
        type: 'application/x-mpegURL'
      }]
    };

    try {
      if (playerRef.current) {
        playerRef.current.dispose();
      }

      const player = videojs(videoRef.current, videoJsOptions);
      playerRef.current = player;

      // Setup error recovery
      player.on('error', function(e) {
        console.error('Player Error:', e);
        const error = player.error();
        
        // Handle specific error types
        if (error.code === 4) {
          // Media error - try to recover
          console.log('Attempting to recover from media error...');
          player.src(videoJsOptions.sources[0]);
          player.load();
          player.play().catch(console.error);
        } else {
          setErrorState(error);
          onError?.(error);
        }
        setIsLoading(false);
      });

      // Monitor buffer health
      const monitorBuffer = () => {
        const buffered = player.buffered();
        if (buffered && buffered.length > 0) {
          const bufferEnd = buffered.end(buffered.length - 1);
          const bufferStart = buffered.start(buffered.length - 1);
          const bufferLength = bufferEnd - bufferStart;
          setBufferHealth((bufferLength / 30) * 100); // 30 seconds is max buffer
        }
      };

      player.ready(() => {
        console.log('Player is ready');
        onReady?.(player);
        setIsLoading(false);
        
        // Setup buffer monitoring
        player.on('progress', monitorBuffer);
        
        // Try to play after a short delay
        setTimeout(() => {
          player.play().catch(error => {
            console.error('Error auto-playing:', error);
          });
        }, 1000);
      });

      // Add event handlers for better state management
      player.on('waiting', () => {
        console.log('Player waiting for data...');
        setIsLoading(true);
      });

      player.on('playing', () => {
        console.log('Player started playing');
        setIsLoading(false);
        setErrorState(null);
        onStreamStatusChange?.('live');
      });

      player.on('timeupdate', () => {
        monitorBuffer();
      });

      // Clean up on disposal
      player.on('dispose', () => {
        setErrorState(null);
        setIsLoading(false);
      });

      // Start the stream
      player.src(videoJsOptions.sources[0]);

    } catch (error) {
      console.error('Error initializing video player:', error);
      setErrorState(error);
      setIsLoading(false);
      onError?.(error);
    }
  }, [onError, onReady, onStreamStatusChange, mounted, stream]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    initializePlayer();
  }, [mounted, initializePlayer]);

  const handleMouseMove = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
    }, 3000);
  };

  if (!mounted) return null;

  return (
    <div className="bg-[var(--card-background)] rounded-lg overflow-hidden shadow-lg">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
      
      <div className="relative aspect-video bg-black" onMouseMove={handleMouseMove}>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js video-stream-player vjs-default-skin vjs-big-play-centered"
          />
        </div>

        {/* Stream Info */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60">
          <Radio className="w-3 h-3 text-primary animate-pulse" />
          <span className="text-sm text-white/90 font-medium">
            {stream?.broadcasterName || 'Live Stream'}
          </span>
        </div>

        {/* Stats Overlay */}
        {showStats && (
          <div className="absolute top-4 right-4 px-3 py-2 bg-black/60 rounded-lg">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-lg font-medium text-white/90 mb-2">Stream unavailable</p>
            <p className="text-sm text-white/60 mb-4 text-center">
              The stream could not be loaded. Please try again.
            </p>
            <button 
              onClick={() => {
                setErrorState(null);
                onRetry?.();
                initializePlayer();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !errorState && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
            <div className="vjs-loading-spinner" role="status">
              <span className="vjs-control-text">Loading stream...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LiveStreamPlayer.displayName = 'LiveStreamPlayer';

export default LiveStreamPlayer;
