import { StudioTopNavigation } from "../../components";
import React, { useEffect } from "react";
import { useSubscription, gql, useQuery } from "@apollo/client";
import Cookies from "js-cookie";
import { useAuth0 } from "@auth0/auth0-react";
import { useRecoilState } from "recoil";
import { setVisible } from "../../state/toastState";
import { useParams } from "react-router-dom";
import AccessDeniedStudio from "../../components/studio/AccessDenied.studio";

// TODO: do it in future
const COLLAB_STATUS_SUBSCRIPTION = gql`
  subscription CollaborationStatus($collaboratorID: ID!) {
    collaborationStatus(collaboratorID: $collaboratorID) {
      status
      videoID
      senderBroadcastName
      receiverBroadcastID
    }
  }
`;

const StudioPage = () => {
  const { broadcastName } = useParams();
  const { getAccessTokenSilently } = useAuth0();
  const [token, setToken] = React.useState(null);
  const [, setToastVisibility] = useRecoilState(setVisible);

  // TODO: do it in future
  // const [collaborationRequest, setCollaborationRequest] = React.useState(null);
  // const broadcastID = Cookies.get("broadcastToken");
  const {data: getBroadcaster, refetch: refetchGetBroadcaster} = useQuery(
    gql`
      query getBroadcaster {
        getBroadcaster {
          _id
        }
      }
    `,
    {
      context: {
        headers: {
          Authorization: `Bearer ${token}`,
          token: `Bearer ${Cookies.get("broadcastToken")}`,
        },
      },
      fetchPolicy: "network-only",
      skip: !token || !Cookies.get("broadcastToken"),
    }
  );

  const { data: membersData, loading } = useQuery(
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
      fetchPolicy: "network-only",
      skip: !broadcastName || !token,
    }
  );

  useEffect(() => {
    (async () => {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        },
      });
      setToken(token);
      refetchGetBroadcaster();
    })();
  }, [getAccessTokenSilently, refetchGetBroadcaster]);

  // Subscribe to collaboration requests
  useSubscription(COLLAB_STATUS_SUBSCRIPTION, {
    variables: { collaboratorID: getBroadcaster?.getBroadcaster?._id },
    skip: !getBroadcaster?.getBroadcaster?._id,
    onSubscriptionData: ({ subscriptionData }) => {
      const request = subscriptionData.data.collaborationStatus;
      setToastVisibility({
        message: `${request?.senderBroadcastName} added you in a video as a collaborator`,
        type: "notification",
        visible: true,
      })
    },
  });

  // const handleAcceptCollaboration = async () => {
  //   // TODO: Implement mutation to accept collaboration
  //   setCollaborationRequest(null);
  // };

  // const handleRejectCollaboration = async () => {
  //   // TODO: Implement mutation to reject collaboration
  //   setCollaborationRequest(null);
  // };

  // Check access before rendering any content
  if (!loading && (!membersData?.getBroadcastMembers || membersData.getBroadcastMembers.length === 0)) {
    return <AccessDeniedStudio broadcastName={broadcastName} />;
  }

  return (
    <div className="">
      <StudioTopNavigation />
      {/* //TODO: do it in future */}
      {/* {collaborationRequest && (
        <BroadcastCollabRequest
          isVisible={collaborationRequest.status === "PENDING"}
          requesterName={collaborationRequest?.senderID} // You might want to fetch broadcaster name
          requesterAvatar="https://github.com/shadcn.png" // You might want to fetch broadcaster avatar
          onAccept={handleAcceptCollaboration}
          onReject={handleRejectCollaboration}
        />
      )} */}
    </div>
  );
};

export default StudioPage;
