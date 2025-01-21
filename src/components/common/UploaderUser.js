import { Avatar, AvatarFallback, AvatarImage } from "..";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "..";

const UploaderUser = ({ user }) => {
  return (
    <div className="gap-2 bg-[var(--primary-dark)] rounded-full pr-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center">
              <Avatar className="rounded-full" size="sm">
                <AvatarImage src={user?.profilePictureURL} alt="User" />
                <AvatarFallback>{user?.username[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm text-white/60 ml-1">
                {user?.username}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>Uploader</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default UploaderUser;
