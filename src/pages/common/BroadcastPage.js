import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Button, VideoCard } from "../../components/index";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useParams } from "react-router";
import useAuthToken from "../../hooks/useAuthToken";
import { useAuth0 } from "@auth0/auth0-react";
import Cookies from "js-cookie";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import { Filter, SortDesc, Search, Clock, ChevronDown } from "lucide-react";

const GET_SINGLE_BROADCAST_DETAILS = gql`
  query GetSingleBroadcaster($broadcastName: String!) {
    getSingleBroadcaster(broadcastName: $broadcastName) {
      _id
      aboutBroadcast
      broadcastImg
      broadcastName
      createdAt
      primaryAuthId
      videos {
        _id
        videoKey
        createdAt
        metaData {
          title
          posterUrl
          duration
          viewCount
        }
        primaryAuthId
        videoAddBy {
          username
          profilePictureURL
          primaryAuthId
          email
          _id
        }
        broadcast {
          broadcastName
          broadcastImg
        }
        collaboration {
          requestAccepted
          broadcast {
            broadcastImg
            broadcastName
          }
        }
      }
      isJoined
    }
  }
`;

const JOIN_BROADCAST = gql`
  mutation JoinBroadcast($broadcastName: String!) {
    joinBroadcast(broadcastName: $broadcastName) {
      message
      success
    }
  }
`;

const BroadcastPage = () => {
  const { broadcastName } = useParams();
  const token = useAuthToken();
  const { isAuthenticated } = useAuth0();

  const [, setToastVisibility] = useRecoilState(setVisible);

  const [joinBroadcast] = useMutation(JOIN_BROADCAST);

  const {
    data: broadcastData,
    loading: broadcastLoading,
    refetch: refetchBroadcastDetails,
  } = useQuery(GET_SINGLE_BROADCAST_DETAILS, {
    variables: {
      broadcastName,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      },
    },
    skip: !broadcastName && token !== null,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (token) refetchBroadcastDetails();
  }, [token, refetchBroadcastDetails]);

  const handleJoinBroadcast = async () => {
    if (!token) return;

    try {
      const { data } = await joinBroadcast({
        variables: {
          broadcastName,
        },
        skip:
          !isAuthenticated ||
          broadcastData?.getSingleBroadcaster?.isJoined ||
          !token ||
          !broadcastName,
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });
      setToastVisibility({
        message: data.joinBroadcast.message,
        visible: true,
        type: "success",
      });

      if (data.joinBroadcast.success) {
        Cookies.set("broadcastToken", data?.joinBroadcast?.message, {
          expires: 360 * 360 * 10,
        });
        setToastVisibility({
          message: "Broadcast joined successfully",
          visible: true,
          type: "success",
        });
      }

      refetchBroadcastDetails({
        variables: {
          broadcastName,
        },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          },
        },
        skip: !broadcastName && token !== null,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const [filters, setFilters] = useState({
    creator: '',
    dateRange: 'all',
    sortBy: 'newest'
  });

  const filterOptions = {
    dateRange: [
      { value: 'all', label: 'All Time' },
      { value: 'week', label: 'This Week' },
      { value: 'month', label: 'This Month' },
      { value: 'year', label: 'This Year' }
    ],
    sortBy: [
      { value: 'newest', label: 'Newest First' },
      { value: 'oldest', label: 'Oldest First' },
      { value: 'views', label: 'Most Viewed' }
    ]
  };

  const broadcast = broadcastData?.getSingleBroadcaster;

  const filteredVideos = React.useMemo(() => {
    if (!broadcast?.videos) return [];
    
    return broadcast.videos.filter(video => {
      const creatorMatch = !filters.creator || 
        video.videoAddBy.username.toLowerCase().includes(filters.creator.toLowerCase());
      
      const date = new Date(video.createdAt);
      const now = new Date();
      let dateMatch = true;

      switch (filters.dateRange) {
        case 'week':
          dateMatch = date >= new Date(now - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          dateMatch = date >= new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          dateMatch = date >= new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          dateMatch = true;
      }

      return creatorMatch && dateMatch;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'views':
          return (b.metaData.viewCount || 0) - (a.metaData.viewCount || 0);
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }, [broadcast?.videos, filters]);

  if (broadcastLoading)
    return (
      <>
        <Helmet>
          <title>{"Loading Broadcast | Echo"}</title>
        </Helmet>
        <div className="min-h-screen p-2 sm:p-4 md:p-6">
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5 mb-6 animate-pulse">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="relative p-8 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl bg-white/5"></div>
              <div className="space-y-3 w-full max-w-md">
                <div className="h-8 bg-white/5 rounded-sm w-3/4 mx-auto"></div>
                <div className="h-4 bg-white/5 rounded-sm w-full"></div>
                <div className="h-4 bg-white/5 rounded-sm w-5/6 mx-auto"></div>
                <div className="h-3 bg-white/5 rounded-sm w-24 mx-auto"></div>
              </div>
              <div className="w-32 h-9 bg-white/5 rounded-sm"></div>
            </div>
          </div>

          <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="h-6 bg-white/5 rounded-sm w-24"></div>
                <div className="h-4 bg-white/5 rounded-sm w-16"></div>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-white/5 rounded-sm animate-pulse"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );

  const pageTitle = broadcast?.broadcastName
    ? `${broadcast.broadcastName} | Echo`
    : "Broadcast | Echo";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={broadcast?.aboutBroadcast || ""} />
        <meta property="og:title" content={pageTitle} />
        <meta
          property="og:description"
          content={broadcast?.aboutBroadcast || ""}
        />
        <meta property="og:image" content={broadcast?.broadcastImg || ""} />
      </Helmet>
      <div className="min-h-screen text-custom-foreground p-2 sm:p-4 md:p-6">
        <div className="bg-[var(--card-background)] rounded-lg border border-white/5 mb-6">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          <div className="relative p-8 flex flex-col items-center text-center space-y-4 sm:space-y-6">
            <img
              src={broadcast?.broadcastImg}
              alt={broadcast?.broadcastName}
              className="w-24 h-24 md:w-28 md:h-28 rounded-xl border-2 border-primary/20 hover:border-primary/30 
                shadow-lg object-cover transition-all hover:scale-105"
            />
            <div className="space-y-3">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white/90">
                {broadcast?.broadcastName}
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-white/70 max-w-2xl">
                {broadcast?.aboutBroadcast}
              </p>
              <p className="text-sm text-white/50">
                {broadcast?.videos?.length || 0} videos
              </p>
            </div>
            <Button
              className={`rounded-sm px-8 py-2 text-sm transition-all ${
                broadcast?.isJoined
                  ? "bg-white/5 hover:bg-white/10 text-white/80"
                  : "bg-primary hover:bg-primary/90"
              }`}
              onClick={handleJoinBroadcast}
              disabled={broadcast?.isJoined || !isAuthenticated}
            >
              {broadcast?.isJoined ? "Joined" : "Join Broadcast"}
            </Button>
          </div>
        </div>

        <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          <div className="p-4">
            {/* Improved Filter Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary" />
                  <h2 className="text-base sm:text-lg font-medium text-white/90">Filter Videos</h2>
                </div>
                <span className="text-xs sm:text-sm text-white/50">
                  Showing {filteredVideos.length} of {broadcast?.videos?.length || 0}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 
                    group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by creator..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                      text-sm focus:outline-none focus:border-primary/50 text-white/90 
                      transition-all focus:bg-white/[0.07]"
                    value={filters.creator}
                    onChange={(e) => setFilters(prev => ({ ...prev, creator: e.target.value }))}
                  />
                </div>

                {/* Improved Date Range Select */}
                <div className="relative group">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 
                    group-focus-within:text-primary transition-colors z-10" />
                  <select
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                      text-sm focus:outline-none focus:border-primary/50 text-white/90 
                      transition-all focus:bg-white/[0.07] appearance-none cursor-pointer
                      hover:border-primary/30 focus:ring-1 focus:ring-primary/20"
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  >
                    {filterOptions.dateRange.map(option => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        className="bg-[var(--card-background)] text-white/90 hover:bg-white/10"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <div className="w-px h-4 bg-white/10 mr-2"></div>
                    <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>

                {/* Improved Sort Select */}
                <div className="relative group sm:col-span-2 lg:col-span-1">
                  <SortDesc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 
                    group-focus-within:text-primary transition-colors z-10" />
                  <select
                    className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                      text-sm focus:outline-none focus:border-primary/50 text-white/90 
                      transition-all focus:bg-white/[0.07] appearance-none cursor-pointer
                      hover:border-primary/30 focus:ring-1 focus:ring-primary/20"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                  >
                    {filterOptions.sortBy.map(option => (
                      <option 
                        key={option.value} 
                        value={option.value}
                        className="bg-[var(--card-background)] text-white/90 hover:bg-white/10"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex items-center">
                    <div className="w-px h-4 bg-white/10 mr-2"></div>
                    <ChevronDown className="w-4 h-4 text-white/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredVideos.map((video) => (
                <VideoCard
                  video={video}
                  key={video.videoKey}
                  className="transform transition-all hover:scale-[1.02] hover:bg-primary/5"
                />
              ))}
              {filteredVideos.length === 0 && (
                <div className="col-span-full text-center py-8 text-white/50 text-sm">
                  No videos match your filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BroadcastPage;
