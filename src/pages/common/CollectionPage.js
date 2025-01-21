import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { gql, useQuery, useMutation } from "@apollo/client";
import { PlayCircle, Clock, BookMarked, History } from "lucide-react"; // Remove LoaderIcon
import useAuthToken from "../../hooks/useAuthToken";
import { Helmet } from "react-helmet-async";
import VideoCard from "../../components/common/VideoCard";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";

const GET_COLLECTION = gql`
  query GetCollection {
    getCollection {
      watchLater {
        video {
          _id
          videoKey
          createdAt
          metaData {
            title
            posterUrl
            duration
            viewCount
          }
          broadcast {
            broadcastName
            broadcastImg
          }
        }
      }
      watchHistory {
        _id
        video {
          _id
          videoKey
          createdAt
          metaData {
            title
            posterUrl
            duration
            viewCount
          }
          broadcast {
            broadcastName
            broadcastImg
          }
        }
        watchedAt
        watchDuration
      }
    }
  }
`;

const REMOVE_FROM_COLLECTION = gql`
  mutation RemoveFromCollection($videoId: ID!) {
    removeFromCollection(videoId: $videoId) {
      message
      success
    }
  }
`;

const ADD_TO_WATCH_LATER = gql`
  mutation AddToWatchLater($videoId: ID!) {
    addToWatchLater(videoId: $videoId) {
      message
      success
    }
  }
`;

const REMOVE_FROM_WATCH_LATER = gql`
  mutation RemoveFromWatchLater($videoId: ID!) {
    removeFromWatchLater(videoId: $videoId) {
      message
      success
    }
  }
`;

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <Icon className="w-12 h-12 text-white/10 mb-4" />
    <h3 className="text-base font-medium text-white/90 mb-2">{title}</h3>
    <p className="text-sm text-white/50 max-w-sm">{message}</p>
  </div>
);

const Collection = () => {
  const {
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
  } = useAuth0();
  const token = useAuthToken();
  const [, setToastVisibility] = useRecoilState(setVisible);
  // Remove Recoil state

  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      loginWithRedirect();
    }
  }, [authLoading, isAuthenticated, loginWithRedirect]);

  const { data } = useQuery(GET_COLLECTION, {
    context: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    skip: !token || !isAuthenticated,
  });

  const [removeFromCollection] = useMutation(REMOVE_FROM_COLLECTION, {
    refetchQueries: [
      {
        query: GET_COLLECTION,
        context: { headers: { Authorization: `Bearer ${token}` } },
      },
    ],
  });

  const [addToWatchLater] = useMutation(ADD_TO_WATCH_LATER, {
    refetchQueries: [
      {
        query: GET_COLLECTION,
        context: { headers: { Authorization: `Bearer ${token}` } },
      },
    ],
  });

  const [removeFromWatchLater] = useMutation(REMOVE_FROM_WATCH_LATER, {
    refetchQueries: [
      {
        query: GET_COLLECTION,
        context: { headers: { Authorization: `Bearer ${token}` } },
      },
    ],
  });

  const handleRemoveFromCollection = async (videoId, e) => {
    e.stopPropagation();
    try {
      const { data } = await removeFromCollection({
        variables: { videoId },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      if (data.removeFromCollection.success) {
        setToastVisibility({
          message: "Video removed from collection",
          type: "success",
          visible: true,
        });
      } else {
        throw new Error(data.removeFromCollection.message);
      }
    } catch (error) {
      setToastVisibility({
        message: "Failed to remove video",
        type: "error",
        visible: true,
      });
    }
  };

  const handleWatchLater = async (videoId, isInWatchLater, e) => {
    e.stopPropagation();
    try {
      const mutation = isInWatchLater ? removeFromWatchLater : addToWatchLater;
      const { data } = await mutation({
        variables: { videoId },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      });

      if (
        data?.addToWatchLater?.success ||
        data?.removeFromWatchLater?.success
      ) {
        setToastVisibility({
          message: isInWatchLater
            ? "Removed from Watch Later"
            : "Added to Watch Later",
          type: "success",
          visible: true,
        });
      }
    } catch (error) {
      setToastVisibility({
        message: "Failed to update Watch Later",
        type: "error",
        visible: true,
      });
    }
  };

  const renderVideoGrid = (videos, options = {}) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 p-2 sm:p-4">
      {videos?.map((video) => (
        <VideoCard
          key={video._id}
          video={video?.video || video}
          onRemove={options.showRemove ? handleRemoveFromCollection : undefined}
          onWatchLater={options.showWatchLater ? handleWatchLater : undefined}
          isInWatchLater={data?.getCollection?.watchLater?.some(
            (v) => v._id === video._id
          )}
          showRemove={options.showRemove}
          isCollectionCard={true}
        />
      ))}
    </div>
  );

  const renderEmptyState = (type) => {
    const states = {
      watchLater: {
        icon: Clock,
        title: "Your Watch Later is empty",
        message:
          "Save videos to watch later by clicking the clock icon on any video",
      },
      watchHistory: {
        icon: History,
        title: "No watch history yet",
        message: "Videos you watch will appear here",
      },
    };
    return <EmptyState {...states[type]} />;
  };

  return (
    <div className="px-2 py-4 sm:p-4 md:p-6 max-w-[1920px] mx-auto">
      <Helmet>
        <title>Collection | Video Library</title>
      </Helmet>

      {/* Content Sections */}
      <div className="space-y-6 sm:space-y-8">
        {/* Watch Later Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-2 sm:px-0">
            <h2 className="text-base sm:text-lg font-medium text-white/90">
              Watch Later
            </h2>
            <span className="text-xs text-white/50">
              {data?.getCollection?.watchLater?.length || 0} videos
            </span>
          </div>
          <div className="bg-[var(--card-background)] rounded-lg sm:rounded-xl border border-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            {data?.getCollection?.watchLater?.length > 0
              ? renderVideoGrid(data.getCollection.watchLater, {
                  showRemove: false,
                  showWatchLater: true,
                })
              : renderEmptyState("watchLater")}
          </div>
        </div>

        {/* Watch History Section */}
        <div className="space-y-3 sm:space-y-4"></div>
        <div className="flex items-center justify-between px-2 sm:px-0">
          <h2 className="text-base sm:text-lg font-medium text-white/90">
            Watch History
          </h2>
          <span className="text-xs text-white/50">
            {data?.getCollection?.watchHistory?.length || 0} videos
          </span>
        </div>
        <div className="bg-[var(--card-background)] rounded-lg sm:rounded-xl border border-white/5">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          {data?.getCollection?.watchHistory?.length > 0
            ? renderVideoGrid(data.getCollection.watchHistory, {
                showRemove: false,
                showWatchLater: true,
              })
            : renderEmptyState("watchHistory")}
        </div>
      </div>
    </div>
  );
};

export default Collection;
