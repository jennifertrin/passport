// --- Methods
import React, { useContext, useEffect, useState } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

import { debounce } from "ts-debounce";
import { BroadcastChannel } from "broadcast-channel";

// --- Identity tools
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Style Components
import { Card } from "../Card";
import { DoneToastContent } from "../DoneToastContent";
import { useToast } from "@chakra-ui/react";

// --- Context
import { UserContext } from "../../context/userContext";
import { ProviderSpec } from "../../config/providers";

// Each provider is recognised by its ID
const providerId: PROVIDER_ID = "Discord";

function generateUID(length: number) {
  return window
    .btoa(
      Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
        .map((b) => String.fromCharCode(b))
        .join("")
    )
    .replace(/[+/]/g, "")
    .substring(0, length);
}

export default function DiscordCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [isLoading, setLoading] = useState(false);

  // --- Chakra functions
  const toast = useToast();

  // Fetch Discord OAuth2 url from the IAM procedure
  async function handleFetchDiscordOAuth(): Promise<void> {
    // open new window for authUrl
    const authUrl = `https://discord.com/api/oauth2/authorize?response_type=code&scope=identify&client_id=${
      process.env.NEXT_PUBLIC_DPOPP_DISCORD_CLIENT_ID
    }&state=discord-${generateUID(10)}&redirect_uri=${process.env.NEXT_PUBLIC_DPOPP_DISCORD_CALLBACK}`;
    openDiscordOAuthUrl(authUrl);
  }

  // Open Discord authUrl in centered window
  function openDiscordOAuthUrl(url: string): void {
    const width = 600;
    const height = 800;
    const left = screen.width / 2 - width / 2;
    const top = screen.height / 2 - height / 2;

    // Pass data to the page via props
    window.open(
      url,
      "_blank",
      "toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=" +
        width +
        ", height=" +
        height +
        ", top=" +
        top +
        ", left=" +
        left
    );
  }

  // Listener to watch for oauth redirect response on other windows (on the same host)
  function listenForRedirect(e: { target: string; data: { code: string; state: string } }) {
    // when receiving discord oauth response from a spawned child run fetchVerifiableCredential
    if (e.target === "discord") {
      // pull data from message
      const queryCode = e.data.code;
      console.log("queryCode", queryCode);

      datadogLogs.logger.info("Saving Stamp", { provider: providerId });
      // fetch and store credential
      setLoading(true);
      fetchVerifiableCredential(
        process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "",
        {
          type: providerId,
          version: "0.0.0",
          address: address || "",
          proofs: {
            code: queryCode, // provided by discord as query params in the redirect
          },
        },
        signer as { signMessage: (message: string) => Promise<string> }
      )
        .then(async (verified: { credential: any }): Promise<void> => {
          await handleAddStamp({
            provider: providerId,
            credential: verified.credential,
          });
          datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId });
          // Custom Success Toast
          toast({
            duration: 5000,
            isClosable: true,
            render: (result: any) => <DoneToastContent providerId={providerId} result={result} />,
          });
        })
        .catch((e) => {
          datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
          throw e;
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  // attach and destroy a BroadcastChannel to handle the message
  useEffect(() => {
    // open the channel
    const channel = new BroadcastChannel("discord_oauth_channel");
    // event handler will listen for messages from the child (debounced to avoid multiple submissions)
    channel.onmessage = debounce(listenForRedirect, 300);

    return () => {
      channel.close();
    };
  });

  const issueCredentialWidget = (
    <button data-testid="button-verify-discord" className="verify-btn" onClick={handleFetchDiscordOAuth}>
      Connect account
    </button>
  );

  return (
    <Card
      providerSpec={allProvidersState[providerId]!.providerSpec as ProviderSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
      isLoading={isLoading}
    />
  );
}
