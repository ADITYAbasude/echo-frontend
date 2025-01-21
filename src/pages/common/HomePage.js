import {
  SwiperCarousel,
  VideoCard,
} from "../../components/index";
import React from "react";
import "../../styles/CustomVideoJsStyle.css";
import "../../styles/CustomSwiperStyle.css";
import { gql, useQuery } from "@apollo/client";
import { TrendingUpIcon } from "lucide-react";

const GET_HOME_CONTENT = gql`
  query getHomeContent {
    getHomeContent {
      carousel {
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
      content {
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
    }
  }
`;

const HomePage = () => {
  const { data: homeContentData, loading: homeContentDataFetching } = useQuery(
    GET_HOME_CONTENT,
    { fetchPolicy: "cache-and-network" }
  );

  if (homeContentDataFetching) {
    return (
      <div className="min-h-screen p-2 sm:p-4 md:p-6">
        <div className="w-full max-w-[1400px] mx-auto space-y-4 sm:space-y-6">
          {/* Hero Section Skeleton */}
          <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[var(--card-background)] rounded-lg border border-white/5 animate-pulse">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="h-full bg-white/5"></div>
          </div>

          {/* Content Section Skeleton */}
          <div className="space-y-3 sm:space-y-4">
            <div className="h-6 sm:h-8 bg-white/5 w-36 sm:w-48 rounded-sm"></div>
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-video bg-[var(--card-background)] rounded-lg border border-white/5 animate-pulse">
                  <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
                  <div className="h-full bg-white/5"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 bg-custom-background text-custom-foreground">
      <div className="w-full max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <section className="w-full">
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5 overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            {homeContentData?.getHomeContent?.carousel && (
              <SwiperCarousel
                slides={homeContentData.getHomeContent.carousel}
              />
            )}
          </div>
        </section>

        {/* Content Section */}
        <section className="w-full space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between mb-2 sm:mb-4 px-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <h2 className="text-sm sm:text-base md:text-lg font-medium text-white/90">
                Trending Content
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs md:text-sm text-white/50">
              {homeContentData?.getHomeContent?.content?.length || 0} videos
            </span>
          </div>

          <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="p-2 sm:p-4">
              <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4">
                {homeContentData?.getHomeContent?.content?.map((video, index) => (
                  <VideoCard 
                    key={video._id || index} 
                    video={video}
                    showRemove={false}
                    showWatchLater={true}
                    className="transform transition-all duration-300 hover:scale-[1.02] hover:bg-primary/5 hover:border-primary/20"
                  />
                ))}
                {homeContentData?.getHomeContent?.content?.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-white/50">
                    <TrendingUpIcon className="w-8 h-8 sm:w-12 sm:h-12 mb-3 sm:mb-4 text-white/20" />
                    <p className="text-xs sm:text-sm">No trending content available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
