import React from "react";
import { screen, render, waitFor } from "@testing-library/react";

import { UserContextState } from "../../context/userContext";
import {
  RefreshMyStampsModalContentCardList,
  RefreshMyStampsModalCardListProps,
} from "../../components/RefreshMyStampsModalContentCardList";
import {
  RefreshMyStampsModalContent,
  RefreshMyStampsModalContentProps,
} from "../../components/RefreshMyStampsModalContent";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { ValidatedPlatform } from "../../signer/utils";

const defaultProps: RefreshMyStampsModalCardListProps = {
  validPlatforms: [],
  selectedProviders: [],
  setSelectedProviders: jest.fn(),
};

const validPlatforms = [
  {
    platformProps: {
      platform: {
        path: "ethereum",
        platform_id: "1",
      },
    },
    groups: [],
  },
] as unknown as ValidatedPlatform[];

const RefreshMyStampsModalContentPropsList: RefreshMyStampsModalContentProps = {
  resetStampsAndProgressState: jest.fn(),
  onClose: jest.fn(),
  validPlatforms,
};

jest.mock("../../utils/onboard.ts");

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock("../../components/RefreshMyStampsModalContentCard.tsx", () => ({
  RefreshMyStampsModalContentCard: () => (
    <div data-testid="refresh-my-stamps-modal-content-card">Mock refresh card</div>
  ),
}));

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("RefreshMyStampsModalContentCardList", () => {
  it("renders the component after fetched stamps have been found", async () => {
    const refreshModal = () => {
      return (
        <RefreshMyStampsModalContent {...RefreshMyStampsModalContentPropsList}>
          <RefreshMyStampsModalContentCardList {...defaultProps} />
        </RefreshMyStampsModalContent>
      );
    };

    renderWithContext(mockUserContext, mockCeramicContext, refreshModal());
    await screen.findByTestId("refresh-my-stamps-modal-content-card");
  });

  it("renders the component when no stamps were found", async () => {
    const RefreshMyStampsModalContentPropsList: RefreshMyStampsModalContentProps = {
      resetStampsAndProgressState: jest.fn(),
      onClose: jest.fn(),
      validPlatforms: [],
    };

    const refreshModal = () => {
      return (
        <RefreshMyStampsModalContent {...RefreshMyStampsModalContentPropsList}>
          <RefreshMyStampsModalContentCardList {...defaultProps} />
        </RefreshMyStampsModalContent>
      );
    };

    renderWithContext(mockUserContext, mockCeramicContext, refreshModal());
    await screen.findByText("No Eligible Web3 Stamps Found");
  });
});
