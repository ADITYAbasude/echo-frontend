import React, { useState, useEffect } from "react";
import { Button, UploaderUser } from "..";
import {
  AreaChartIcon,
  Trash2Icon,
  LoaderIcon,
  PlayIcon,
  PauseIcon,
  Film,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "..";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "..";
import { gql, useMutation, useQuery } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";

const GET_BROADCAST_CONTENT_QUERY = gql`
  query GetBroadcastVideosByToken {
    getBroadcastVideosByToken {
      _id
      broadcastID
      primaryAuthId
      broadcast {
        broadcastName
        broadcastImg
      }
      collaboration {
        broadcastID
        requestAccepted
        broadcast {
          broadcastName
          broadcastImg
        }
      }
      videoAddBy {
        username
        profilePictureURL
        primaryAuthId
      }
      createdAt
      draft
      metaData {
        viewCount
        title
        posterUrl
        description
      }
      videoKey
    }
  }
`;

const DELETE_BROADCAST_CONTENT_MUTATION = gql`
  mutation DeleteVideo($input: deleteVideoInput!) {
    deleteVideo(input: $input) {
      message
      success
    }
  }
`;

const ContentStudio = () => {
  const [contents, setContents] = useState([]);
  const [selectedContent, setSelectedContent] = useState(null);
  const [isPlaying,] = useState(false);
  const [token, setToken] = useState(null);
  const { isAuthenticated, getAccessTokenSilently, user } = useAuth0();

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE,
          },
        });
        setToken(token);
      }
    })();
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleContentSelect = (content) => {
    setSelectedContent(content);
    navigate(`/content/${content._id}`);
  };

  const [deleteContent] = useMutation(DELETE_BROADCAST_CONTENT_MUTATION);

  const handleDeleteContent = async (contentId) => {
    try {
      await deleteContent({
        variables: {
          input: {
            videoID: contentId,
            auth0ID: user.sub.split("|")[1], // This will be converted to primaryAuthId in resolver
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          },
        },
      });

      setContents((prevContents) => 
        prevContents.filter((content) => content._id !== contentId)
      );
    } catch (error) {
      console.error("Error deleting content:", error);
      // Add your error handling UI here
    }
  };

  const { loading: fetchingVideos } = useQuery(GET_BROADCAST_CONTENT_QUERY, {
    context: {
      headers: {
        authorization: `Bearer ${token}`,
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      },
    },
    fetchPolicy: "cache-and-network",
    skip: !token || !Cookies.get("broadcastToken") || !isAuthenticated,
    onCompleted: (data) => {
      setContents(data.getBroadcastVideosByToken);
    },
  });

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-[1920px] mx-auto">
      {fetchingVideos ? (
        <div className="flex items-center justify-center h-[50vh] text-white/50">
          <LoaderIcon className="animate-spin mr-2" />
          <span>Loading contents...</span>
        </div>
      ) : (
        <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          <div className="p-3 sm:p-4 border-b border-white/5">
            <h2 className="text-base sm:text-lg font-medium text-white/90">Content Library</h2>
          </div>
          <div className="divide-y divide-white/5">
            {contents?.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onSelect={handleContentSelect}
                onDelete={handleDeleteContent}
                isSelected={selectedContent?._id === content._id}
                isPlaying={isPlaying && selectedContent?._id === content._id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ContentCard = ({ content, onSelect, onDelete, isSelected, isPlaying }) => {
  const collaborators = content.collaboration ? [content.collaboration] : [];

  return (
    <div
      className={`flex flex-col sm:flex-row p-3 sm:p-4 transition-all ${
        isSelected ? "bg-primary/10" : "hover:bg-[var(--card-background)]"
      }`}
    >
      <div
        className="relative w-full sm:w-[12rem] md:w-[16rem] h-[10rem] sm:h-[9rem] group cursor-pointer overflow-hidden rounded-lg border border-white/5 hover:border-primary/20 transition-all"
        onClick={() => onSelect(content)}
      >
        {content.metaData.posterUrl ? (
          <img
            src={content.metaData.posterUrl}
            alt={content.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--card-background)] to-primary/5 flex items-center justify-center">
            <Film className="w-12 h-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {isPlaying ? 
            <PauseIcon size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/90" /> : 
            <PlayIcon size={24} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white/90" />
          }
        </div>
      </div>

      {/* Rest of the content card */}
      <div className="mt-3 sm:mt-0 sm:ml-4 flex flex-col justify-between flex-1 min-w-0">
        <div>
          <h4 className="font-medium mb-1 text-white/90 text-sm sm:text-base truncate">{content.metaData.title}</h4>
          <p className="text-xs sm:text-sm text-white/60 line-clamp-2">
            {content.metaData.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 sm:mt-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-primary/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center">
              <AreaChartIcon size={12} className="text-primary" />
              <span className="ml-1.5 text-xs text-primary">
                {content.metaData?.viewCount} views
              </span>
            </div>
            {content.collaboration.broadcastID && (
              <CollaboratorAvatars users={collaborators} content={content} />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-2 ring-primary/20 shrink-0">
                <AvatarImage
                  src={content.broadcast?.broadcastImg}
                  alt={content.videoAddBy?.broadcastName}
                />
                <AvatarFallback className="bg-primary/20 text-white/90 text-xs sm:text-sm">
                  {content?.videoAddBy?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <UploaderUser user={content?.videoAddBy} />
              </div>
            </div>
          </div>

          <Button
            size="icon"
            variant="outline"
            className="rounded-lg hover:bg-red-500/10 hover:text-red-500 border-white/5 h-8 w-8 sm:h-9 sm:w-9 transition-colors"
            onClick={() => onDelete(content._id)}
          >
            <Trash2Icon size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

const CollaboratorAvatars = ({ users, content }) => {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {[content.broadcast, content.collaboration?.broadcast].map(
        (broadcast, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative group">
                  <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-background hover:-translate-y-1 transition-transform">
                    <AvatarImage
                      src={broadcast?.broadcastImg}
                      alt={broadcast?.broadcastName}
                    />
                    <AvatarFallback className="text-xs sm:text-sm">
                      {broadcast?.broadcastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] sm:text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {broadcast?.broadcastName}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p>{broadcast?.broadcastName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      )}
    </div>
  );
};

export default ContentStudio;
