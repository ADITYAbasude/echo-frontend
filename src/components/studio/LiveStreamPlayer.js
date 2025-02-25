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
  poster
}) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [bufferHealth, setBufferHealth] = useState(0);
  const [errorState, setErrorState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false); 
  const [autoplayBlocked, setAutoplayBlocked] = useState(false); 
  const controlsTimeoutRef = useRef(null);
  const [initializing, setInitializing] = useState(false);

  // Modified initializePlayer function to avoid unnecessary disposal
  const initializePlayer = useCallback(() => {
    if (!videoRef.current || !mounted) return;
    if (initializing) return; // Prevent multiple simultaneous initializations
    
    setInitializing(true);
    
    // Use stream key from props
    const hlsServer = process.env.REACT_APP_HLS_SERVER || 'localhost:8000';
    const streamKey = stream?.url ? new URL(stream.url).pathname.split('/').pop().replace('.m3u8', '') : '';
    const hlsUrl = stream?.url || `http://${hlsServer}/hls/${streamKey}.m3u8`;

    // Skip source availability check since it can cause issues
    // Setup player directly
    const videoJsOptions = {
      autoplay: true,
      muted: true,
      controls: true,
      responsive: true,
      fluid: true,
      liveui: true,
      playbackRates: [1],
      poster: poster, // Add poster image
      html5: {
        vhs: {
          overrideNative: !videojs.browser.IS_SAFARI,
          enableLowInitialPlaylist: true,
          handleManifestRedirects: true,
          withCredentials: false,
          useBandwidthFromLocalStorage: true,
          experimentalBufferBasedABR: true,
          allowSeeksWithinUnsafeLiveWindow: true,
          experimentalLLHLS: true,
          liveBackBufferLength: 30,
          maxMaxBufferLength: 30,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 6,
          // Add error recovery options
          handlePartialData: true,
          smoothQualityChange: true,
          blacklistDuration: 30,
          bandwidth: 5000000 // Start with higher bandwidth
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
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error('Error while disposing player:', e);
        }
        playerRef.current = null;
      }

      // Create new player
      const player = videojs(videoRef.current, videoJsOptions, function() {
        // Player is ready
      });
      
      // Store player reference immediately
      playerRef.current = player;

      // Setup error handling
      player.on('error', function(e) {
        console.error('Player Error:', player.error());
        const error = player.error();
        
        // Handle recoverable errors - retry for source not supported
        if (error && error.code === 4) {
          setTimeout(() => {
            player.src(videoJsOptions.sources[0]);
            player.load();
            player.play().catch(console.error);
          }, 2000);
          return;
        }
        
        // Generate user-friendly error message
        const errorMessage = getErrorMessage(error?.code);
        
        setErrorState({ code: error?.code, message: errorMessage });
        setIsLoading(false);
        onError?.(error);
      });
      
      // Helper function to get user-friendly error messages
      function getErrorMessage(errorCode) {
        switch (errorCode) {
          case 1: return "The stream was aborted";
          case 2: return "Network error while loading stream";
          case 3: return "Unable to decode the stream";
          case 4: return "Stream not supported or not available";
          default: return "An error occurred during playback";
        }
      }

      // Handle loading states
      player.on('loadstart', () => {
        setIsLoading(true);
        setErrorState(null);
      });

      // Monitor autoplay success/failure
      player.on('play', () => {
        if (player.muted()) {
          setIsMuted(true);
          setAutoplayBlocked(true);
        } else {
          setIsMuted(false);
          setAutoplayBlocked(false);
        }
      });

      // Try to autoplay with unmuted first
      player.ready(() => {
        // Force show poster until playback actually begins
        if (poster) {
          player.poster(poster);
          player.addClass('vjs-poster-waiting');
        }

        player.play()
          .then(() => {
            // Play succeeded
          })
          .catch((err) => {
            // If it fails, mute the player and try again
            if (player && !player.isDisposed()) {
              player.muted(true);
              setIsMuted(true);
              setAutoplayBlocked(true);
              player.play().catch((err) => {
                console.error('Muted autoplay also failed:', err);
                setErrorState({ message: "Unable to play stream automatically. Please click to play." });
              });
            }
          });
        
        onReady?.(player);
      });

      const monitorBuffer = () => {
        if (!player || !player.buffered() || player.buffered().length === 0) {
          return;
        }
        
        const duration = player.duration();
        const bufferedEnd = player.bufferedEnd();
        
        if (duration > 0) {
          const bufferPercentage = (bufferedEnd / duration) * 100;
          setBufferHealth(bufferPercentage);
        }
      };

      player.on('waiting', () => {
        setIsLoading(true);
      });

      player.on('playing', () => {
        player.removeClass('vjs-poster-waiting');
        setIsLoading(false);
        setErrorState(null);
        onStreamStatusChange?.('live');
      });

      // Add stalled event handler
      player.on('stalled', () => {
        // Don't immediately reset - let the browser handle it first
        setTimeout(() => {
          if (player.paused()) {
            player.play().catch(console.error);
          }
        }, 5000);
      });

      player.on('timeupdate', () => {
        monitorBuffer();
      });

      // Add quality monitoring
      player.on('qualitychange', () => {
        // Quality monitoring without console logs
      });

      // Add more resilient error handling
      let retryCount = 0;
      const maxRetries = 3;

      player.on('error', () => {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            player.src(videoJsOptions.sources[0]);
            player.load();
            player.play().catch(console.error);
          }, 2000 * retryCount); // Exponential backoff
        }
      });

      // Clean up on disposal
      player.on('dispose', () => {
        setErrorState(null);
        setIsLoading(false);
      });
      
      // Initialize the stream
      player.src(videoJsOptions.sources[0]);
      
    } catch (error) {
      console.error('Error initializing video player:', error);
      setErrorState(error);
      setIsLoading(false);
      onError?.(error);
    } finally {
      setInitializing(false);
    }
  }, [onError, onReady, onStreamStatusChange, mounted, stream, poster]);

  useEffect(() => {
    setMounted(true);
    return () => {
      // Cleanup only on component unmount
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error('Error during cleanup disposal:', e);
        }
        playerRef.current = null;
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Replace the problematic useEffect with a more targeted one
  useEffect(() => {
    if (!mounted) return;
    
    // Add a small delay to ensure DOM is ready
    const initTimer = setTimeout(() => {
      initializePlayer();
    }, 100);
    
    return () => clearTimeout(initTimer);
  }, [mounted]); // Remove initializePlayer dependency

  const handleMouseMove = () => {
    // Show controls when mouse moves
    if (videoRef.current) {
      videoRef.current.classList.add('vjs-user-active');
      videoRef.current.classList.remove('vjs-user-inactive');
    }
    
    // Clear previous timeout
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    // Set new timeout
    controlsTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.classList.remove('vjs-user-active');
        videoRef.current.classList.add('vjs-user-inactive');
      }
    }, 3000);
  };
  
  // Update handleRetry function for better recovery
  const handleRetry = () => {
    setIsLoading(true);
    setErrorState(null);
    
    // Set short timeout before reinitializing
    setTimeout(() => {
      initializePlayer();
    }, 1000);
    
    onRetry?.();
  };

  // Fix the handleUnmute function that's causing errors
  const handleUnmute = () => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    
    // First check if player hasn't been disposed
    if (player.isDisposed && player.isDisposed()) {
      return;
    }
    
    try {
      // Use a more resilient approach
      if (typeof player.muted === 'function') {
        player.muted(false);
        player.volume(1.0); // Ensure volume is up
        setIsMuted(false);
        setAutoplayBlocked(false);
      }
    } catch (error) {
      console.error('Error unmuting player:', error);
      // Don't retry immediately to avoid loops
    }
  };

  // if (!mounted) return null;

  return (
    <div className="bg-[var(--card-background)] rounded-lg overflow-hidden shadow-lg">
      <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
      
      <div className="relative aspect-video bg-black" onMouseMove={handleMouseMove}>
        <div data-vjs-player>
          <video
            ref={videoRef}
            className="video-js video-stream-player vjs-default-skin vjs-big-play-centered"
            crossOrigin="anonymous"
            poster={poster}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && !errorState && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Unmute prompt */}
        {autoplayBlocked && isMuted && !errorState && !isLoading && (
          <div className="absolute top-4 left-4 bg-black/70 rounded-md p-2 flex items-center cursor-pointer" onClick={handleUnmute}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mr-2">
              <path d="M11 5 6 9H2v6h4l5 4V5Z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
            <span className="text-white text-sm">Click to unmute</span>
          </div>
        )}

        {/* Error display */}
        {errorState && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
            <AlertCircle className="h-12 w-12 text-red-500 mb-2" />
            <p className="text-white text-center mb-4">
              {errorState.message || "Stream playback error"}
            </p>
            <button
              onClick={handleRetry}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Retry
            </button>
          </div>
        )}

        {/* Buffer health and stats */}
        {showStats && (
          <div className="absolute bottom-16 left-4 bg-black/70 p-2 rounded text-xs text-white">
            <div className="flex items-center mb-1">
              <Radio className="h-3 w-3 text-red-500 mr-1 animate-pulse" />
              <span>Live</span>
            </div>
            <div>
              Buffer: {bufferHealth.toFixed(0)}%
              <div className="w-24 h-1 bg-gray-700 mt-1">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(bufferHealth, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LiveStreamPlayer.displayName = 'LiveStreamPlayer';

export default LiveStreamPlayer;
