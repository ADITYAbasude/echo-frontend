import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyQuery } from "@apollo/client";
import { gql } from "@apollo/client";
import { Search, X } from "lucide-react";
import debounce from "lodash/debounce";
import logo from "../../assets/logo.png";
import { Link } from "react-router-dom";

const SEARCH_QUERY = gql`
  query SearchQuery($query: String!) {
    searchQuery(query: $query) {
      videos {
        _id
        metaData {
          title
          posterUrl
          duration
          viewCount
        }
      }
      broadcasters {
        _id
        broadcastName
        broadcastImg
        aboutBroadcast
      }
    }
  }
`;

const TopNavigation = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const navigate = useNavigate();

  const [executeSearch, { loading }] = useLazyQuery(SEARCH_QUERY, {
    onCompleted: (data) => {
      setSearchResults(data.searchQuery);
    },
  });

  // Debounced search function
  const debouncedSearch = debounce((query) => {
    if (query.length >= 2) {
      executeSearch({ variables: { query } });
    } else {
      setSearchResults(null);
    }
  }, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  const searchDropdownRef = React.useRef(null);

  const handleBlur = (e) => {
    if (!searchDropdownRef.current?.contains(e.relatedTarget)) {
      setIsFocused(false);
    }
  };

  const navigateToResult = (type, item) => {
    setIsFocused(false);
    setSearchQuery("");
    setSearchResults(null);
    if (type === "video") {
      navigate(`/content/${item._id}`);
    } else {
      navigate(`/${item.broadcastName}`);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 h-16 bg-[var(--card-background)] border-b border-[var(--primary-opacity-10)]">
      <div className="h-full flex items-center gap-4 px-2 sm:px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center hover:opacity-80 transition-opacity duration-200 shrink-0"
        >
          <img src={logo} alt="Echo" className="w-[80px] sm:w-[100px] object-contain" />
        </Link>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-2xl mx-auto">
          <div
            className={`flex items-center bg-[var(--background)] border ${
              isFocused
                ? "border-primary/40"
                : "border-[var(--primary-opacity-10)] hover:border-[var(--primary-opacity-20)]"
            } rounded-lg transition-all duration-200`}
          >
            <div className="flex items-center pl-4 pr-2">
              <Search
                className={`w-5 h-5 ${
                  isFocused ? "text-primary" : "text-white/40"
                } transition-colors duration-200`}
              />
            </div>

            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              className="w-full py-2.5 px-2 bg-transparent outline-none text-white/90 placeholder:text-white/40 
                text-sm caret-primary"
              placeholder="Search videos, creators, or broadcasts..."
            />

            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="flex items-center px-3 hover:text-primary text-white/40 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isFocused && searchQuery && (
            <div
              ref={searchDropdownRef}
              tabIndex={-1}
              className="absolute w-full mt-2 py-2 bg-[var(--card-background)] border border-[var(--primary-opacity-10)] 
                rounded-lg shadow-lg max-h-[60vh] sm:max-h-[70vh] overflow-y-auto
                left-0 right-0 mx-auto"
                style={{ 
                  width: 'min(100vw - 32px, 100%)',
                  maxWidth: '42rem'
                }}
            >
              {loading ? (
                <div className="px-3 sm:px-4 py-2 text-sm text-white/40">
                  Searching...
                </div>
              ) : searchResults ? (
                <>
                  {searchResults.broadcasters.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 sm:px-4 py-1 text-xs text-white/40 uppercase tracking-wider">
                        Broadcasts
                      </div>
                      {searchResults.broadcasters.map((broadcaster) => (
                        <button
                          key={broadcaster._id}
                          onClick={() => navigateToResult("broadcast", broadcaster)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="w-full px-3 sm:px-4 py-2 hover:bg-white/5 cursor-pointer 
                            flex items-center gap-2 sm:gap-3 text-left transition-colors"
                        >
                          <img
                            src={broadcaster.broadcastImg}
                            alt=""
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-white/90 truncate">
                              {broadcaster.broadcastName}
                            </div>
                            <div className="text-xs text-white/40 truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">
                              {broadcaster.aboutBroadcast}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.videos.length > 0 && (
                    <div>
                      <div className="px-3 sm:px-4 py-1 text-xs text-white/40 uppercase tracking-wider">
                        Videos
                      </div>
                      {searchResults.videos.map((video) => (
                        <button
                          key={video._id}
                          onClick={() => navigateToResult("video", video)}
                          onMouseDown={(e) => e.preventDefault()}
                          className="w-full px-3 sm:px-4 py-2 hover:bg-white/5 cursor-pointer 
                            flex items-center gap-2 sm:gap-3 text-left transition-colors"
                        >
                          <div className="w-16 sm:w-20 h-10 sm:h-12 flex-shrink-0">
                            <img
                              src={video.metaData.posterUrl}
                              alt=""
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm text-white/90 truncate line-clamp-1">
                              {video.metaData.title}
                            </div>
                            <div className="text-xs text-white/40">
                              {video.metaData.viewCount.toLocaleString()} views
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.videos.length === 0 &&
                    searchResults.broadcasters.length === 0 && (
                      <div className="px-3 sm:px-4 py-2 text-sm text-white/40">
                        No results found
                      </div>
                    )}
                </>
              ) : (
                <div className="px-3 sm:px-4 py-2 text-sm text-white/40">
                  Start typing to search...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Section - Add additional elements here if needed */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Add buttons/elements here */}
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;
