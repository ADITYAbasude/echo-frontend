import React from "react";
import { useNavigate } from "react-router-dom";
import {
  formatVideoDate,
  formatVideoDuration,
  formatViews,
} from "../../utils/videoUtils";
import { PlayIcon, Clock, Trash2, X, Film } from "lucide-react";
import { Avatar, AvatarFallback, Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../";

const VideoCard = ({ 
  video, 
  onRemove, 
  onWatchLater, 
  isInWatchLater, 
  showRemove = true,
  isCollectionCard = false 
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="group bg-[var(--card-background)] rounded-lg sm:rounded-xl overflow-hidden border border-white/5 hover:border-primary/20 transition-all duration-300"
      onClick={() => navigate(`/content/${video._id}`)}
    >
      <div className="aspect-video relative overflow-hidden">
        {video.metaData.posterUrl ? (
          <img
            src={video.metaData.posterUrl}
            alt={video.metaData.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[var(--card-background)] to-primary/5 flex items-center justify-center">
            <Film className="w-12 h-12 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayIcon className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white/90" />
        </div>

        {/* Remove Button Overlay */}
        {showRemove && onRemove && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    className="p-2 bg-black/80 hover:bg-red-500/80 rounded-lg transition-all duration-200 group/remove flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(video._id, e);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-white/90 group-hover/remove:text-white" />
                    <X className="w-3.5 h-3.5 text-white/80 group-hover/remove:text-white" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="text-xs">Remove from collection</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        
        {/* Duration Badge */}
        <span className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 px-1.5 py-0.5 sm:px-2 sm:py-1 bg-black/80 text-white/90 text-[10px] sm:text-xs font-medium rounded">
          {formatVideoDuration(video?.metaData.duration)}
        </span>
      </div>

      <div className="p-2.5 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Avatar 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg border border-primary/20 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/broadcast/${video.broadcast.broadcastName}`);
            }}
          >
            {video.broadcast.broadcastImg ? (
              <img 
                src={video.broadcast.broadcastImg} 
                alt={video.broadcast.broadcastName}
                className="w-full h-full object-cover"
              />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary">
                {video.broadcast.broadcastName[0]}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="text-xs sm:text-sm font-medium text-white/90 line-clamp-2 leading-snug sm:leading-tight">
              {video.metaData.title}
            </h3>
            <p className="text-[11px] sm:text-xs text-white/50 mt-1 hover:text-primary transition-colors"
               onClick={(e) => {
                 e.stopPropagation();
                 navigate(`/${video.broadcast.broadcastName}`);
               }}>
              {video.broadcast.broadcastName}
            </p>
            <div className="flex items-center flex-wrap gap-1.5 mt-1.5 text-[10px] sm:text-xs text-white/50">
              <span>{formatViews(video.metaData.viewCount)} views</span>
              <span className="text-[8px] sm:text-[10px]">•</span>
              <span>{formatVideoDate(video?.createdAt || video?.watchedAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          {onWatchLater && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWatchLater(video._id, isInWatchLater, e);
                      }}
                    >
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          isInWatchLater
                            ? "text-primary fill-primary"
                            : "text-white/50 hover:text-white/90"
                        }`}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isInWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
