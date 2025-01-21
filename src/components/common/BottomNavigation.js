import {
  Cog,
  HomeIcon,
  Library,
  LogOut,
  MoreVertical,
  UserCircle,
  Video,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Cookies from "js-cookie";

const BottomNavigation = () => {
  const location = useLocation();
  const { isAuthenticated, user, logout, loginWithRedirect } = useAuth0();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const NavLink = ({ to, icon: Icon, label, isActive, onClick }) => (
    <Link
      to={to}
      onClick={onClick}
      className={`flex flex-col items-center justify-center px-2 py-0.5 rounded-lg transition-all duration-300
        ${isActive ? "text-primary" : "text-white/60 hover:text-white/90"}`}
    >
      <div
        className={`p-1 rounded-lg ${isActive ? "bg-primary/15" : ""} 
        transition-all duration-300 ease-in-out`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[0.6rem] mt-0.5 font-medium tracking-tight">
        {label}
      </span>
    </Link>
  );

  return (
    <div className="fixed bottom-0 w-full z-40 md:hidden">
      {showProfileMenu && isAuthenticated && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300"
          onClick={() => setShowProfileMenu(false)}
        >
          <div
            className="absolute bottom-[4.5rem] left-0 right-0 mx-3 bg-[var(--card-background)] rounded-lg border border-white/10
              transform transition-transform duration-300 ease-out animate-slide-up shadow-lg"
            style={{ maxWidth: "280px", margin: "0 auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-8 h-0.5 rounded-full bg-white/20"></div>
            </div>

            <div className="p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                <img
                  src={user.picture}
                  alt={user.nickname}
                  className="w-9 h-9 rounded-full ring-1 ring-primary/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white/90 truncate">
                    {user.nickname}
                  </div>
                  <div className="text-xs text-white/50 truncate">
                    {user.email}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/settings"
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5 text-white/80
                    active:bg-white/10 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="p-1.5 rounded-md bg-white/10">
                    <Cog className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Settings</span>
                </Link>

                <button
                  onClick={() => {
                    logout({ returnTo: window.location.origin }).then(() => {
                      Cookies.remove("broadcastToken")
                    });
                  }}
                  className="flex items-center gap-2 p-2 rounded-md bg-[--danger]/10 hover:bg-[--danger]/20 
                    text-white w-full active:bg-[--danger]/30 transition-colors"
                >
                  <div className="p-1.5 rounded-md bg-[--danger]/20">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mx-3 mb-2">
        <div
          className="bg-[var(--card-background)] border border-white/5 
          rounded-xl shadow-lg backdrop-blur-xl bg-opacity-95"
        >
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
          <div className="flex items-center justify-around py-1">
            <NavLink
              to="/"
              icon={HomeIcon}
              label="Home"
              isActive={location.pathname === "/"}
            />
            <NavLink
              to="/studio/verify"
              icon={Video}
              label="Studio"
              isActive={location.pathname.includes("/studio/")}
            />
            <NavLink
              to="collection"
              icon={Library}
              label="Collection"
              isActive={location.pathname.includes("/collection")}
            />
            {isAuthenticated ? (
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`flex flex-col items-center justify-center px-1.5 py-0 rounded-lg transition-all duration-300
                  ${
                    showProfileMenu ? "text-primary scale-105" : "text-white/50"
                  }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    showProfileMenu ? "bg-primary/15" : ""
                  } 
                  transition-all duration-300 ease-in-out`}
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </div>
                <span className="text-[0.6rem] mt-0.5 font-medium tracking-tight">
                  More
                </span>
              </button>
            ) : (
              <button
                onClick={() => loginWithRedirect()}
                className="flex flex-col items-center justify-center px-1.5 py-0 rounded-lg transition-all duration-300
                  text-primary"
              >
                <div className="p-1 rounded-lg bg-primary/15 transition-all duration-300 ease-in-out">
                  <UserCircle className="w-3.5 h-3.5" />
                </div>
                <span className="text-[0.6rem] mt-0.5 font-medium tracking-tight">
                  Login
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNavigation;
