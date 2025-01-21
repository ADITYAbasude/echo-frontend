import React from "react";
import { Button } from "..";
import { Link, useParams } from "react-router-dom";
import { PlusCircle, Radio } from "lucide-react";

const ContentAlertStudio = () => {
  const { broadcastName } = useParams();
  return (
    <div className="max-w-3xl mx-auto px-6">
      <div className="bg-[var(--card-background)] rounded-lg border border-white/5 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-primary/80 to-primary/20"></div>
        
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-primary/10">
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-white/90 font-medium">Create Content</h3>
              <p className="text-sm text-white/50 mt-0.5">Start sharing your content with your audience</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button 
              className="flex-1 sm:flex-initial bg-[var(--card-background)] hover:bg-primary/5 transition-colors
                border border-white/10 hover:border-primary/30 gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>Go Live</span>
            </Button>

            <Link to={`/studio/${broadcastName}/create`} className="flex-1 sm:flex-initial">
              <Button 
                className="w-full bg-primary hover:bg-primary/90 transition-colors gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Upload</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAlertStudio;
