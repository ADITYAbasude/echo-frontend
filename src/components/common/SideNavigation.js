import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  Cog,
  HomeIcon,
  Library,
  LogOut,
  UserCircle,
  Video,
} from "lucide-react";
import { useAuth0 } from "@auth0/auth0-react";
import { Separator } from "../";
import { gql, useMutation } from "@apollo/client";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import Cookies from "js-cookie";

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      message
      success
    }
  }
`;

const SideNavigation = () => {
  const {
    isAuthenticated,
    logout,
    loginWithRedirect,
    isLoading,
    user,
    getAccessTokenSilently,
    getAccessTokenWithPopup,
  } = useAuth0();

  const [chevronDown, setChevronDown] = React.useState(false);
  const [, setToastVisibility] = useRecoilState(setVisible);
  const location = useLocation();

  const [createUser] = useMutation(CREATE_USER_MUTATION);

  const handleCreateUser = React.useCallback(
    async (user, token) => {
      const [provider, id] = user.sub.split("|");
      try {
        await createUser({
          variables: {
            input: {
              oAuthProvider: provider,
              oAuthID: id,
              email: user.email,
              username: user.nickname,
              profilePictureURL: user.picture,
            },
          },
          context: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        });
      } catch (error) {}
    },
    [createUser]
  );

  React.useEffect(() => {
    const fetchUser = async () => {
      if (isAuthenticated && user) {
        try {
          const token = await getAccessTokenSilently({
            authorizationParams: {
              audience: process.env.REACT_APP_AUTH0_AUDIENCE,
            },
          });
          handleCreateUser(user, token);
        } catch (error) {
          if (error.error === "consent_required") {
            try {
              const token = await getAccessTokenWithPopup({
                authorizationParams: {
                  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
                },
              });
              handleCreateUser(user, token);
            } catch (error) {
              loginWithRedirect({
                authorizationParams: {
                  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
                },
              });
            }
          } else {
            console.error(error);
          }
        }
      }
    };
    fetchUser();
  }, [
    isAuthenticated,
    user,
    getAccessTokenSilently,
    getAccessTokenWithPopup,
    handleCreateUser,
    loginWithRedirect,
    setToastVisibility,
  ]);
  return (
    <div className="fixed h-full text-xl rounded-lg max-md:hidden top-12">
      <div className="p-3 grid grid-cols-1 gap-2 mr-0 text-base font-light w-[240px]">
        <div className="py-2 px-1">
          {!isLoading &&
            (isAuthenticated ? (
              <>
                <div className="flex items-center justify-start rounded-lg p-1.5 mb-1 hover:bg-[var(--primary-opacity-5)] transition-all">
                  <img
                    width={"32px"}
                    height={"32px"}
                    className="rounded-full ring-2 ring-primary/20"
                    src={user.picture}
                    alt=""
                  />
                  <div className="ml-2.5 text-sm font-medium text-white/90 hidden lg:block">
                    {user.nickname}
                  </div>
                  <div
                    className={`flex hover:bg-[var(--primary-opacity-10)] ml-auto p-1 rounded-full justify-center transition-all transform ${
                      chevronDown ? "rotate-180" : ""
                    } duration-200`}
                    onClick={() => setChevronDown(!chevronDown)}
                  >
                    <ChevronDown size={16} className="text-white/70" />
                  </div>
                </div>
                <div
                  className={`bg-[var(--card-background)] rounded-lg lg:px-2 text-base transition-all duration-300 
                  border border-white/5 overflow-hidden font-light max-lg:w-fit max-lg:p-2 max-lg:justify-center ${
                    chevronDown
                      ? "max-h-[1000px] py-2"
                      : "max-h-0 py-0 max-lg:py-0"
                  }`}
                  style={{
                    maxHeight: chevronDown ? "1000px" : "0px",
                  }}
                >
                  <Link to={`/settings`}>
                    <div className="flex items-center even:mt-1 cursor-pointer w-full max-lg:justify-center">
                      <Cog size={18} className="lg:mr-2 max-lg:m-1" />{" "}
                      <div className="hidden lg:block">Settings</div>
                    </div>
                  </Link>
                  <div
                    onClick={() => {
                      logout({ returnTo: window.location.origin }).then(() => {
                        Cookies.remove("broadcastToken");
                      });
                    }}
                    className="flex items-center cursor-pointer text-[--danger] even:mt-1 w-full max-lg:justify-center max-lg:mt-2"
                  >
                    <LogOut
                      size={18}
                      color="var(--danger)"
                      className="lg:mr-2 max-lg:m-1"
                    />
                    <div className="hidden lg:block">Logout</div>
                  </div>
                </div>

                <Separator className="my-3 block max-lg:hidden opacity-10" />
              </>
            ) : (
              <div className="lg:w-40">
                <div className="text-sm max-lg:hidden">
                  Login to live chat with creators, likes and much more.
                </div>
                <div
                  className="flex border border-1 border-primary items-center py-1 px-2 rounded-lg mr-12 text-sm grid-cols-3 mt-2 cursor-pointer"
                  onClick={() => loginWithRedirect()}
                >
                  <>
                    <UserCircle size={22} className="col-span-1" />{" "}
                    <div className="flex font-light col-span-2 justify-center w-full">
                      Login
                    </div>
                  </>
                </div>
                <Separator className="mt-2 max-lg:hidden" />
              </div>
            ))}
        </div>

        <Link
          to={"/"}
          className={`flex items-center justify-start transition duration-300 hover:bg-[var(--primary-opacity-10)] rounded-lg p-2.5
          max-lg:w-fit max-lg:p-4 gap-4 group ${
            location.pathname === "/"
              ? "bg-[var(--primary-opacity-10)] text-primary"
              : "text-white/70 hover:text-white/90"
          }`}
        >
          <HomeIcon
            size={18}
            className="group-hover:text-primary transition-colors"
          />
          <div className="hidden lg:block text-sm font-medium">Home</div>
        </Link>
        <Link
          to={`/studio/verify`}
          className={`flex items-center mt-1 justify-start transition duration-300 easy-in-out hover:bg-[var(--primary-opacity-10)] rounded-lg p-2.5 
            max-lg:w-fit max-lg:p-4 gap-4 group ${
              location.pathname.includes("/studio/")
                ? "bg-[var(--primary-opacity-10)] text-primary"
                : "text-white/70 hover:text-white/90"
            }`}
        >
          <Video
            size={18}
            className="group-hover:text-primary transition-colors"
          />
          <div className="hidden lg:block text-sm font-medium">Studio</div>
        </Link>
        <Link
          to={"/collection"}
          className={`flex items-center mt-1 justify-start transition duration-300 easy-in-out hover:bg-[var(--primary-opacity-10)] rounded-lg p-2.5 
            max-lg:w-fit max-lg:p-4 gap-4 group ${
              location.pathname.includes("/collection")
                ? "bg-[var(--primary-opacity-10)] text-primary"
                : "text-white/70 hover:text-white/90"
            }`}
        >
          <Library
            size={18}
            className="group-hover:text-primary transition-colors"
          />
          <div className="hidden lg:block text-sm font-medium">Collection</div>
        </Link>
      </div>
    </div>
  );
};

export default SideNavigation;
