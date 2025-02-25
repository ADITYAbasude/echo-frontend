import React, { useState, useRef } from "react";
import { Button } from "..";
import { ImageIcon, Loader2Icon } from "lucide-react";
import { gql, useQuery } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import Cookies from "js-cookie";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";

const GET_BROADCASTER = gql`
  query GetBroadcaster {
    getBroadcaster {
      _id
      broadcastName
      aboutBroadcast
      broadcastImg
    }
  }
`;

const BroadcastSettings = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const pickerRef = useRef(null);
  const { getAccessTokenSilently } = useAuth0();
  const [, setToastVisibility] = useRecoilState(setVisible);

  const [formData, setFormData] = useState({
    broadcastName: "",
    aboutBroadcast: "",
  });

  const { data: broadcasterData, loading } = useQuery(GET_BROADCASTER, {
    context: {
      headers: {
        token: `Bearer ${Cookies.get("broadcastToken")}`,
      },
    },
    onCompleted: (data) => {
      setFormData({
        broadcastName: data.getBroadcaster.broadcastName,
        aboutBroadcast: data.getBroadcaster.aboutBroadcast,
      });
    },
  });

  const handleImagePicker = () => {
    if (pickerRef.current) {
      pickerRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        },
      });

      // Only include fields that have changed
      const changedFields = {};
      if (
        formData.broadcastName !== broadcasterData.getBroadcaster.broadcastName
      ) {
        changedFields.broadcastName = formData.broadcastName;
      }
      if (
        formData.aboutBroadcast !==
        broadcasterData.getBroadcaster.aboutBroadcast
      ) {
        changedFields.aboutBroadcast = formData.aboutBroadcast;
      }
      if (selectedImage) {
        changedFields.broadcastImg = selectedImage;
      }

      const input = {
        ...changedFields,
        broadcastImg: null,
      };

      const operations = {
        query: `mutation UpdateBroadcast($input: updateBroadcastInput!) {
                updateBroadcast(input: $input) {
                  success
                  message
                }
              }`,
        variables: {
          input,
        },
      };

      const map = {
        0: ["variables.input.broadcastImg"],
      };

      const formDataSrc = new FormData();
      formDataSrc.append("operations", JSON.stringify(operations));
      formDataSrc.append("map", JSON.stringify(map));

      if (selectedImage) {
        formDataSrc.append("0", selectedImage);
      }

      // Only proceed if there are changes
      if (Object.keys(changedFields).length > 0) {
        const result = await fetch(
          `${process.env.REACT_APP_API_HOST}/graphql`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              token: `Bearer ${Cookies.get("broadcastToken")}`,
              'x-apollo-operation-name': 'UpdateBroadcast',
            },
            body: formDataSrc
          }
        );

        const response = await result.json();

        if (response.data?.updateBroadcast.success) {
          setToastVisibility({
            message: "Broadcast details updated successfully",
            type: "success",
            visible: true,
          });
        } else {
          throw new Error(
            response.data?.updateBroadcast?.message || "Unknown error occurred"
          );
        }
      }
    } catch (error) {
      setToastVisibility({
        message: error.message,
        type: "error",
        visible: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
          <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>

          <form onSubmit={handleSubmit} className="p-4 sm:p-6">
            {/* Profile Image Section */}
            <div className="mb-6 sm:mb-8">
              <label className="block text-sm font-medium text-white/80 mb-4">
                Broadcast Image
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                <div className="relative group mx-auto sm:mx-0">
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

                  <div
                    onClick={handleImagePicker}
                    className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-sm overflow-hidden cursor-pointer 
                      border border-white/10 group-hover:border-primary/30 transition-colors"
                  >
                    {selectedImage ||
                    broadcasterData?.getBroadcaster?.broadcastImg ? (
                      <img
                        src={
                          selectedImage
                            ? URL.createObjectURL(selectedImage)
                            : broadcasterData.getBroadcaster.broadcastImg
                        }
                        alt="Broadcast"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex flex-col items-center justify-center gap-3 
                        bg-[var(--card-background)] group-hover:bg-primary/5 transition-colors"
                      >
                        <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-white/90 mb-1">
                    Upload broadcast image
                  </p>
                  <p className="text-xs text-white/50">
                    Recommended: Square image, at least 400x400px
                  </p>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">
                  Broadcast Name
                </label>
                <input
                  className="w-full outline-none p-2 sm:p-2.5 rounded-sm bg-[var(--card-background)] 
                    border border-white/10 text-white/90 placeholder:text-white/30 caret-primary 
                    focus:border-primary/30 transition-colors text-sm sm:text-base"
                  value={formData.broadcastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      broadcastName: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-white/80">
                  About Broadcast
                </label>
                <textarea
                  className="w-full min-h-[100px] sm:min-h-[120px] outline-none p-2 sm:p-2.5 rounded-sm 
                    bg-[var(--card-background)] border border-white/10 text-white/90 
                    placeholder:text-white/30 caret-primary resize-y focus:border-primary/30 
                    transition-colors text-sm sm:text-base"
                  value={formData.aboutBroadcast}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      aboutBroadcast: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/5">
              <Button
                className="min-w-[120px] sm:min-w-[130px] text-sm bg-primary hover:bg-primary/90 
                  transition-colors"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Loader2Icon className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                    <span className="text-xs sm:text-sm">Updating...</span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm">Save Changes</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BroadcastSettings;
