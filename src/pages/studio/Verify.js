import { gql, useQuery } from "@apollo/client";
import { CircularLoader } from "../../components";
import React, { useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router";
import { useAuth0 } from "@auth0/auth0-react";

const Verify = () => {
  const navigate = useNavigate();
  const {isAuthenticated} = useAuth0()
  const { data: verify, loading: verifyLoading } = useQuery(
    gql`
      query verifyBroadcaster {
        verifyBroadcastAccount {
          message
          success
          broadcastName
        }
      }
    `,
    {
      fetchPolicy: "network-only",
      context: {
        headers: {
          token: `Bearer ${Cookies.get("broadcastToken")}`,
        },
      },
    }
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  } , [isAuthenticated, navigate])

  useEffect(() => {
    if (verifyLoading) {
      return;
    }
    if (verify?.verifyBroadcastAccount?.success) {
      navigate(`/studio/${verify?.verifyBroadcastAccount?.broadcastName}`);
    }
    if (!verify?.verifyBroadcastAccount?.success) {
      navigate("/studio/complete-account");
    }
  }, [verifyLoading, verify, navigate]);

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <CircularLoader />
    </div>
  );
};

export default Verify;
