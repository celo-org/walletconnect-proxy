import { createContext, FC, useContext } from "react";
import WalletConnect from "@walletconnect/client";
import { useContractKit } from "@celo-tools/use-contractkit";
import useKeyState from "./use-topic-array";
import { celoAbiFetchers, celoAddressInfoFetchers, Parser, ParserResult, Transaction } from "no-yolo-signatures";
import { utils } from "ethers";
import { IJsonRpcRequest } from "@walletconnect/types";

interface Session {
  key: string,
  client: WalletConnect,
  requested: boolean,
  connected: boolean
}

interface Sessions {
  [key: string]: Session
}


type WalletConnectContextProps = {
  sessions: Sessions,
  initiate: (uri: string) => void,
  approveSessionRequest: (key: string) => void,
  rejectSessionRequest: (key: string) => void,
  disconnect: (key: string) => void,
  signatureRequests: TransactionSignatureRequests
}

const WalletConnectContext = createContext<WalletConnectContextProps>({
  sessions: {},
  initiate: () => {},
  approveSessionRequest: () => {},
  rejectSessionRequest: () => {},
  disconnect: () => {},
  signatureRequests: {}
})

const metadata = {
  name: "Test Wallet",
  description: "Test Wallet",
  url: "https://celo.org",
  icons: ["https://walletconnect.com/walletconnect-logo.png"]
}

interface TransactionSignatureRequest {
  key: string,
  transaction: Transaction,
  sessionKey: string,
  noYoloResult?: ParserResult
}

interface TransactionSignatureRequests {
  [key: string]: TransactionSignatureRequest
}

const toChecksum = utils.getAddress

export const WalletConnectContextProvider: FC = ({ children }) => {
  const [sessions, addSession, removeSession, updateSession] = useKeyState<Session>()
  const [signatureRequests, addSignatureRequest,, updateSignatureRequest] = useKeyState<TransactionSignatureRequest>()
  const { address } = useContractKit()
  const initiate = async (uri: string) => {
    const key = uri
    const client = new WalletConnect({
      uri,
      clientMeta: metadata
    })
    const session = {
      key,
      client,
      requested: false,
      connected: false
    }

    client.on("session_request", (error, payload) => {
      if (error) {
        throw error
      }
      updateSession(key, { requested: true })
    })

    client.on("connect", (error) => {
      if (error) { throw error }
      console.log('connected')
      updateSession(key, { connected: true })
    })
    client.on("disconnect", (error) => {
      if (error) { throw error}
      removeSession(session)
    })

    client.on("call_request", (error, payload: IJsonRpcRequest) => {
      if (error) { throw error }
      if (payload.method === 'eth_sendTransaction') {
        const params = payload.params[0]
        const from = toChecksum(params.from)
        const to = toChecksum(params.to)
        const transaction = {
          from,
          to,
          data: params.data,
          value: params.value || 0
        }
        addSignatureRequest({
          key: key + payload.id,
          transaction,
          sessionKey: key
        })

        const parser = new Parser({abiFetchers: celoAbiFetchers, addressInfoFetchers: celoAddressInfoFetchers})
        parser.parseAsResult(transaction).then(result => {
          updateSignatureRequest(key + payload.id, { noYoloResult: result })
        }).catch(console.error)

      }

    })

    addSession(session)
  }

  const approveSessionRequest = (key: string) => {
    const session = sessions[key]
    if (!session) { return }
    if (!address) { return }
    if (session.client.connected) { return }
    session.client.approveSession({
      accounts: [address],
      chainId: 42220
    })
    console.log('approved')
  }

  const rejectSessionRequest = (key: string) => {
    const session = sessions[key]
    if (!session) { return }
    
    session.client.rejectSession({
      message: "Rejected"
    })
    removeSession(session)
  }

  const disconnect = async (key: string) => {
    const session = sessions[key]
    if (!session) { return }
    session.client.killSession()
  }

  return (
    <WalletConnectContext.Provider value={{
      sessions,
      initiate,
      approveSessionRequest,
      rejectSessionRequest,
      disconnect,
      signatureRequests,
    }}>
      { children }
    </WalletConnectContext.Provider>
  )
}

export const useWalletConnect = () => useContext(WalletConnectContext)