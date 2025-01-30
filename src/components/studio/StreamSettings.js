import React from 'react';
import { Button } from '../';
import { Settings2, Save, X, Layout, Users, Shield, Radio } from 'lucide-react';

const StreamSettings = ({ 
  isOpen, 
  onClose, 
  settings, 
  onUpdate,
  isMainBroadcaster 
}) => {
  const [localSettings, setLocalSettings] = React.useState(settings);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdate(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--card-background)] rounded-lg border border-white/5 w-full max-w-md">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <h2 className="text-base font-medium text-white/90">Stream Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Stream Layout Section */}
          {isMainBroadcaster && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">Default Layout</label>
              <select
                value={localSettings.defaultLayout}
                onChange={(e) => setLocalSettings({...localSettings, defaultLayout: e.target.value})}
                className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
              >
                <option value="grid">Grid View</option>
                <option value="focus">Focus View</option>
                <option value="fullwidth">Full Width</option>
              </select>
            </div>
          )}

          {/* Video Quality */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Video Quality</label>
            <select
              value={localSettings.quality}
              onChange={(e) => setLocalSettings({...localSettings, quality: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
            >
              <option value="1080p60">1080p 60fps</option>
              <option value="1080p30">1080p 30fps</option>
              <option value="720p60">720p 60fps</option>
              <option value="720p30">720p 30fps</option>
            </select>
          </div>

          {/* Stream Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Stream Mode</label>
            <select
              value={localSettings.mode}
              onChange={(e) => setLocalSettings({...localSettings, mode: e.target.value})}
              className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
            >
              <option value="ultra-low-latency">Ultra Low Latency</option>
              <option value="low-latency">Low Latency</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          {/* Multi-Broadcaster Settings */}
          {isMainBroadcaster && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Co-Broadcaster Limit</label>
                <select
                  value={localSettings.coBroadcasterLimit}
                  onChange={(e) => setLocalSettings({...localSettings, coBroadcasterLimit: e.target.value})}
                  className="w-full bg-black/20 border border-white/10 rounded-sm px-3 py-2 text-white/90"
                >
                  <option value="1">1 Co-Broadcaster</option>
                  <option value="2">2 Co-Broadcasters</option>
                  <option value="3">3 Co-Broadcasters</option>
                  <option value="4">4 Co-Broadcasters</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Co-Broadcaster Permissions</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.coBroadcasterCanMute}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        coBroadcasterCanMute: e.target.checked
                      })}
                      className="rounded border-white/10 bg-black/20"
                    />
                    <span className="text-sm text-white/80">Can Mute Other Broadcasters</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localSettings.coBroadcasterCanKick}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        coBroadcasterCanKick: e.target.checked
                      })}
                      className="rounded border-white/10 bg-black/20"
                    />
                    <span className="text-sm text-white/80">Can Remove Other Broadcasters</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-white/5">
          <Button 
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StreamSettings;