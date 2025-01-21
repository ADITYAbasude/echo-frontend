import React, { useState } from "react";
import { Settings as SettingsIcon, Volume2, Loader2Icon } from "lucide-react";
import { Tooltip, TooltipProvider, Button } from "../../components";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import { gql, useMutation, useQuery } from "@apollo/client";
import useAuthToken from "../../hooks/useAuthToken";
import { useAuth0 } from "@auth0/auth0-react";

const GET_SETTINGS = gql`
  query GetSettings {
    getSettings {
      defaultQuality
      enableHotkeys
      defaultVolume
      defaultPlaybackSpeed
      autoPlay
    }
  }
`;

const UPDATE_SETTINGS = gql`
  mutation UpdateUserSettings($input: UpdateUserSettingsInput!) {
    updateUserSettings(input: $input) {
      message
      success
    }
  }
`;

const Settings = () => {
  const [settings, setSettings] = useState({
    defaultQuality: "high",
    enableHotkeys: true,
    defaultVolume: 100,
    defaultPlaybackSpeed: 1,
    autoPlay: true,
  });

  const token = useAuthToken();
  const { isAuthenticated } = useAuth0();
  const [isUpdating, setIsUpdating] = useState(false);
  const [, setToastVisibility] = useRecoilState(setVisible);

  const { loading } = useQuery(GET_SETTINGS, {
    context: {
      headers: {
        authorization: `Bearer ${token}`,
      },
    },
    skip: !token,
    onCompleted: (data) => {
      if (data?.getSettings) {
        setSettings(data.getSettings);
      }
    },
  });

  const [updateSettings] = useMutation(UPDATE_SETTINGS);

  const handleChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const validateSettings = (settings) => {
    const { defaultVolume, defaultPlaybackSpeed } = settings;
    if (defaultVolume < 0 || defaultVolume > 100) return false;
    if (defaultPlaybackSpeed < 0.5 || defaultPlaybackSpeed > 2) return false;
    return true;
  };

  const handleSaveSettings = async () => {
    if (!validateSettings(settings)) {
      setToastVisibility({
        message: "Invalid settings values",
        type: "error",
        visible: true,
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateSettings({
        variables: {
          input: settings,
        },
        context: {
          headers: {
            authorization: `Bearer ${token}`,
          },
        },
      });
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

  const ToggleSwitch = ({ label, checked, onChange, tooltip }) => (
    <div className="flex items-center justify-between group">
      <TooltipProvider>
        <Tooltip content={tooltip}>
          <label className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
            {label}
          </label>
        </Tooltip>
      </TooltipProvider>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div
          className="w-11 h-6 bg-white/5 peer-focus:outline-none rounded-full peer 
          peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] 
          after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all 
          peer-checked:bg-primary hover:bg-white/10 transition-colors"
        ></div>
      </label>
    </div>
  );

  const SelectInput = ({ label, value, onChange, options }) => (
    <div className="grid gap-2 group">
      <label className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
        {label}
      </label>
      <select
        value={value}
        onChange={onChange}
        className="w-full bg-[var(--card-background)] border border-white/10 rounded-sm p-2.5 
          text-white/80 outline-none focus:border-primary/30 hover:border-white/20 
          transition-colors cursor-pointer text-sm"
      >
        {options.map(({ value, label }) => (
          <option
            key={value}
            value={value}
            className="bg-[var(--card-background)]"
          >
            {label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2Icon className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  } else
    return (
      <div className="p-2 sm:p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <SettingsIcon className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                Video Settings
              </h1>
            </div>

            <Button
              onClick={handleSaveSettings}
              disabled={isUpdating || !isAuthenticated}
              className="min-w-[100px] bg-primary hover:bg-primary/90 transition-colors"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save</span>
              )}
            </Button>
          </div>

          <div className="bg-[var(--card-background)] border border-white/5 rounded-lg overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
            <div className="p-6 space-y-6">
              <SelectInput
                label="Default Quality"
                value={settings.defaultQuality}
                onChange={(e) => handleChange("defaultQuality", e.target.value)}
                options={[
                  { value: "high", label: "High" },
                  { value: "medium", label: "Medium" },
                  { value: "low", label: "Low" },
                ]}
              />

              <div className="grid gap-2 group">
                <label className="text-sm text-white/70 group-hover:text-white/90 transition-colors">
                  Default Volume
                </label>
                <div className="flex items-center gap-4">
                  <Volume2 className="w-5 h-5 text-white/60" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.defaultVolume}
                    onChange={(e) =>
                      handleChange("defaultVolume", parseInt(e.target.value))
                    }
                    className="w-full accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-white/60 min-w-[40px]">
                    {settings.defaultVolume}%
                  </span>
                </div>
              </div>

              <SelectInput
                label="Default Playback Speed"
                value={settings.defaultPlaybackSpeed}
                onChange={(e) =>
                  handleChange(
                    "defaultPlaybackSpeed",
                    parseFloat(e.target.value)
                  )
                }
                options={[
                  { value: "0.5", label: "0.5x" },
                  { value: "1", label: "1x (Normal)" },
                  { value: "1.5", label: "1.5x" },
                  { value: "2", label: "2x" },
                ]}
              />

              <div className="space-y-4">
                <ToggleSwitch
                  label="Autoplay videos"
                  checked={settings.autoPlay}
                  onChange={(e) => handleChange("autoPlay", e.target.checked)}
                  tooltip="Automatically play videos when they load"
                />
                <ToggleSwitch
                  label="Enable keyboard shortcuts"
                  checked={settings.enableHotkeys}
                  onChange={(e) =>
                    handleChange("enableHotkeys", e.target.checked)
                  }
                  tooltip="Use keyboard controls for video playback"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Settings;
