// hooks/useAuthToken.js
import { useAuth0 } from "@auth0/auth0-react";
import { useState, useEffect } from "react";

const useAuthToken = () => {
  const { isAuthenticated, getAccessTokenSilently, getAccessTokenWithPopup, loginWithRedirect } = useAuth0();
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      if (isAuthenticated) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            },
          });
          setToken(token);
        } catch (error) {
          if (error.error === "consent_required") {
            try {
              const token = await getAccessTokenWithPopup({
                authorizationParams: {
                  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
                },
              });
              setToken(token);
            } catch (error) {
              loginWithRedirect({
                authorizationParams: {
                  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
                },
              });
            }
          }
        }
      }
    };
    fetchToken();
  }, [isAuthenticated, getAccessTokenSilently, getAccessTokenWithPopup, loginWithRedirect]);

  return token;
};

export default useAuthToken;