import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { Helmet } from "react-helmet-async"; // Add this import
import VideoPlayer from "../../components/common/VideoPlayer";
import { Share } from "lucide-react";
import { useParams } from "react-router";
import { gql, useMutation, useQuery } from "@apollo/client";
import { CircularLoader, UploaderUser, Button } from "../../components";
import { useVideoPlayer } from "../../hooks/useVideoPlayer";
import { Link } from "react-router-dom";
import { Avatar, AvatarImage } from "../../components";
import useAuthToken from "../../hooks/useAuthToken";

const GET_VIDEO_BY_ID = gql`
  query getVideoById($videoID: ID!) {
    getVideoByID(videoID: $videoID) {
      _id
      videoKey
      metaData {
        title
        posterUrl
        available_formats
        description
        viewCount
        duration
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
        aboutBroadcast
      }
      collaboration {
        requestAccepted
        broadcast {
          broadcastImg
          broadcastName
        }
      }
      userSettings{
        autoPlay
        enableHotkeys
        defaultVolume
        defaultPlaybackSpeed
      }
    }
  }
`;

// Update the query to include segments
const GET_VIDEO_SIGNED_URL = gql`
  query GetVideoSignedUrl($videoID: ID!) {
    getVideoSignedUrl(videoID: $videoID) {
      resolutions
      initialResolution
      success
    }
  }
`;

const UPDATE_VIDEO_VIEWS = gql`
  mutation updateViewsOfVideo($videoID: ID!) {
    updateViewsOfVideo(videoID: $videoID) {
      success
    }
  }
`;

const VideoPage = () => {
  const playerRef = useRef(null);
  const { contentID } = useParams();
  const { updatePlayerState } = useVideoPlayer();
  const token = useAuthToken();

  const { data: videoData, loading: fetchingVideo } = useQuery(
    GET_VIDEO_BY_ID,
    {
      variables: {
        videoID: contentID,
      },
      skip: !contentID,
      fetchPolicy: "network-only",
    }
  );

  const { data: videoSignedUrl, refetch: refetchSignedUrl } = useQuery(
    GET_VIDEO_SIGNED_URL,
    {
      variables: {
        videoID: contentID,
      },
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      },
      skip: !contentID || !token,
      fetchPolicy: "network-only",
    }
  );

  useEffect(() => {
    if (token && contentID) {
      refetchSignedUrl();
    }
  }, [token, contentID, refetchSignedUrl]);

  const [updateVideoViews] = useMutation(UPDATE_VIDEO_VIEWS);

  const videoJsOptions = useMemo(
    () => ({
      controls: true,
      responsive: true,
      fluid: true,
      sources: [
        {
          src: videoSignedUrl?.getVideoSignedUrl?.resolutions?.[videoSignedUrl?.getVideoSignedUrl?.initialResolution] || "",
          type: "application/x-mpegURL",
        },
      ],
      poster: videoData?.getVideoByID?.metaData?.posterUrl,
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
      signedUrls: videoSignedUrl?.getVideoSignedUrl?.resolutions?.[videoSignedUrl?.getVideoSignedUrl?.initialResolution] || null,
      videoID: contentID,
      available_formats:
        videoData?.getVideoByID?.metaData?.available_formats || [],
      resolutions: videoSignedUrl?.getVideoSignedUrl?.resolutions || {},
      initialResolution: videoSignedUrl?.getVideoSignedUrl?.resolutions?.[videoSignedUrl?.getVideoSignedUrl?.initialResolution],
    }),
    [videoSignedUrl, videoData, contentID]
  );

  const handlePlayerReady = useCallback(
    (player) => {
      if (!player) return;

      playerRef.current = player;
      updatePlayerState(player);
    },
    [updatePlayerState]
  );

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
        } catch (e) {
          console.error("Error disposing player:", e);
        }
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (videoData?.getVideoByID?._id) {
      updateVideoViews({
        variables: {
          videoID: videoData.getVideoByID._id,
        },
      });
    }
  }, [videoData, updateVideoViews]);

  const handleShareButton = () => {
    if (navigator.share) {
      navigator.share({
        title: videoData?.getVideoByID?.metaData.title,
        text: videoData?.getVideoByID?.metaData.description,
        url: window.location.href,
      });
    }
  };

  const generateSchemaMarkup = useMemo(() => {
    if (!videoData?.getVideoByID) return null;

    const video = videoData.getVideoByID;
    return {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: video.metaData.title,
      description: video.metaData.description,
      thumbnailUrl: video.metaData.posterUrl,
      uploadDate: video.metaData.uploadDate,
      duration: video.metaData.duration,
      interactionCount: video.metaData.viewCount,
      author: {
        "@type": "Person",
        name: video.videoAddBy.username,
      },
      publisher: {
        "@type": "Organization",
        name: video.broadcast.broadcastName,
        logo: {
          "@type": "ImageObject",
          url: video.broadcast.broadcastImg,
        },
      },
    };
  }, [videoData]);

  const videoTitle = videoData?.getVideoByID?.metaData?.title || "Video";
  const videoDescription =
    videoData?.getVideoByID?.metaData?.description?.slice(0, 155) ||
    "Watch video on Echo";
  const posterUrl = videoData?.getVideoByID?.metaData?.posterUrl;
  const videoUrl =
    videoSignedUrl?.getVideoSignedUrl?.resolutions?.["480p"]?.masterUrl;

  if (fetchingVideo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CircularLoader />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{videoTitle} | Echo</title>
        <meta name="description" content={videoDescription} />

        {posterUrl && (
          <>
            <meta property="og:image" content={posterUrl} />
            <meta name="twitter:image" content={posterUrl} />
          </>
        )}

        {videoTitle && (
          <>
            <meta property="og:title" content={videoTitle} />
            <meta name="twitter:title" content={videoTitle} />
          </>
        )}

        {videoDescription && (
          <>
            <meta property="og:description" content={videoDescription} />
            <meta name="twitter:description" content={videoDescription} />
          </>
        )}

        {videoUrl && <meta property="og:video" content={videoUrl} />}

        <meta property="og:type" content="video.other" />
        <meta name="twitter:card" content="player" />

        {generateSchemaMarkup && (
          <script type="application/ld+json">
            {JSON.stringify(generateSchemaMarkup)}
          </script>
        )}
      </Helmet>

      <div className="p-2 sm:p-4 md:p-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content */}
            <div className="w-full lg:w-[75%]">
              {/* Video Player Section */}
              <div className="bg-[var(--card-background)] rounded-lg border border-white/5 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                <div className="relative w-full aspect-video bg-black">
                  {fetchingVideo ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CircularLoader className="w-8 h-8 text-primary" />
                    </div>
                  ) : (
                    <VideoPlayer
                      key={contentID}
                      options={videoJsOptions}
                      onReady={handlePlayerReady}
                      settings={videoData?.getVideoByID?.userSettings}
                    />
                  )}
                </div>
              </div>

              {/* Video Details Section */}
              <div className="mt-6 space-y-4">
                <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
                  <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-medium text-white/90 line-clamp-2">
                          {videoData?.getVideoByID?.metaData.title}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs">
                            {videoData?.getVideoByID?.metaData.viewCount} views
                          </div>
                          <UploaderUser
                            user={videoData?.getVideoByID?.videoAddBy}
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleShareButton}
                        className="shrink-0 flex items-center gap-2 px-4 hover:bg-primary/10 bg-transparent 
                          border border-white/10 text-white/80"
                      >
                        <Share className="w-4 h-4" />
                        <span className="text-sm">Share</span>
                      </Button>
                    </div>

                    {videoData?.getVideoByID?.metaData.description && (
                      <div className="mt-6 pt-6 border-t border-white/5">
                        <h3 className="text-sm font-medium text-white/80 mb-2">
                          Description
                        </h3>
                        <p className="text-sm text-white/60 whitespace-pre-line">
                          {videoData?.getVideoByID?.metaData.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaboration Section */}
                {videoData?.getVideoByID?.collaboration?.requestAccepted && (
                  <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
                    <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                    <div className="p-4 sm:p-6">
                      <h3 className="text-sm font-medium text-white/80 mb-4">
                        Collaborators
                      </h3>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage
                            src={
                              videoData.getVideoByID.collaboration.broadcast
                                .broadcastImg
                            }
                          />
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-white/90">
                            {
                              videoData.getVideoByID.collaboration.broadcast
                                .broadcastName
                            }
                          </p>
                          <p className="text-xs text-white/50">Collaborator</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar - Broadcast Info */}
            <div className="w-full lg:w-[25%]">
              <div className="lg:sticky lg:top-6">
                <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
                  <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                  <div className="p-4 sm:p-6 space-y-4">
                    <h2 className="text-sm font-medium text-white/90">
                      About Broadcast
                    </h2>

                    <Link
                      to={`/${videoData?.getVideoByID?.broadcast.broadcastName}`}
                      className="flex items-center gap-3 group"
                    >
                      <Avatar
                        className="w-12 h-12 rounded-sm ring-2 ring-primary/20 group-hover:ring-primary/30 
                        transition-colors"
                      >
                        <AvatarImage
                          src={videoData?.getVideoByID?.broadcast.broadcastImg}
                          className="object-cover"
                        />
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium text-white/90 group-hover:text-primary transition-colors">
                          {videoData?.getVideoByID?.broadcast.broadcastName}
                        </h3>
                        <p className="text-xs text-white/50 mt-0.5">
                          Broadcast Channel
                        </p>
                      </div>
                    </Link>

                    {videoData?.getVideoByID?.broadcast.aboutBroadcast && (
                      <p className="text-sm text-white/60 pt-4 border-t border-white/5">
                        {videoData?.getVideoByID?.broadcast.aboutBroadcast}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VideoPage;
