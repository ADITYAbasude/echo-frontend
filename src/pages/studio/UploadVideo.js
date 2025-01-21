import React, { useCallback } from "react";
import { HardDriveUploadIcon, FileVideo } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { VideoEditorStudio } from "../../components";
import { useRecoilState } from "recoil";
import { videoFile } from "../../state/studio/uploadVideoState.studio";

const UploadVideo = () => {
  const [selectedFile, setSelectedFile] = useRecoilState(videoFile);
  const [isSupportedFile, setIsSupportedFile] = React.useState(false);
  const videoRef = React.useRef(null);

  const onDrop = useCallback((files) => {
    if (files[0].type === "video/mp4") {
      setSelectedFile(files[0]);
      setIsSupportedFile(true);
    } else {
      setIsSupportedFile(false);
    }
  }, [setSelectedFile]);

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: "video/mp4",
  });

  const handleFileChange = (event) => {
    if (event.target.files[0].type === "video/mp4") {
      setSelectedFile(event.target.files[0]);
      setIsSupportedFile(true);
    } else {
      setIsSupportedFile(false);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {selectedFile && isSupportedFile ? (
        <VideoEditorStudio />
      ) : (
        <div>
          <div className="bg-[var(--card-background)] rounded-lg border border-white/5 mb-4">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="p-4 border-b border-white/5">
              <h2 className="text-base sm:text-lg font-medium text-white/90">Upload Video</h2>
              <p className="text-sm text-white/50 mt-1">Upload your video in MP4 format</p>
            </div>

            <div
              {...getRootProps()}
              className="flex flex-col justify-center items-center p-8 sm:p-12 m-4 
                border-2 border-dashed border-white/10 rounded-lg 
                hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
              onClick={() => videoRef.current.click()}
            >
              <input
                type="file"
                {...getInputProps()}
                ref={videoRef}
                onChange={handleFileChange}
                accept="video/*"
              />
              
              <div className="rounded-full p-6 bg-primary/10 mb-6">
                {isDragActive ? (
                  <FileVideo size={64} className="text-primary animate-pulse" />
                ) : (
                  <HardDriveUploadIcon size={64} className="text-primary" />
                )}
              </div>

              <h3 className="text-lg font-medium text-white/90 mb-2">
                {isDragActive ? "Drop your video here" : "Drag & Drop your video"}
              </h3>
              
              <p className="text-sm text-white/50 mb-4">
                {isDragActive 
                  ? "Release to upload your file" 
                  : "or click to browse from your computer"}
              </p>

              {selectedFile && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm text-white/80">
                    Selected: <span className="text-primary">{selectedFile.name}</span>
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/5">
              <p className="text-xs text-white/50 text-center">
                Supported format: MP4 • Maximum file size: 2GB
              </p>
            </div>
          </div>

          {!isSupportedFile && selectedFile && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-lg text-sm">
              Please select an MP4 video file. Other formats are not supported at this time.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadVideo;
