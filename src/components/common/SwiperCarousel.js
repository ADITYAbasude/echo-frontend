import React, { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Autoplay } from "swiper/modules";
import { PlayCircleIcon, ClockIcon, EyeIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { formatVideoDuration, formatViews } from "../../utils/videoUtils";
import { Avatar, AvatarFallback, AvatarImage } from ".."; // Add this import

const SwiperCarousel = ({ slides }) => {
  const [, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  return (
    <div className="relative w-full max-w-[1400px] mx-auto">
      <Swiper
        effect={"coverflow"}
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={"auto"}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        speed={1000}
        coverflowEffect={{
          rotate: 0,
          stretch: 0,
          depth: 200,
          modifier: 1.2,
          slideShadows: false,
        }}
        watchSlidesProgress={true}
        preventInteractionOnTransition={true}
        navigation={{
          nextEl: ".custom-button-next",
          prevEl: ".custom-button-prev",
        }}
        modules={[EffectCoverflow, Navigation, Autoplay]}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          swiper.params.touchRatio = 1.5;
          swiper.params.touchAngle = 45;
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        className="cool-swiper !overflow-visible"
      >
        {slides.map((slide, index) => (
          <SwiperSlide 
            key={index} 
            className="cool-swiper-slide !w-[400px] group cursor-pointer"
            onClick={() => navigate(`/content/${slide._id}`)}
          >
            <div className="slide-image-wrapper">
              <img
                src={slide?.metaData?.posterUrl}
                alt={slide.metaData.title}
                className="slide-image"
              />
              
              {/* Duration Badge */}
              <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 py-1 sm:px-2.5 sm:py-1.5 
                bg-[var(--card-background)]/90 backdrop-blur-sm border border-white/10 rounded-md 
                flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-white/90">
                <ClockIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{formatVideoDuration(slide?.metaData?.duration)}</span>
              </div>

              {/* View Count Badge */}
              <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 py-1 sm:px-2.5 sm:py-1.5 
                bg-[var(--card-background)]/90 backdrop-blur-sm border border-white/10 rounded-md 
                flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-white/90">
                <EyeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>{formatViews(slide?.metaData?.viewCount)}</span>
              </div>

              {/* Content Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent 
                opacity-0 group-hover:opacity-100 transition-all duration-500">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 
                  transition-all duration-500 delay-100 transform translate-y-4 group-hover:translate-y-0">
                  <div className="p-2 sm:p-4 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30">
                    <PlayCircleIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white transform scale-90 
                      group-hover:scale-100 transition-transform duration-300" />
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 text-white transform translate-y-4 
                group-hover:translate-y-0 transition-all duration-500 z-10">
                <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3 line-clamp-2 drop-shadow-lg">
                  {slide?.metaData?.title}
                </h3>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border border-white/20 shadow-lg">
                      <AvatarImage
                        src={slide?.videoAddBy?.profilePictureURL}
                        alt={slide?.videoAddBy?.username}
                      />
                      <AvatarFallback className="text-xs sm:text-sm bg-primary/20">
                        {slide.videoAddBy.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-lg line-clamp-1">
                      {slide.videoAddBy?.username}
                    </span>
                  </div>

                  {slide.collaboration?.broadcast && (
                    <>
                      <span className="text-white/50 text-xs sm:text-sm">×</span>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Avatar className="w-6 h-6 sm:w-8 sm:h-8 border border-white/20 shadow-lg">
                          <AvatarImage
                            src={slide.collaboration.broadcast.broadcastImg}
                            alt={slide.collaboration.broadcast.broadcastName}
                          />
                          <AvatarFallback className="text-xs sm:text-sm bg-primary/20">
                            {slide.collaboration.broadcast.broadcastName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-lg line-clamp-1">
                          {slide.collaboration.broadcast.broadcastName}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Navigation Buttons */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        <button
          className="custom-button-prev group"
          onClick={(e) => {
            e.stopPropagation();
            swiperRef.current?.slidePrev();
          }}
        >
          <svg
            className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          className="custom-button-next group"
          onClick={(e) => {
            e.stopPropagation();
            swiperRef.current?.slideNext();
          }}
        >
          <svg
            className="w-6 h-6 text-white group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SwiperCarousel;
