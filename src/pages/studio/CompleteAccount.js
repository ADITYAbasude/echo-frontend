import React, { useRef, useState } from "react";
import { Button, CircularLoader } from "../../components";
import { ImageIcon, UploadIcon } from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";

const CompleteAccount = () => {
  const pickerRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [broadcastName, setBroadcastName] = useState(null);
  const [aboutBroadcast, setAboutBroadcast] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [, setToastVisibility] = useRecoilState(setVisible);

  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();

  const navigate = useNavigate();

  const handleImagePicker = () => {
    if (pickerRef.current) {
      pickerRef.current.click();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsUploading(true);
      if (!isAuthenticated) {
        setToastVisibility({
          message: "Please login to continue",
          visible: true,
          type: "error",
        });
        return;
      }

      if (!selectedImage || !broadcastName || !aboutBroadcast) {
        setToastVisibility({
          message: "Please provide all required fields",
          visible: true,
          type: "error",
        });
        return;
      }
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        },
      });

      const input = {
        auth0ID: user.sub.split("|")[1],
        broadcastName,
        aboutBroadcast,
        broadcastImg: null,
      };

      const operations = {
        query: `mutation CreateBroadcastAccount($input: createBroadcasterInput!) {
                createBroadcaster(input: $input) {
                  message
                  success
                }
              }`,
        variables: {
          input,
        },
      };

      const map = {
        0: ["variables.input.broadcastImg"],
      };

      const formData = new FormData();
      formData.append("operations", JSON.stringify(operations));
      formData.append("map", JSON.stringify(map));
      formData.append("0", selectedImage);

      const result = await fetch(
        `${process.env.REACT_APP_API_HOST}/graphql`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const response = await result.json();

      if (response.data && response.data.createBroadcaster.success) {
        Cookies.set("broadcastToken", response.data.createBroadcaster.message, {
          expires: 360 * 360 * 10,
        });
        setToastVisibility({
          message: "Broadcast account created successfully",
          visible: true,
          type: "success",
        });
        navigate("/studio/verify");
      } else {
        throw new Error(
          response.data?.createBroadcaster?.message || "Unknown error occurred"
        );
      }
    } catch (error) {
      setToastVisibility({
        message: error.message,
        visible: true,
        type: "error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full min-h-screen bg-[var(--background)] px-4 py-8">
      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-xl md:text-2xl font-medium text-white/90">
            Complete Your Account
          </h1>
          <p className="text-sm text-white/30 mt-1">Set up your broadcast profile to get started</p>
        </div>

        <div className="bg-[var(--card-background)] rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col items-center">
              <div className="mb-10">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={pickerRef}
                  onChange={(event) => {
                    const file = event.target.files[0];
                    if (file) setSelectedImage(file);
                  }}
                />
                
                <div className="relative flex justify-center">
                  <div 
                    onClick={handleImagePicker}
                    className="relative w-32 h-32 rounded-sm overflow-hidden cursor-pointer bg-[var(--card-background)] border border-white/10 shadow-lg group-hover:border-primary/30 transition-colors"
                  >
                    {selectedImage ? (
                      <>
                        <img
                          src={URL.createObjectURL(selectedImage)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all">
                          <UploadIcon className="w-6 h-6 text-white mb-1" />
                          <span className="text-xs text-white/90">Change Photo</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 group-hover:bg-primary/5 transition-colors">
                        <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <ImageIcon className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-sm text-primary/80">Add Photo</span>
                      </div>
                    )}
                  </div>

                </div>

                <div className="mt-3 text-center">
                  <span className="text-[11px] text-white/50">
                    Recommended: Square image, at least 400x400px
                  </span>
                </div>
              </div>

              <div className="w-full space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm text-white/80 ml-1 font-medium">Broadcast Name</label>
                  <input
                    className="w-full outline-none p-2.5 rounded-sm bg-[var(--card-background)] border border-white/10
                      text-white/90 placeholder:text-white/30 caret-primary
                      focus:border-primary/30 transition-colors"
                    placeholder="Enter your broadcast name"
                    onChange={(event) => setBroadcastName(event.target.value)}
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm text-white/80 ml-1 font-medium">About Broadcast</label>
                  <textarea
                    className="w-full min-h-[120px] outline-none p-2.5 rounded-sm bg-[var(--card-background)] border border-white/10
                      text-white/90 placeholder:text-white/30 caret-primary resize-y
                      focus:border-primary/30 transition-colors"
                    placeholder="Tell us about your broadcast channel..."
                    onChange={(event) => setAboutBroadcast(event.target.value)}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-8 pt-6 border-t border-white/5">
              <Button 
                className="min-w-[130px] text-sm hover:bg-primary/90" 
                disabled={isUploading}
              >
                {isUploading ? "Processing..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {isUploading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[var(--card-background)] p-6 rounded-lg shadow-sm border border-white/5">
            <div className="flex flex-col items-center">
              <CircularLoader className="w-8 h-8 text-primary" />
              <p className="mt-3 text-center text-sm text-white/80">Creating your account...</p>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

export default CompleteAccount;
