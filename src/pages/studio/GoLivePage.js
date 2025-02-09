import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { LiveStreamPlayer, CircularLoader } from "../../components";
import { Upload, Copy, Check, AlertCircle } from "lucide-react";
import useAuthToken from "../../hooks/useAuthToken";
import Cookies from "js-cookie";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import { gql, useQuery } from "@apollo/client";

const GET_LIVE_STREAM_STATUS = gql`
  query GetLiveStreamStatus {
    getLiveStreamStatus {
      isLive
      streamTitle
      viewerCount
      startedAt
      posterUrl
      streamKey
    }
  }
`;

const GoLivePage = () => {
  const { broadcastName } = useParams();
  const [poster, setPoster] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isStreamInitialized, setIsStreamInitialized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [streamDetails, setStreamDetails] = useState({
    title: "",
    description: "",
  });
  const [streamKey, setStreamKey] = useState("");
  const [, setToastVisibility] = useRecoilState(setVisible);
  const token = useAuthToken();

  // Check for existing stream
  const { data: streamStatus, loading: loadingStreamStatus } = useQuery(
    GET_LIVE_STREAM_STATUS,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`,
        },
      },
      fetchPolicy: "network-only",
      skip: !broadcastName || !token,
      pollInterval: 5000, // Poll every 5 seconds to check stream status
    }
  );

  useEffect(() => {
    if (streamStatus?.getLiveStreamStatus?.isLive) {
      setStreamKey(streamStatus.getLiveStreamStatus.streamKey);
      setIsStreamInitialized(true);
      setStreamDetails({
        title: streamStatus.getLiveStreamStatus.streamTitle,
        description: streamStatus.getLiveStreamStatus.description || "",
      });
      if (streamStatus.getLiveStreamStatus.previewUrl) {
        setPoster(streamStatus.getLiveStreamStatus.previewUrl);
      }
    }
  }, [streamStatus, setToastVisibility]);

  const handlePosterUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setPoster(file);
    } else {
      setToastVisibility({
        message: "Please upload a valid image file",
        visible: true,
        type: "error",
      });
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setToastVisibility({
        message: "Copied to clipboard",
        visible: true,
        type: "success",
      });
    } catch (err) {
      setToastVisibility({
        message: "Failed to copy to clipboard",
        visible: true,
        type: "error",
      });
    }
  };

  const handleStreamStart = async () => {
    if (!streamDetails.title.trim()) {
      setError("Stream title is required");
      setToastVisibility({
        message: "Stream title is required",
        visible: true,
        type: "error",
      });
      return;
    }

    if (!poster) {
      setError("Stream poster is required");
      setToastVisibility({
        message: "Stream poster is required",
        visible: true,
        type: "error",
      });
      return;
    }

    try {
      setError("");
      setIsProcessing(true);

      const operations = {
        query: `mutation StreamBroadcast($input: StreamBroadcastInput!) {
          streamBroadcast(input: $input) {
            message
            success
            streamKey
          }
        }`,
        variables: {
          input: {
            title: streamDetails.title,
            description: streamDetails.description || "",
            poster: null,
          },
        },
      };

      const formData = new FormData();
      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify({ 0: ["variables.input.poster"] }));
      formData.append("0", poster);

      const result = await fetch(`${process.env.REACT_APP_API_HOST}/graphql`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`,
          "apollo-require-preflight": "true",
          "x-apollo-operation-name": "StreamBroadcast",
        },
        body: formData,
      });

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }

      const response = await result.json();

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      if (response.data?.streamBroadcast?.success) {
        setStreamKey(response.data.streamBroadcast.streamKey);
        setIsStreamInitialized(true);
        setToastVisibility({
          message: "Stream initialized successfully",
          visible: true,
          type: "success",
        });
      } else {
        throw new Error(
          response.data?.streamBroadcast?.message ||
            "Failed to initialize stream"
        );
      }
    } catch (err) {
      setError(err.message);
      setToastVisibility({
        message: err.message,
        visible: true,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Stream URLs
  const rtmpServerUrl = `rtmp://${
    process.env.REACT_APP_RTMP_SERVER || "localhost:1935"
  }/live`;

  const playbackUrl = `http://${
    process.env.REACT_APP_HLS_SERVER || "localhost:8000"
  }/hls/${streamKey}.m3u8`;

  const posterPreviewUrl =
    poster instanceof File ? URL.createObjectURL(poster) : poster;

  // Early return if loading stream status
  if (loadingStreamStatus) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <CircularLoader className="w-8 h-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        {/* Stream Preview */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {isStreamInitialized ? (
            <LiveStreamPlayer
              stream={{
                url: playbackUrl,
                broadcasterName: broadcastName,
                isLive: true,
              }}
              poster={posterPreviewUrl}
            />
          ) : (
            <div className="aspect-video bg-black/40 rounded-lg flex items-center justify-center">
              <p className="text-white/60">
                Set up your stream details to begin
              </p>
            </div>
          )}

          {/* Stream Settings */}
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
            <div className="p-4 space-y-4">
              {/* Show stream details if stream is active */}
              {isStreamInitialized ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white/90 mb-2">
                      Stream Information
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">
                          RTMP Server URL
                        </label>
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          <input
                            type="text"
                            readOnly
                            value={rtmpServerUrl}
                            className="w-full sm:flex-1 bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
                          />
                          <button
                            onClick={() => copyToClipboard(rtmpServerUrl)}
                            className="w-full sm:w-auto px-3 py-2 bg-primary/10 text-primary rounded-sm hover:bg-primary/20 flex items-center justify-center"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-white/80 mb-2 block">
                          Stream Key
                        </label>
                        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                          <input
                            type="password"
                            readOnly
                            value={streamKey}
                            className="w-full sm:flex-1 bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
                          />
                          <button
                            onClick={() => copyToClipboard(streamKey)}
                            className="w-full sm:w-auto px-3 py-2 bg-primary/10 text-primary rounded-sm hover:bg-primary/20 flex items-center justify-center"
                          >
                            {copied ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {streamStatus?.getLiveStreamStatus?.isLive && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <p className="text-green-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Stream is live - Use OBS or your streaming software
                            to end the stream
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-2 block">
                      Stream Title
                    </label>
                    <input
                      type="text"
                      value={streamDetails.title}
                      onChange={(e) =>
                        setStreamDetails((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
                      placeholder="Enter stream title"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80 mb-2 block">
                      Description
                    </label>
                    <textarea
                      value={streamDetails.description}
                      onChange={(e) =>
                        setStreamDetails((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
                      rows="3"
                      placeholder="Describe your stream"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5 h-full">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20" />
            <div className="p-4">
              <div className="space-y-4">
                {/* Only show poster upload when stream is not initialized */}
                {!isStreamInitialized && (
                  <>
                    <h3 className="text-lg font-medium text-white/90">
                      Upload Poster
                    </h3>

                    {/* Thumbnail Upload */}
                    <div className="border-2 border-dashed border-white/10 rounded-lg p-4 text-center">
                      {poster ? (
                        <div className="relative">
                          <img
                            src={posterPreviewUrl}
                            alt="Stream poster"
                            className="w-full rounded-lg"
                          />
                          <button
                            onClick={() => setPoster(null)}
                            className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white/80 hover:text-white"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
                          <span className="text-sm text-white/60">
                            Upload poster
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePosterUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <button
                    onClick={handleStreamStart}
                    disabled={isStreamInitialized || isProcessing}
                    className={`w-full py-2.5 rounded-lg transition-all relative
                      ${
                        isStreamInitialized
                          ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                          : isProcessing
                          ? "bg-primary/5 text-primary/50 cursor-not-allowed"
                          : "bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                      } flex items-center justify-center gap-2`}
                  >
                    {isProcessing && (
                      <CircularLoader className="w-4 h-4 text-current" />
                    )}
                    {isStreamInitialized ? (
                      <>
                        <Check className="w-4 h-4" />
                        Stream Ready
                      </>
                    ) : (
                      <span className="font-medium">
                        {isProcessing ? "Initializing Stream..." : "Start Stream"}
                      </span>
                    )}
                  </button>

                  {error && (
                    <div className="flex items-center gap-1.5 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-sm border border-white/5">
            <div className="flex flex-col items-center">
              <CircularLoader className="w-8 h-8 text-primary" />
              <p className="mt-3 text-center text-sm text-white/80">
                Initializing stream...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoLivePage;
