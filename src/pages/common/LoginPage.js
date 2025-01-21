import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "../../components";
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";

const LoginPage = () => {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const returnTo = location.state?.returnTo || "/";
      navigate(returnTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-2 h-[100dvh]">
      <div className="transform transition-all duration-300 hover:scale-105">
        <div className="flex flex-col items-center gap-2 sm:gap-4 bg-[--card-background] p-2 sm:p-6 rounded-xl shadow-lg max-w-md w-full">
          <h1 className="text-base sm:text-xl poppins-bold text-center">
            Welcome to Echo
          </h1>
          <p className="text-2xs sm:text-sm text-center text-gray-600 dark:text-gray-300 poppins-light">
            Join our community to interact with creators, participate in live
            chats, and express your appreciation through likes.
          </p>
          <Button
            onClick={() => {
              loginWithRedirect().catch((e) => console.error(e));
            }}
            className="w-full py-1 sm:py-2 text-xs sm:text-base poppins-regular"
          >
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
