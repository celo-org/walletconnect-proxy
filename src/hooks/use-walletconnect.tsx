import { createContext, FC, useContext, useEffect, useRef } from "react";
import WalletConnect from "@walletconnect/client";
import useKeyState from "./use-topic-array";
import { ParserResult, Transaction } from "no-yolo-signatures";
import { utils } from "ethers";
import { IJsonRpcRequest } from "@walletconnect/types";
import { useOnboard } from "./use-onboard";
import { useNoYoloParser } from "./use-no-yolo-parser";

interface Session {
  key: string;
  client: WalletConnect;
  requested: boolean;
  connected: boolean;
}

interface Sessions {
  [key: string]: Session;
}

type WalletConnectContextProps = {
  sessions: Sessions;
  initiate: (uri: string) => void;
  approveSessionRequest: (key: string) => void;
  rejectSessionRequest: (key: string) => void;
  approveTransactionSignature: (key: string) => void;
  rejectTransactionSignature: (key: string) => void;
  disconnect: (key: string) => void;
  signatureRequests: TransactionSignatureRequests;
};

const WalletConnectContext = createContext<WalletConnectContextProps>({
  sessions: {},
  initiate: () => {},
  approveSessionRequest: () => {},
  rejectSessionRequest: () => {},
  approveTransactionSignature: () => {},
  rejectTransactionSignature: () => {},
  disconnect: () => {},
  signatureRequests: {},
});

const metadata = {
  name: "Test Wallet",
  description: "Test Wallet",
  url: "https://celo.org",
  icons: ["https://walletconnect.com/walletconnect-logo.png"],
};

export enum TransactionSignatureRequestState {
  AwaitUserAction = "AwaitUserAction",
  SentToWallet = "SentToWallet",
  ReceivedWalletResponse = "ReceivedWalletResponse",
  SentToDapp = "SentToDapp",
  Mined = "Mined",
}

interface TransactionSignatureRequest {
  key: string;
  requestId: number;
  chainId: number;
  transaction: Transaction;
  sessionKey: string;
  noYoloResult?: ParserResult;
  state: TransactionSignatureRequestState;
  txHash?: string;
}

interface TransactionSignatureRequests {
  [key: string]: TransactionSignatureRequest;
}

const toChecksum = utils.getAddress;

export const WalletConnectContextProvider: FC = ({ children }) => {
  const { parser } = useNoYoloParser();
  const parserRef = useRef(parser);

  useEffect(() => {
    parserRef.current = parser;
  }, [parser]);
  const [sessions, addSession, removeSession, updateSession] =
    useKeyState<Session>();
  const [
    signatureRequests,
    addSignatureRequest,
    removeSignatureRequest,
    updateSignatureRequest,
  ] = useKeyState<TransactionSignatureRequest>();
  const { chainId, address, provider, onboard } = useOnboard();

  const ALL_SESSION_KEY = "/walletconnectproxy/sessions";
  const persistSession = (client: WalletConnect) => {
    const sessionKeys =
      window.localStorage.getItem(ALL_SESSION_KEY)?.split(",") || [];
    const sessionKey = client.session.peerId;
    sessionKeys.push(sessionKey);
    window.localStorage.setItem(ALL_SESSION_KEY, sessionKeys.join(","));
    window.localStorage.setItem(
      `${ALL_SESSION_KEY}/${sessionKey}`,
      JSON.stringify(client.session)
    );
  };

  const recoverPersistedSessions = () => {
    const sessionKeys =
      window.localStorage.getItem(ALL_SESSION_KEY)?.split(",") || [];
    sessionKeys.forEach((sessionKey) => {
      const rawSession = window.localStorage.getItem(
        `${ALL_SESSION_KEY}/${sessionKey}`
      );
      if (!rawSession) {
        return;
      }
      const session = JSON.parse(rawSession);
      const client = new WalletConnect({ session });
      // @ts-ignore
      window.client = client;
      addClient(sessionKey, client);
    });
  };

  const removePersistedSession = (client: WalletConnect) => {
    const sessionKeys =
      window.localStorage.getItem(ALL_SESSION_KEY)?.split(",") || [];
    const index = sessionKeys.indexOf(client.session.peerId);
    if (index !== -1) {
      sessionKeys.splice(index, 1);
      window.localStorage.setItem(ALL_SESSION_KEY, sessionKeys.join(","));
    }
  };

  const addClient = (key: string, client: WalletConnect) => {
    const session = {
      key,
      client,
      requested: false,
      connected: client.session.connected,
    };
    client.on("session_request", (error, payload) => {
      if (error) {
        throw error;
      }
      updateSession(key, { requested: true });
    });

    client.on("connect", (error) => {
      if (error) {
        throw error;
      }
      updateSession(key, { connected: true });
      persistSession(client);
    });
    client.on("disconnect", (error) => {
      if (error) {
        throw error;
      }
      removeSession(session);
    });

    client.on("call_request", async (error, payload: IJsonRpcRequest) => {
      if (error) {
        throw error;
      }
      if (payload.method === "eth_sendTransaction") {
        const params = payload.params[0];
        const from = toChecksum(params.from);
        const to = toChecksum(params.to);
        const transaction = {
          from,
          to,
          data: params.data,
          value: params.value || 0,
        };
        addSignatureRequest({
          key: key + payload.id,
          requestId: payload.id,
          transaction,
          sessionKey: key,
          state: TransactionSignatureRequestState.AwaitUserAction,
          chainId,
        });

        const result = await parserRef.current.parseAsResult(transaction);
        updateSignatureRequest(key + payload.id, { noYoloResult: result });
      }
    });

    addSession(session);
  };

  useEffect(() => {
    recoverPersistedSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    Object.values(sessions).forEach((session) => {
      if (!session.client.connected) {
        return;
      }
      // @ts-ignore
      session.client.updateChain({ chainId: chainId });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId]);

  const initiate = async (uri: string) => {
    const key = uri;
    const client = new WalletConnect({
      uri,
      clientMeta: metadata,
    });
    addClient(key, client);
  };

  const approveSessionRequest = (key: string) => {
    const session = sessions[key];
    if (!session) {
      return;
    }
    if (!address) {
      return;
    }
    if (session.client.connected) {
      return;
    }
    session.client.approveSession({
      accounts: [address],
      chainId,
    });
  };

  const rejectSessionRequest = (key: string) => {
    const session = sessions[key];
    if (!session) {
      return;
    }

    session.client.rejectSession({
      message: "Rejected",
    });
    removeSession(session);
  };

  const disconnect = async (key: string) => {
    const session = sessions[key];
    if (!session) {
      return;
    }
    removePersistedSession(session.client);
    session.client.killSession();
  };

  const approveTransactionSignature = async (key: string) => {
    const request = signatureRequests[key];
    if (!request) {
      return;
    }
    if (!provider) {
      console.error("no provider");
      return;
    }
    if (!onboard) {
      return;
    }
    await onboard.walletCheck();
    const signer = provider.getSigner();
    updateSignatureRequest(key, {
      state: TransactionSignatureRequestState.SentToWallet,
    });
    const tx = await signer.sendTransaction(request.transaction);
    updateSignatureRequest(key, {
      state: TransactionSignatureRequestState.ReceivedWalletResponse,
      txHash: tx.hash,
    });
    const session = sessions[request.sessionKey];
    if (!session || !session.client.connected) {
      throw new Error("dapp connection is gone");
    }
    session.client.approveRequest({
      id: request.requestId,
      jsonrpc: "2.0",
      result: tx.hash,
    });
    updateSignatureRequest(key, {
      state: TransactionSignatureRequestState.SentToDapp,
    });

    await provider.waitForTransaction(tx.hash);
    updateSignatureRequest(key, {
      state: TransactionSignatureRequestState.Mined,
    });
  };

  const rejectTransactionSignature = (key: string) => {
    const request = signatureRequests[key];
    if (!request) {
      return;
    }
    const session = sessions[request.sessionKey];
    if (!request) {
      return;
    }
    if (!session.client.connected) {
      return;
    }
    session.client.rejectRequest({
      id: request.requestId,
      error: { message: "Transaction Signature denied" },
    });
    removeSignatureRequest(request);
  };

  return (
    <WalletConnectContext.Provider
      value={{
        sessions,
        initiate,
        approveSessionRequest,
        rejectSessionRequest,
        approveTransactionSignature,
        rejectTransactionSignature,
        disconnect,
        signatureRequests,
      }}
    >
      {children}
    </WalletConnectContext.Provider>
  );
};

export const useWalletConnect = () => useContext(WalletConnectContext);
