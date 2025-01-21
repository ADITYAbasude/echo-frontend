import React from "react";
import { gql, useMutation } from "@apollo/client";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "..";
import Cookies from "js-cookie";
import useAuthToken from "../..//hooks/useAuthToken";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";

const UPDATE_ROLE = gql`
  mutation UpdateRole($input: updateRoleInput!) {
    updateRole(input: $input) {
      message
      success
    }
  }
`;

const REMOVE_MEMBER = gql`
  mutation RemoveMember($input: removeMemberInput!) {
    removeMember(input: $input) {
      message
      success
    }
  }
`;

const StudioContextMenu = ({
  children,
  member
}) => {
  const [updateRole] = useMutation(UPDATE_ROLE);
  const [removeMember] = useMutation(REMOVE_MEMBER);
  const token =  useAuthToken()
  const [, setToastVisibility] = useRecoilState(setVisible)

  const handleRoleUpdate = async (newRole) => {
    try {
      const { data } = await updateRole({
        variables: {
          input: {
            memberAuthId: member.primaryAuthId,
            role: newRole,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          }
        },
        refetchQueries: ["getBroadcastMembers"],
      });

      if (data?.updateRole?.success) {
        setToastVisibility({
          isVisible: true,
          message: data?.updateRole?.message,
          type: "success",
        })
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveMember = async () => {
    try {
      await removeMember({
        variables: {
          input: {
            memberAuthId: member.primaryAuthId,
          },
        },
        context: {
          headers: {
            Authorization: `Bearer ${token}`,
            token: `Bearer ${Cookies.get("broadcastToken")}`,
          }
        },
        refetchQueries: ["getBroadcastMembers"],
      });
    } catch (error) {
      console.error("Error removing member:", error);
    }
  };

  // Only show options if current user is BROADCASTER
  if (member.role === "BROADCASTER") {
    return (
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
      </ContextMenu>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="min-w-[180px] bg-[var(--card-background)] border border-white/5 rounded-lg overflow-hidden">
        <div className="h-0.5 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
        {member?.role === "MEMBER" && (
          <ContextMenuItem 
            className="flex items-center px-3 py-2 text-sm text-white/90 hover:bg-primary/10 hover:text-white transition-colors cursor-pointer"
            onClick={() => handleRoleUpdate("CO_BROADCASTER")}
          >
            Promote to Co-broadcaster
          </ContextMenuItem>
        )}
        {member?.role === "CO_BROADCASTER" && (
          <ContextMenuItem 
            className="flex items-center px-3 py-2 text-sm text-white/90 hover:bg-primary/10 hover:text-white transition-colors cursor-pointer"
            onClick={() => handleRoleUpdate("MEMBER")}
          >
            Demote to Member
          </ContextMenuItem>
        )}
        {member?.role !== "BROADCASTER" && (
          <ContextMenuItem
            className="flex items-center px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
            onClick={handleRemoveMember}
          >
            Remove Member
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default StudioContextMenu;
