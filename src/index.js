import React from "react";
import ReactDOM from "react-dom/client";
import "./globals.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { Auth0Provider } from "@auth0/auth0-react";
import { RecoilRoot } from "recoil";
import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  HttpLink,
  InMemoryCache,
  split,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

const root = ReactDOM.createRoot(document.getElementById("root"));

const httpLink = new HttpLink({
  uri: `${process.env.REACT_APP_API_HOST}/graphql`,
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: `${process.env.REACT_APP_API_HOST_FOR_WEBSOCKET}/graphql`,
    shouldRetry: true,
    retryAttempts: 5,
    on: {
      // connected: () => console.log("connected"),
      // error: (error) => console.error("WS Error:", error),
      // closed: () => console.log("WS Closed"),
    },
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({
  link: ApolloLink.from([splitLink]),
  uri: `${process.env.REACT_APP_API_HOST}/graphql`,
  cache: new InMemoryCache({
    addTypename: false,
    typePolicies: {
      Query: {
        fields: {
          getSettings: {
            merge: false,
          },
        },
      },
    },
  }),
});

root.render(
  <ApolloProvider client={client}>
    <React.StrictMode>
      <RecoilRoot>
        <Auth0Provider
          domain="echo.uk.auth0.com"
          clientId="hW1JR5bHRlN7Ah2qGBe8xBBbsXieUlbv"
          authorizationParams={{
            redirect_uri: process.env.REACT_APP_HOST,
          }}
          cacheLocation="localstorage"
        >
          <App />
        </Auth0Provider>
      </RecoilRoot>
    </React.StrictMode>
  </ApolloProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
