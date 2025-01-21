import React from "react";
import {
  Avatar,
  AvatarFallback,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from "..";
import { 
  AntennaIcon, 
  RadarIcon, 
  BarChart2, 
  Users, 
  Clock, 
  Activity 
} from "lucide-react";
import StudioContextMenu from "../menu/Studio.context.menu";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useParams, useNavigate } from "react-router";
import Cookies from 'js-cookie';
import useAuthToken from "../../hooks/useAuthToken";

const LEAVE_BROADCAST = gql`
  mutation LeaveBroadcast($broadcastName: String!) {
    leaveBroadcast(broadcastName: $broadcastName) {
      message
      success
    }
  }
`;

const DashboardStudio = () => {
  const navigate = useNavigate();
  const token = useAuthToken()
  const { broadcastName } = useParams();

  const { data: membersData } = useQuery(
    gql`
      query getBroadcastMembers($broadcastName: String!) {
        getBroadcastMembers(broadcastName: $broadcastName) {
          primaryAuthId
          role
          user {
            username
          }
        }
      }
    `,
    {
      variables: {
        broadcastName: broadcastName,
      },
      context:{
        headers:{
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`
        }
      },
      skip: !broadcastName || !token,
    }
  );

  const [leaveBroadcast] = useMutation(LEAVE_BROADCAST);

  const handleLeaveBroadcast = async () => {
    if (!broadcastName || !token) return;
    try {
      const { data } = await leaveBroadcast({
        variables: { broadcastName },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          }
        },
      });

      if (data.leaveBroadcast.success) {
        // Remove broadcast token from cookies
        Cookies.remove('broadcastToken');
        // Navigate to home page
        navigate('/');
      }
    } catch (error) {
      console.error('Error leaving broadcast:', error);
    }
  };

  const stats = [
    { label: 'Total Views', value: '2.3K', icon: BarChart2, change: '+12%' },
    { label: 'Active Members', value: '28', icon: Users, change: '+3%' },
    { label: 'Watch Time', value: '164h', icon: Clock, change: '+18%' },
    { label: 'Engagement', value: '86%', icon: Activity, change: '-2%' }
  ];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[var(--card-background)] rounded-lg border border-white/5 p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`text-xs font-medium ${
                stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
              }`}>{stat.change}</span>
            </div>
            <h3 className="text-2xl font-semibold mt-2 text-white/90">{stat.value}</h3>
            <p className="text-sm text-white/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Existing content */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Leave Button Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-4">
            <p className="text-sm text-red-400/80 max-w-md text-center md:text-left">
              Note: If you leave as broadcaster, the role will be transferred to a co-broadcaster (if any) or the longest-serving member. Your access will be revoked.
            </p>
            <Button
              variant="destructive"
              onClick={handleLeaveBroadcast}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 whitespace-nowrap w-full md:w-auto"
            >
              Leave Broadcast
            </Button>
          </div>
          
          {/* Members Section */}
          <div className="max-w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-medium text-white/90">Channel Members</h2>
              <span className="text-xs sm:text-sm text-white/50">
                {membersData?.getBroadcastMembers?.length || 0} members
              </span>
            </div>

            <div className="bg-[var(--card-background)] rounded-lg border border-white/5">
              <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
              <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2 p-2 sm:p-4">
                {membersData?.getBroadcastMembers.map((member, index) => (
                  <StudioContextMenu key={index} member={member}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="relative flex flex-col items-center p-4 rounded-sm hover:bg-primary/5 
                            transition-colors group">
                            {member.role === "BROADCASTER" && (
                              <div className="absolute top-2 right-2">
                                <AntennaIcon className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            {member.role === "CO_BROADCASTER" && (
                              <div className="absolute top-2 right-2">
                                <RadarIcon className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            
                            <Avatar className="w-16 h-16 mb-3 ring-2 ring-primary/20 group-hover:ring-primary/30 
                              transition-all">
                              <AvatarFallback className="text-lg text-white/90 bg-primary/20">
                                {member.user.username[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <p className="text-sm text-white/90 text-center font-medium truncate w-full">
                              {member.user.username}
                            </p>
                            <span className="text-xs text-white/50 mt-1">
                              {member.role.toLowerCase()}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{member.role.toLowerCase()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </StudioContextMenu>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStudio;
