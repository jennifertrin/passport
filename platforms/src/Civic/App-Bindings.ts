import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class CivicPlatform extends Platform {
  platformId = "Civic";
  path = "Civic";
  clientId: string = null;
  redirectUri: string = null;
  isEVM = true;

  getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    const authUrl = `${process.env.NEXT_PUBLIC_PASSPORT_PROCEDURE_URL?.replace(
      /\/*?$/,
      ""
    )}/civicpass/getpass?callback=${appContext?.callbackUrl}&userDid=${appContext?.userDid}`;
    const width = 600;
    const height = 800;
    const left = appContext.screen.width / 2 - width / 2;
    const top = appContext.screen.height / 2 - height / 2;

    appContext.window.open(
      authUrl,
      "_blank",
      `toolbar=no, location=no, directories=no, status=no, menubar=no, resizable=no, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    return Promise.resolve({});
  }
}
