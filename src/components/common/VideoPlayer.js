import "video.js/dist/video-js.css";
import React, { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "@videojs/http-streaming";
import "@silvermine/videojs-quality-selector/dist/css/quality-selector.css";

// Register quality selector plugin
require("@silvermine/videojs-quality-selector")(videojs);

const VideoPlayer = ({ options, onReady, settings }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const setupHlsHandler = (player, signedUrls) => {
    if (!player || !signedUrls) return;

    const tech = player.tech({ IWillNotUseThisInPlugins: true });
    if (tech && tech.vhs) {
      const beforeRequestHandler = function (options) {

        if (options.uri.includes(".ts")) {
          const segmentName = options.uri.split("/").pop();
          const segment = signedUrls?.segments?.find(
            (s) => s.name === segmentName
          );
          if (segment) {
            return Object.assign({}, options, { uri: segment.url });
          }
        }
        return options;
      };

      if (tech.vhs.xhr) {
        tech.vhs.xhr.beforeRequest = beforeRequestHandler;
      }

      if (tech.vhs.playlists && tech.vhs.playlists.media) {
        const segments = tech.vhs.playlists.media().segments || [];
        segments.forEach((segment) => {
          if (!segment.uri) return;
          const matchingSegment = signedUrls?.segments?.find(
            (s) => s.name === segment.uri.split("/").pop()
          );
          if (matchingSegment) {
            segment.resolvedUri = matchingSegment.url;
          }
        });
      }
    }
  };

  useEffect(() => {
    if (!videoRef.current || !options.signedUrls) return;

    if (!playerRef.current) {
      const videoElement = videoRef.current;

      // Create sources array for different qualities
      const sources = options.resolutions
        ? Object.entries(options.resolutions).map(([quality, urls]) => ({
            src: urls.masterUrl,
            type: "application/x-mpegURL",
            label: quality,
            selected: quality === options.initialResolution,
          }))
        : [];

      // Apply user settings to options
      const videoJsOptions = {
        ...options,
        controls: true,
        fluid: true,
        responsive: true,
        sources: sources,
        autoplay: settings?.autoplay || false,
        defaultVolume: settings?.defaultVolume || 1.0,
        playbackRates: settings?.playbackRates || [0.5, 1, 1.25, 1.5, 2],
        userActions: {
          hotkeys: settings?.enableHotkeys || false
        },
        controlBar: {
          children: [
            "playToggle",
            "volumePanel",
            "progressControl",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "playbackRateMenuButton",
            // "qualitySelector",
            "fullscreenToggle",
          ],
        },
        html5: {
          vhs: {
            overrideNative: !videojs.browser.IS_SAFARI,
            enableLowInitialPlaylist: true,
            handleManifestRedirects: true,
          },
          nativeAudioTracks: videojs.browser.IS_SAFARI,
          nativeVideoTracks: videojs.browser.IS_SAFARI,
        },
      };

      // Initialize player
      const player = videojs(videoElement, videoJsOptions);
      playerRef.current = player;

      player.ready(() => {
        // Add loading state handlers
        player.on("waiting", () => setIsLoading(true));
        player.on("playing", () => setIsLoading(false));
        player.on("error", () => setIsLoading(false));

        setupHlsHandler(player, options.signedUrls);

        // Setup quality selector after player is ready
        if (sources.length > 0) {
          //TODO: have to add a custom quality selector
          // Create a custom quality selector component
          // const QualitySelector = videojs.getComponent('MenuItem').extend({
          //   constructor: function(player, options) {
          //     videojs.getComponent('MenuItem').call(this, player, options);
          //     this.selected(options.selected || false);
          //     this.label = options.label;
          //   },
          //   handleClick: function() {
          //     console.log('Quality selected:', this.options_.label);
          //     player.trigger('qualitySelected', { label: this.options_.label });
          //   }
          // });
          // Register the custom component
          // videojs.registerComponent('QualitySelector', QualitySelector);
          // Create menu items for each quality
          // const qualityMenuItems = sources.map(source => {
          //   return new QualitySelector(player, {
          //     label: source.label,
          //     selected: source.selected
          //   });
          // });
          // Create menu button
          // const MenuButton = videojs.getComponent('MenuButton').extend({
          //   constructor: function(player, options) {
          //     videojs.getComponent('MenuButton').call(this, player, options);
          //     this.controlText('Quality');
          //   },
          //   createItems: function() {
          //     return qualityMenuItems;
          //   }
          // });
          // Register the menu button component
          // videojs.registerComponent('QualityMenuButton', MenuButton);
          // // Add the quality menu button to the control bar
          // const qualityButton = player.controlBar.addChild('QualityMenuButton', {});
          // // Position it before fullscreen button
          // const fullscreenButton = player.controlBar.getChild('fullscreenToggle');
          // if (fullscreenButton) {
          //   player.controlBar.el().insertBefore(
          //     qualityButton.el(),
          //     fullscreenButton.el()
          //   );
          // }
        }

        // Handle quality selection
        player.on("qualitySelected", function (event, newQuality) {
          const selectedSource = sources.find(
            (source) => source.label === newQuality.label
          );
          if (!selectedSource) return;

          const currentTime = player.currentTime();
          const isPlaying = !player.paused();

          player.src({
            src: selectedSource.src,
            type: selectedSource.type,
          });

          setupHlsHandler(player, options.signedUrls);

          player.one("loadedmetadata", () => {
            player.currentTime(currentTime);
            if (isPlaying) {
              player.play().catch(console.error);
            }
          });
        });

        // Set default playback speed if provided
        if (settings?.defaultPlaybackSpeed) {
          player.playbackRate(settings.defaultPlaybackSpeed);
        }

        // Set default volume if provided
        if (settings?.defaultVolume) {
          player.volume(settings.defaultVolume);
        }

        if (onReady) {
          onReady(player);
        }
      });
    }
  }, [options.signedUrls, onReady, options, settings]);

  return (
    <div data-vjs-player>
      <video
        ref={videoRef}
        className="video-js vjs-default-skin vjs-big-play-centered"
      />
      {isLoading && (
        <div className="vjs-loading-spinner" role="status">
          <span className="vjs-control-text">Video Player is loading...</span>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
