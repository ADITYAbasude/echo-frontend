import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import DashboardStudio from "./Dashboard.studio";
import ContentStudio from "./Content.studio";
import ContentAlertStudio from "./ContentAlert.studio";
import AnalyticsStudio from "./Analytics.studio";
import BroadcastSettings from "./BroadcastSettings.studio";
import { LayoutDashboardIcon, VideoIcon, LineChartIcon, SettingsIcon, MenuIcon } from "lucide-react";

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
  { id: 'content', label: 'Content', icon: VideoIcon },
  { id: 'analytics', label: 'Analytics', icon: LineChartIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const StudioTopNavigation = () => {
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);

  return (
    <div className="w-full relative px-2 sm:px-4 md:px-8 pb-4">
      <ContentAlertStudio />
      
      {/* Mobile Menu Button */}
      <div className="md:hidden flex justify-end mt-4 px-2">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 hover:bg-primary/5 rounded-sm transition-colors"
        >
          <MenuIcon className="w-5 h-5 text-white/80" />
        </button>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList 
          className={`bg-[var(--card-background)] w-full justify-between mt-2 md:mt-4
            transition-all duration-200 ease-in-out border-b border-white/5
            ${showMobileMenu ? 'flex-col h-auto' : 'flex-row h-12 overflow-hidden'} md:flex-row md:h-12`}
        >
          {navigationItems.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className={`flex items-center gap-3 px-4 min-w-0 flex-1
                ${showMobileMenu 
                  ? 'justify-start w-full py-4 border-b border-white/5 last:border-0' 
                  : 'justify-center'}`}
            >
              <item.icon className={`${showMobileMenu ? 'w-5 h-5' : 'w-4 h-4 hidden sm:block'}`} />
              <span className={`truncate ${showMobileMenu ? 'text-sm' : 'text-xs sm:text-sm'}`}>
                {item.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-4">
          <TabsContent value="dashboard">
            <DashboardStudio />
          </TabsContent>
          <TabsContent value="content">
            <ContentStudio />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsStudio />
          </TabsContent>
          <TabsContent value="settings">
            <BroadcastSettings />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default StudioTopNavigation;
