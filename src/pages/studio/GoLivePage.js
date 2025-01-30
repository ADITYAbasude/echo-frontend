import React, { useState, useEffect, useCallback, useRef } from "react";
import { gql, useQuery, useMutation, useSubscription } from "@apollo/client";
import { useParams } from "react-router-dom";
import {
  Rocket,
  Eye,
  Clock,
  Copy,
  Check,
  AlertCircle,
  Radio,
  Settings,
  Users,
  MessageCircle,
  Share2,
  Settings2,
  Shield,
  UserPlus,
  Mic,
  MicOff,
  Video,
  VideoOff,
  XIcon,
  Layout
} from "lucide-react";
import { Button, CircularLoader, LiveChat, StreamSettings, LiveStreamPlayer } from "../../components";
import useAuthToken from "../../hooks/useAuthToken";
import Cookies from "js-cookie";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import { useVideoPlayer } from "../../hooks/useVideoPlayer";


const GoLivePage = () => {
  const token = useAuthToken();
  const { broadcastName } = useParams();
  const [, setToastVisibility] = useRecoilState(setVisible);
  const [copied, setCopied] = useState(false);
  const [streamKey, setStreamKey] = useState('123456');
  const [streamHealth, setStreamHealth] = useState("offline"); // offline, good, poor
  const [streamStats, setStreamStats] = useState({
    viewerCount: 0,
    duration: 0,
    isLive: false,
  });
  const [chatOpen, setChatOpen] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [moderationEnabled, setModerationEnabled] = useState(true);
  const [streamSettings, setStreamSettings] = useState({
    quality: "1080p60",
    mode: "ultra-low-latency"
  });
  const [showSettings, setShowSettings] = useState(false);
  const [streamQuality, setStreamQuality] = useState("auto");
  const [analyticsData, setAnalyticsData] = useState({
    avgBitrate: 0,
    droppedFrames: 0,
    fps: 0,
    bandwidth: 0
  });
  const playerRef = useRef(null);
  const [showControls, setShowControls] = useState(false);

    const { updatePlayerState } = useVideoPlayer();

   const handlePlayerReady = useCallback(
      (player) => {
        if (!player) return;
  
        // playerRef.current = player;
        updatePlayerState(player);
      },
      [updatePlayerState]
    );

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setToastVisibility({
        message: "Stream key copied to clipboard",
        type: "success",
        visible: true,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToastVisibility({
        message: "Failed to copy stream key",
        type: "error",
        visible: true,
      });
    }
  };

  const getHealthColor = () => {
    switch (streamHealth) {
      case "good":
        return "text-green-500";
      case "poor":
        return "text-yellow-500";
      default:
        return "text-red-500";
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleStreamEnd = async () => {
    try {
      // const { data } = await endStream({
      //   context: {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       token: `Bearer ${Cookies.get("broadcastToken")}`,
      //     },
      //   },
      // });

      // if (data?.endStream?.success) {
      //   setToastVisibility({
      //     message: "Stream ended successfully",
      //     type: "success",
      //     visible: true,
      //   });
      // }
    } catch (error) {
      setToastVisibility({
        message: "Failed to end stream",
        type: "error",
        visible: true,
      });
    }
  };

  const handleSettingsUpdate = async (settings) => {
    try {
      setStreamSettings(settings);
      // await updateSettings({
      //   variables: { input: settings },
      //   context: {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //       token: `Bearer ${Cookies.get("broadcastToken")}`,
      //     },
      //   },
      // });
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleModeratorAdd = async (userId) => {
    // Implementation for adding moderator
  };

  const handleUserBan = async (userId) => {
    // Implementation for banning user
  };

  const qualityOptions = {
    "1080p60": { label: "1080p 60fps", bitrate: "6000kbps" },
    "720p60": { label: "720p 60fps", bitrate: "4500kbps" },
    "720p": { label: "720p 30fps", bitrate: "2500kbps" },
    "480p": { label: "480p 30fps", bitrate: "1500kbps" }
  };

  const getStreamUrl = (streamKey, quality) => {
    // Remove quality suffix for main stream
    const baseUrl = `http://localhost:8000/hls/${streamKey}`;
    if (!quality) return `${baseUrl}.m3u8`;
    
    // Add quality suffix for transcoded streams
    return `${baseUrl}_${quality}.m3u8`;
  };

  const videoPlayerOptions = {
    sources: [{
      src: getStreamUrl(streamKey, streamSettings.quality),
      type: 'application/x-mpegURL'
    }],
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: true,
    controlBar: {
      children: [
        'playToggle',
        'volumePanel',
        'currentTimeDisplay',
        'timeDivider',
        'durationDisplay',
        'progressControl',
        'liveDisplay',
        'customControlSpacer',
        'playbackRateMenuButton',
        'fullscreenToggle',
        {
          name: 'ResolutionMenuButton',
          template: `
            <button class="vjs-resolution-button vjs-menu-button vjs-menu-button-popup vjs-control vjs-button">
              <span class="vjs-resolution-value"></span>
            </button>
          `
        }
      ],
      volumePanel: {
        inline: false
      }
    },
    liveui: true,
    liveTracker: true,
    plugins: {
      streamQuality: {
        defaultQuality: streamQuality,
        onQualityChange: (quality) => setStreamQuality(quality)
      },
      analytics: {
        onStatsUpdate: (stats) => setAnalyticsData(stats)
      }
    }
  };

  // Add cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup player on page unmount
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  // if (loadingStreamKey) {
  //   return (
  //     <div className="flex items-center justify-center h-[50vh]">
  //       <CircularLoader />
  //     </div>
  //   );
  // }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Stream Preview */}
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5 
            overflow-hidden shadow-lg">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            
            <div className="relative w-full min-h-[400px] lg:min-h-[600px] bg-black">
              <LiveStreamPlayer
                key={streamKey}  // Force re-render when stream key changes
                ref={playerRef}
                streams={[
                  { 
                    id: 'main', 
                    broadcasterName: broadcastName,
                    url: getStreamUrl(streamKey) // Use base stream URL
                  }
                ]}
                isMainBroadcaster={true}
                onReady={(player) => {
                  console.log('Player ready');
                  handlePlayerReady(player);
                }}
                onError={(error) => console.error('Stream error:', error)}
                showControls={true}
              />

              {/* Stream Status Overlay */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white/90">
                {streamStats.isLive ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    LIVE
                  </span>
                ) : 'OFFLINE'}
              </div>

              {/* Viewer Count */}
              {streamStats.isLive && (
                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-medium bg-black/60 text-white/90">
                  {streamStats.viewerCount} viewers
                </div>
              )}
            </div>
          </div>

          {/* Stream Setup Card */}
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Stream URL</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value="rtmp://localhost:1935/live"
                      readOnly
                      className="flex-1 bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90 text-sm"
                    />
                    <Button onClick={() => copyToClipboard("rtmp://localhost:1935/live")}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-white/60">
                    Recommended bitrate: {qualityOptions[streamSettings.quality]?.bitrate}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Stream Key</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value="123456"
                      readOnly
                      className="flex-1 bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90 text-sm"
                    />
                    <Button onClick={() => copyToClipboard("123456")}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-1">
          <LiveChat
            subscription={null}
            sendMessage={null}
            broadcasterId={broadcastName}
            isMainBroadcaster={true}
            onModeratorAdd={handleModeratorAdd}
            onUserBan={handleUserBan}
          />
        </div>
      </div>
    </div>
  );
};

export default GoLivePage;
