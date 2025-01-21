import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '..';
import { useAuth0 } from '@auth0/auth0-react';

const AccessDeniedStudio = ({ broadcastName }) => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-[var(--card-background)] rounded-lg border border-white/5 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-red-500/80 to-red-500/20"></div>
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            
            <h2 className="text-xl font-semibold text-white/90 mb-2">Access Denied</h2>
            <p className="text-white/60 mb-6">
              {broadcastName ? (
                <>You don't have access to the broadcast <span className="text-white/90 font-medium">{broadcastName}</span>.</>
              ) : (
                'You don\'t have access to this broadcast.'
              )}
            </p>
            
            <div className="space-y-3">
              {!isAuthenticated ? (
                <Button 
                  onClick={() => loginWithRedirect()}
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary"
                >
                  Sign in to access
                </Button>
              ) : (
                <p className="text-sm text-white/50 bg-white/5 rounded-lg p-3">
                  If you believe you should have access, please contact the broadcast owner.
                </p>
              )}
              
              <Link to="/">
                <Button 
                  variant="ghost" 
                  className="w-full text-white/70 hover:text-white/90 hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedStudio;
