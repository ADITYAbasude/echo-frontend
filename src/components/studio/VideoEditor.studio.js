import React, { useCallback, useEffect, useRef } from "react";
import { Avatar, AvatarImage, Button, CircularLoader } from "../";
import { useRecoilState } from "recoil";
import { videoFile } from "../../state/studio/uploadVideoState.studio";
import {
  ArrowLeft,
  Trash2Icon,
  XIcon,
  UploadCloudIcon,
  CheckCircleIcon,
  XCircleIcon,
  RotateCw,
  ImageIcon,
} from "lucide-react";
import "video.js/dist/video-js.css";
import videojs from "video.js";
import { useDropzone } from "react-dropzone";
import { useSubscription, gql, useQuery, useMutation } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import Cookies from "js-cookie";
import "@videojs/http-streaming";
import { setVisible } from "../../state/toastState";

const VIDEO_STATUS_SUBSCRIPTION = gql`
  subscription VideoUploadingAndTranscodingStatus($userId: ID!) {
    videoUploadingAndTranscodingStatus(userId: $userId) {
      status
      videoId
    }
  }
`;

const GET_UPLOAD_URL = gql`
  mutation GetVideoUploadUrl {
    getVideoUploadUrl {
      signedUrl
      videoID
      success
    }
  }
`;

const VideoEditorStudio = () => {
  const [file, setFile] = useRecoilState(videoFile);
  const [getVideoId, setVideoId] = React.useState(null);
  const [posterSelected, setPosterSelected] = React.useState(null);
  const [uploadStatus, setUploadStatus] = React.useState("");
  const [showSearch, setShowSearch] = React.useState(false);
  const [collaboratorName, setCollaboratorName] = React.useState("");
  const [token, setToken] = React.useState("");
  const [selectedCollaborator, setSelectedCollaborator] = React.useState(null);
  const posterRef = React.useRef(null);
  const [, setToastVisibility] = useRecoilState(setVisible);
  const [videoTitle, setVideoTitle] = React.useState("");
  const [videoDescription, setVideoDescription] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const { user, getAccessTokenSilently, isAuthenticated } = useAuth0();

  // subscribe to video status
  const { error } = useSubscription(VIDEO_STATUS_SUBSCRIPTION, {
    variables: {
      userId: user.sub.split("|")[1],
    },
    onSubscriptionData: ({ subscriptionData }) => {
      if (subscriptionData.data) {
        setUploadStatus(
          subscriptionData.data.videoUploadingAndTranscodingStatus.status
        );
        setVideoId(
          subscriptionData.data.videoUploadingAndTranscodingStatus.videoId
        );
      }
    },
  });

  // get broadcasters account
  const { data: broadcastAccounts, loading: fetchingBroadcastersAccount } =
    useQuery(
      gql`
        query getBroadcasters($broadcastName: String!) {
          getBroadcasters(broadcastName: $broadcastName) {
            broadcastName
            broadcastImg
            _id
          }
        }
      `,
      {
        variables: {
          broadcastName: collaboratorName,
        },
        skip: !collaboratorName || !token || !Cookies.get("broadcastToken"),
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          },
        },
      }
    );

  const handleUploadVideoDetails = async () => {
    if (!isAuthenticated) return;
    if (uploadStatus !== "TRANSCODED") return;
    setIsLoading(true);
    try {
      const input = {
        videoID: getVideoId,
        videoTitle,
        videoDescription,
        videoPoster: null,
        videoDuration: 0,
      };
      const map = {
        0: ["variables.input.videoPoster"],
      };
      const operations = {
        query: `mutation storeVideoDetails($input: storeVideoDetailsInput!) {
                storeVideoDetails(input: $input) {
                  message
                  success
                }
              }`,
        variables: {
          input: input,
        },
      };
      const formData = new FormData();
      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      formData.append("0", posterSelected);

      await fetch(`${process.env.REACT_APP_API_HOST}/graphql`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`,
        },
      }).then(async (res) => {
        const result = await res.json();
        if (result.data.storeVideoDetails.success) {
          setToastVisibility({
            message: "Video uploaded successfully",
            type: "success",
            visible: true,
          });
          setFile(null);
        }
      });
    } catch (err) {
      setToastVisibility({
        message: "Failed to upload video",
        type: "error",
        visible: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        },
      });
      setToken(token);
    })();
  }, [getAccessTokenSilently]);

  const [requestCollaborationMutation] = useMutation(
    gql`
      mutation requestVideoCollaboration($input: CollaborationRequest!) {
        requestVideoCollaboration(input: $input) {
          message
          success
        }
      }
    `
  );

  useEffect(() => {
    if (broadcastAccounts) {
      setShowSearch(1);
    }
  }, [broadcastAccounts]);

  useEffect(() => {
    if (error) {
      console.error("Subscription error:", error);
    }
  }, [error]);

  const onDrop = useCallback((files) => {
    setPosterSelected(files[0]);
  }, []);

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  const handleFileChange = (event) => {
    setPosterSelected(event.target.files[0]);
  };

  const renderUploadStatus = () => {
    switch (uploadStatus) {
      case "PREPARING":
        return (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <UploadCloudIcon
                size={24}
                className="text-yellow-500 animate-bounce"
              />
              <div className="flex flex-col">
                <span className="text-yellow-500 font-medium">
                  Uploading your video...
                </span>
                <span className="text-yellow-500/60 text-sm">
                  This might take a few minutes
                </span>
              </div>
            </div>
            <CircularLoader className="text-yellow-500" />
          </div>
        );
      case "UPLOADED":
        return (
          <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 flex-1">
              <UploadCloudIcon size={24} className="text-blue-500" />
              <div className="flex flex-col">
                <span className="text-blue-500 font-medium">
                  Processing your video...
                </span>
                <span className="text-blue-500/60 text-sm">
                  We're optimizing your video for best quality
                </span>
              </div>
            </div>
            <CircularLoader className="text-blue-500" />
          </div>
        );
      case "TRANSCODED":
        return (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
            <CheckCircleIcon size={24} className="text-green-500" />
            <div className="flex flex-col">
              <span className="text-green-500 font-medium">
                Upload Complete!
              </span>
              <span className="text-green-500/60 text-sm">
                Your video has been uploaded successfully
              </span>
            </div>
          </div>
        );
      case "FAILED":
        return (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-4">
            <XCircleIcon size={24} className="text-red-500" />
            <div className="flex flex-col">
              <span className="text-red-500 font-medium">Upload Failed</span>
              <span className="text-red-500/60 text-sm">Please try again</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const [getUploadUrl] = useMutation(GET_UPLOAD_URL);
  const [uploadVideo] = useMutation(gql`
    mutation UploadVideo($videoId: ID!) {
      uploadVideo(videoId: $videoId) {
        success
        message
        id
      }
    }
  `);

  useEffect(() => {
    (async () => {
      if (!file) return;

      const fileType = file.type || "application/octet-stream"; // Get MIME type or fallback

      try {
        setUploadStatus("PREPARING");
        // Get signed URL
        const { data } = await getUploadUrl({
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
              token: `Bearer ${Cookies.get("broadcastToken")}`,
            },
          },
        });

        if (!data.getVideoUploadUrl.success) {
          throw new Error("Failed to get upload URL");
        }

        // Upload to S3 with correct Content-Type
        const response = await fetch(data?.getVideoUploadUrl?.signedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": fileType,
          },
        });

        if (response.ok) {
          setUploadStatus("UPLOADED");
        }

        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }

        // Notify backend to start processing
        await uploadVideo({
          variables: { videoId: data.getVideoUploadUrl.videoID },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
              token: `Bearer ${Cookies.get("broadcastToken")}`,
            },
          },
        });

        setVideoId(data.getVideoUploadUrl.videoID);
      } catch (error) {}
    })();
  }, [token, isAuthenticated, file, getUploadUrl, uploadVideo]);

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Status display */}
        {uploadStatus && renderUploadStatus()}

        <div className="bg-[var(--card-background)] rounded-lg border border-white/5 mt-6">
          <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Video Player Section */}
              <div className="w-full lg:w-[60%]">
                {file !== null && (
                  <div className="rounded-lg overflow-hidden border border-white/10">
                    <VideoPlayer
                      options={{
                        controls: true,
                        responsive: true,
                        fluid: true,
                        preload: "auto",
                        type: "video/mp4",
                        controlBar: {
                          children: [
                            "playToggle",
                            {
                              name: "volumePanel",
                              inline: false,
                            },
                            "currentTimeDisplay",
                            "timeDivider",
                            "durationDisplay",
                            "progressControl",
                            "pictureInPictureToggle",
                            "fullscreenToggle",
                          ],
                        },
                      }}
                      videoUrl={URL.createObjectURL(file)}
                    />
                  </div>
                )}
              </div>

              {/* Form Section */}
              <div className="w-full lg:w-[40%] space-y-6">
                {/* Title Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Title</label>
                  <input
                    placeholder="Enter video title"
                    aria-label="Title"
                    className="w-full outline-none p-2.5 rounded-sm bg-[var(--card-background)] 
                      border border-white/10 text-white/90 placeholder:text-white/30 caret-primary
                      focus:border-primary/30 transition-colors"
                    onChange={(e) => setVideoTitle(e.target.value)}
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Description</label>
                  <textarea
                    placeholder="Enter video description"
                    aria-label="Description"
                    className="w-full min-h-[120px] outline-none p-2.5 rounded-sm bg-[var(--card-background)] 
                      border border-white/10 text-white/90 placeholder:text-white/30 caret-primary resize-y
                      focus:border-primary/30 transition-colors"
                    onChange={(e) => setVideoDescription(e.target.value)}
                  />
                </div>

                {/* Poster Section */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Video Thumbnail</label>
                  <div className="mt-2">
                    {posterSelected === null ? (
                      <div
                        {...getRootProps()}
                        className="flex flex-col items-center justify-center h-[160px] border border-white/10 
                          border-dashed rounded-sm hover:border-primary/30 transition-colors cursor-pointer
                          bg-[var(--card-background)]"
                        onClick={() => posterRef.current.click()}
                      >
                        <input
                          type="file"
                          {...getInputProps()}
                          ref={posterRef}
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                        <div className="p-3 rounded-full bg-primary/10 mb-3">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm text-primary/80">Add Thumbnail</span>
                        <span className="text-xs text-white/40 mt-1">
                          {isDragActive ? "Drop the image here" : "Click to upload or drag and drop"}
                        </span>
                      </div>
                    ) : (
                      <div className="relative rounded-sm overflow-hidden border border-white/10">
                        <img
                          src={URL.createObjectURL(posterSelected)}
                          alt="Thumbnail"
                          className="w-full h-[160px] object-cover"
                        />
                        <button
                          className="absolute top-2 right-2 p-2 bg-black/50 rounded-lg hover:bg-black/70 
                            transition-colors"
                          onClick={() => setPosterSelected(null)}
                        >
                          <Trash2Icon size={16} className="text-white/90" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Collaborator Section */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Collaborator</label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <div
                        className="w-full p-3 rounded-sm bg-[var(--card-background)] border border-white/10 
                          hover:border-primary/30 transition-colors cursor-pointer min-h-[48px] flex items-center"
                        onClick={() => setShowSearch(!showSearch)}
                      >
                        {selectedCollaborator ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={selectedCollaborator.broadcastImg} />
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="text-white/90 font-medium">{selectedCollaborator.broadcastName}</span>
                                <span className="text-xs text-white/50">Selected Collaborator</span>
                              </div>
                            </div>
                            <button
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCollaborator(null);
                              }}
                            >
                              <XIcon size={16} className="text-white/60" />
                            </button>
                          </div>
                        ) : (
                          <input
                            className="w-full bg-transparent outline-none text-white/90 placeholder:text-white/40"
                            placeholder="Search for a broadcaster to collaborate..."
                            value={collaboratorName}
                            onChange={(e) => setCollaboratorName(e.target.value)}
                          />
                        )}
                      </div>

                      {/* Collaborator Search Results */}
                      {showSearch && (
                        <div className="absolute mt-2 w-full bg-[var(--card-background)] border border-white/10 
                          rounded-sm shadow-xl z-10 backdrop-blur-sm">
                          {fetchingBroadcastersAccount ? (
                            <div className="p-6 flex justify-center">
                              <CircularLoader className="w-6 h-6 text-primary" />
                            </div>
                          ) : (
                            <div className="max-h-[280px] overflow-y-auto">
                              {broadcastAccounts?.getBroadcasters?.length > 0 ? (
                                broadcastAccounts.getBroadcasters.map((broadcaster) => (
                                <div
                                  key={broadcaster.broadcastName}
                                    className="flex items-center gap-3 p-4 hover:bg-white/5 cursor-pointer border-b 
                                      border-white/5 last:border-0"
                                  onClick={() => {
                                    setSelectedCollaborator(broadcaster);
                                    setShowSearch(false);
                                    setCollaboratorName("");
                                  }}
                                >
                                    <Avatar className="h-10 w-10">
                                    <AvatarImage src={broadcaster.broadcastImg} />
                                  </Avatar>
                                    <div className="flex flex-col">
                                      <span className="text-white/90 font-medium">{broadcaster.broadcastName}</span>
                                      <span className="text-xs text-white/50">Click to select as collaborator</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-6 text-center text-white/50">
                                  {collaboratorName ? "No broadcasters found" : "Type to search broadcasters"}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Button
                      className="px-6 bg-primary hover:bg-primary/90 transition-colors min-h-[48px] flex items-center gap-2"
                      onClick={() => {
                        if (selectedCollaborator) {
                          requestCollaborationMutation({
                            variables: {
                              input: {
                                collaboratorID: selectedCollaborator._id,
                                videoID: getVideoId,
                              },
                            },
                            context: {
                              headers: {
                                Authorization: `Bearer ${token}`,
                                token: `Bearer ${Cookies.get("broadcastToken")}`,
                              },
                            },
                          });
                        }
                      }}
                      disabled={!selectedCollaborator}
                    >
                      {selectedCollaborator ? (
                        <>
                          <span>Send Request</span>
                        </>
                      ) : (
                        <span className="text-white/60">Select Collaborator</span>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
              <Button
                className="min-w-[100px] hover:bg-white/5 transition-colors"
                onClick={() => setFile(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                className="min-w-[100px] bg-primary hover:bg-primary/90 transition-colors"
                onClick={() => handleUploadVideoDetails()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Upload"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditorStudio;

//TODO: remove this one and re-use the VidePlayer component from the components folder
const VideoPlayer = ({ options, videoUrl }) => {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current) {
      const videoElement = videoRef.current;
      if (!videoElement) return;

      const player = videojs(videoElement, {
        ...options,
        controlBar: {
          children: [
            "playToggle",
            "volumePanel",
            "currentTimeDisplay",
            "timeDivider",
            "durationDisplay",
            "progressControl",
            "pictureInPictureToggle",
            "fullscreenToggle",
          ],
          volumePanel: {
            inline: false,
          },
        },
      });

      playerRef.current = player;
    }
  }, [options]);

  return (
    <div className="video-editor-container relative w-full aspect-video max-h-[calc(100vh-200px)] min-h-[300px]">
      <div data-vjs-player className="h-full">
        <video
          ref={videoRef}
          className="video-js vjs-default-skin w-full h-full vjs-fluid vjs-big-play-centered rounded-lg overflow-hidden"
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};
