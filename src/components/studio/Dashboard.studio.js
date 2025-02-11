import React from "react";
import {
  Avatar,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from "..";
import { 
  AntennaIcon, 
  RadarIcon, 
  BarChart2, 
  Users, 
  Clock, 
  Activity,
  Film,
  Monitor,
  Smartphone
} from "lucide-react";
import StudioContextMenu from "../menu/Studio.context.menu";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate } from "react-router";
import Cookies from 'js-cookie';
import useAuthToken from "../../hooks/useAuthToken";
  
const LEAVE_BROADCAST = gql`
  mutation LeaveBroadcast($broadcastName: String!) {
    leaveBroadcast(broadcastName: $broadcastName) {
      message
      success
    }
  }
`;

const GET_LIVE_STREAM_STATUS = gql`
  query GetLiveStreamStatus {
    getLiveStreamStatus {
      success
      message
      isLive
      streamTitle
      viewerCount
      startedAt
      posterUrl 
      streamKey
    }
  }
`;

const GET_ANALYTICS = gql`
  query GetBroadcastAnalytics {
    getAnalyticsOfBroadcast {
      broadcastEngagement {
        views
        date
      }
      location {
        country
        views
      }
      deviceAnalytics {
        date
        desktop
        mobile
      }
      message
      status
    }
  }
`;

const DashboardStudio = () => {
  const navigate = useNavigate();
  const token = useAuthToken();
  const { broadcastName } = useParams();

  const { data: membersData } = useQuery(
    gql`
      query getBroadcastMembers($broadcastName: String!) {
        getBroadcastMembers(broadcastName: $broadcastName) {
          primaryAuthId
          role
          user {
            username
          }
        }
      }
    `,
    {
      variables: {
        broadcastName: broadcastName,
      },
      context:{
        headers:{
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`
        }
      },
      skip: !broadcastName || !token,
    }
  );

  // Add live stream status query
  const { data: streamStatus } = useQuery(GET_LIVE_STREAM_STATUS, {   
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      }
    },
    pollInterval: 5000, // Poll every 5 seconds
    skip: !broadcastName || !token,
  });

  // Add analytics query
  const { data: analyticsData } = useQuery(GET_ANALYTICS, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      }
    },
    pollInterval: 30000, // Poll every 30 seconds
    skip: !broadcastName || !token,
  });

  const [leaveBroadcast] = useMutation(LEAVE_BROADCAST);

  const handleLeaveBroadcast = async () => {
    if (!broadcastName || !token) return;
    try {
      const { data } = await leaveBroadcast({
        variables: { broadcastName },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          }
        },
      });

      if (data.leaveBroadcast.success) {
        // Remove broadcast token from cookies
        Cookies.remove('broadcastToken');
        // Navigate to home page
        navigate('/');
      }
    } catch (error) {
      console.error('Error leaving broadcast:', error);
    }
  };

  // Calculate total views and growth
  const calculateViewStats = () => {
    if (!analyticsData?.getAnalyticsOfBroadcast?.broadcastEngagement) {
      return { total: 0, growth: '0%' };
    }

    const engagement = analyticsData.getAnalyticsOfBroadcast.broadcastEngagement;
    const total = engagement.reduce((sum, item) => sum + item.views, 0);
    
    // Calculate growth (comparing last two days)
    if (engagement.length >= 2) {
      const yesterday = engagement[engagement.length - 1].views;
      const dayBefore = engagement[engagement.length - 2].views;
      const growth = dayBefore > 0 ? ((yesterday - dayBefore) / dayBefore) * 100 : 0;
      return { total, growth: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` };
    }

    return { total, growth: '+0%' };
  };

  // Calculate device stats
  const calculateDeviceStats = () => {
    if (!analyticsData?.getAnalyticsOfBroadcast?.deviceAnalytics) {
      return { desktop: 0, mobile: 0, desktopGrowth: '+0%', mobileGrowth: '+0%' };
    }

    const analytics = analyticsData.getAnalyticsOfBroadcast.deviceAnalytics;
    const latest = analytics[analytics.length - 1];
    const previous = analytics[analytics.length - 2];

    const desktopGrowth = previous ? 
      ((latest.desktop - previous.desktop) / previous.desktop) * 100 : 0;
    const mobileGrowth = previous ? 
      ((latest.mobile - previous.mobile) / previous.mobile) * 100 : 0;

    return {
      desktop: latest.desktop,
      mobile: latest.mobile,
      desktopGrowth: `${desktopGrowth >= 0 ? '+' : ''}${desktopGrowth.toFixed(1)}%`,
      mobileGrowth: `${mobileGrowth >= 0 ? '+' : ''}${mobileGrowth.toFixed(1)}%`
    };
  };

  const viewStats = calculateViewStats();
  const deviceStats = calculateDeviceStats();

  const stats = [
    { 
      label: 'Total Views', 
      value: viewStats.total.toLocaleString(), 
      icon: BarChart2, 
      change: viewStats.growth 
    },
    { 
      label: 'Desktop Viewers', 
      value: deviceStats.desktop.toLocaleString(), 
      icon: Monitor, 
      change: deviceStats.desktopGrowth 
    },
    { 
      label: 'Mobile Viewers', 
      value: deviceStats.mobile.toLocaleString(), 
      icon: Smartphone, 
      change: deviceStats.mobileGrowth 
    },
    { 
      label: 'Active Members', 
      value: membersData?.getBroadcastMembers?.length || 0, 
      icon: Users, 
      change: '+0%' 
    },
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Live Stream Status */}
      <div className="mb-6">
        <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-medium text-white/90">Live Stream</h2>
              {streamStatus?.getLiveStreamStatus?.isLive ? (
                <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Live Now
                </span>
              ) : (
                <span className="text-sm text-white/50">Offline</span>
              )}
            </div>

            {streamStatus?.getLiveStreamStatus?.isLive ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="aspect-video rounded-lg overflow-hidden bg-black/40">
                    {streamStatus.getLiveStreamStatus.posterUrl && (
                      <img 
                        src={streamStatus.getLiveStreamStatus.posterUrl} 
                        alt="Stream Preview" 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-white/90 font-medium mb-1">
                        {streamStatus.getLiveStreamStatus.streamTitle}
                      </h3>
                      <p className="text-sm text-white/50">
                        Started {new Date(streamStatus.getLiveStreamStatus.startedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                        {streamStatus.getLiveStreamStatus.viewerCount} viewers
                      </div>
                      <Button
                        onClick={() => navigate(`/studio/${broadcastName}/live`)}
                        variant="outline"
                        size="sm"
                        className="border-primary/20 hover:bg-primary/10 text-primary"
                      >
                        Manage Stream
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mb-4">
                  <Film className="w-12 h-12 text-primary/20 mx-auto" />
                </div>
                <p className="text-white/60 mb-4">No active live stream</p>
                <Button
                  onClick={() => navigate(`/studio/${broadcastName}/live`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Start Streaming
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--card-background)] rounded-lg border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-medium ${
                stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
              }`}>{stat.change}</span>
            </div>
            <h3 className="text-2xl font-semibold mt-2 text-white/90">{stat.value}</h3>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Existing content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Leave Button Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4">
            <p className="text-sm text-red-400/80 max-w-md text-center md:text-left">
              Note: If you leave as broadcaster, the role will be transferred to a co-broadcaster (if any) or the longest-serving member. Your access will be revoked.
            </p>
            <Button
              variant="destructive"
              onClick={handleLeaveBroadcast}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 whitespace-nowrap w-full md:w-auto"
            >
              Leave Broadcast
            </Button>
          </div>
          
          {/* Members Section */}
          <div className="max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-medium text-white/90">Channel Members</h2>
              <span className="text-xs sm:text-sm text-white/50">
                {membersData?.getBroadcastMembers?.length || 0} members
              </span>
            </div>

            <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 p-2 sm:p-4">
                {membersData?.getBroadcastMembers.map((member, index) => (
                  <StudioContextMenu key={index} member={member}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="relative flex flex-col items-center p-4 rounded-sm hover:bg-primary/5 
                            transition-colors group">
                            {member.role === "BROADCASTER" && (
                              <div className="absolute top-2 right-2">
                                <AntennaIcon className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            {member.role === "CO_BROADCASTER" && (
                              <div className="absolute top-2 right-2">
                                <RadarIcon className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            
                            <Avatar className="w-16 h-16 mb-3 ring-2 ring-primary/20 group-hover:ring-primary/30 
                              transition-all">
                              <AvatarFallback className="text-lg text-white/90 bg-primary/20">
                                {member.user.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <p className="text-sm text-white/90 text-center font-medium truncate w-full">
                              {member.user.username}
                            </p>
                            <span className="text-xs text-white/50 mt-1">
                              {member.role.toLowerCase()}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{member.role.toLowerCase()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </StudioContextMenu>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStudio;
