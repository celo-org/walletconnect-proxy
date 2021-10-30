import { createContext, FC, useContext, useEffect, useState } from "react";
import WalletConnectClient, { CLIENT_EVENTS } from "@walletconnect/client";
import { SessionTypes } from "@walletconnect/types";
import { useContractKit } from "@celo-tools/use-contractkit";
import useTopicArray from "./use-topic-array";
import { JsonRpcRequest } from "@walletconnect/jsonrpc-utils";
import KeyValueStorage from "keyvaluestorage";
import { celoAbiFetchers, celoAddressInfoFetchers, Parser, ParserResult, Transaction, TransactionDescription } from "no-yolo-signatures";
import { utils } from "ethers";
type WalletConnectContextProps = {
  client: WalletConnectClient | undefined,
  initiate: (uri: string) => void,
  approveProposal: (proposal: SessionTypes.Proposal) => void,
  rejectProposal: (proposal: SessionTypes.Proposal) => void,
  disconnect: (session: SessionTypes.Settled) => void,
  pendingProposals: Array<SessionTypes.Proposal>,
  sessions: Array<SessionTypes.Created>,
  signatureRequests: Array<TransactionSignatureRequest>
}

const WalletConnectContext = createContext<WalletConnectContextProps>({
  client: undefined,
  initiate: () => {},
  approveProposal: () => {},
  rejectProposal: () => {},
  disconnect: () => {},
  pendingProposals: [],
  sessions: [],
  signatureRequests: []
})

const metadata = {
  name: "Test Wallet",
  description: "Test Wallet",
  url: "https://celo.org",
  icons: ["https://walletconnect.com/walletconnect-logo.png"]
}

interface TransactionSignatureRequest {
  topic: string
  rawRequest: Transaction,
  sessionTopic: string,
  chainId: string,
  noYoloResult?: ParserResult
}

const toChecksum = utils.getAddress

export const WalletConnectContextProvider: FC = ({ children }) => {
  const [client, setClient] = useState<WalletConnectClient | undefined>(undefined)
  // @ts-ignore
  window.client = client
  const [pendingProposals, addPendingProposal, removePendingProposal] = useTopicArray<SessionTypes.Proposal>()
  const [sessions, addSession, removeSession] = useTopicArray<SessionTypes.Created>()
  const [signatureRequests, addSignatureRequest, removeSignatureRequest, updateSignatureRequest] = useTopicArray<TransactionSignatureRequest>()
  const { address } = useContractKit()
  const storage = new KeyValueStorage()
  useEffect(() => {
    WalletConnectClient.init({
      controller: true,
      relayProvider: "wss://relay.walletconnect.org",
      metadata,
      storage
    }).then(client => {
      // Populate state from possibly persisted sessions
      client.session.values.forEach(session => addSession(session))
      client.on(CLIENT_EVENTS.session.proposal, async (proposal: SessionTypes.Proposal) => {
        addPendingProposal(proposal)
      })
      client.on(CLIENT_EVENTS.session.created, async (session: SessionTypes.Created) => {
        addSession(session)
      })
      setClient(client)

      client.on(CLIENT_EVENTS.session.request, async (request: SessionTypes.RequestEvent) => {
        if (request.request.method === "eth_signTransaction") {
          const rawRequest = {
            from: toChecksum(request.request.params.from),
            to: toChecksum(request.request.params.to),
            data: request.request.params.data,
            value: request.request.params.value
          }
    
          addSignatureRequest({ topic: `${request.topic}:${request.request.id}`, rawRequest, sessionTopic: request.topic, chainId: request.chainId! })

          const parser = new Parser({abiFetchers: celoAbiFetchers, addressInfoFetchers: celoAddressInfoFetchers})
          const result = await parser.parseAsResult(rawRequest)
          if (result.transactionDescription.ok) {
            updateSignatureRequest(`${request.topic}:${request.request.id}`, { noYoloResult: result})

          }
        }
      })
    }).catch(error => {
      console.error('WCClient init error', error)
    });
  }, [])

  const initiate = async (uri: string) => {
    if (!client) {
      return
    }

    await client.pair({ uri })
  }

  const approveProposal = async (proposal: SessionTypes.Proposal) => {
    if (!client) {
      return
    }

    if (!address) {
      return
    }

    const response: SessionTypes.ResponseInput = {
      state: {
        accounts: [`eip155:42220:${address}`],
      },
      metadata
    };

    await client.approve({ proposal, response })
    removePendingProposal(proposal)
  }

  const rejectProposal = async (proposal: SessionTypes.Proposal) => {
    if (!client) {
      return
    }

    await client.reject({ proposal })
    removePendingProposal(proposal)
  }

  const disconnect = async (session: SessionTypes.Settled) => {
    if (!client) return
    await client.disconnect({ topic: session.topic, reason: { code: 1, message: "User disconnect"}} )
    removeSession(session)
  }

  return (
    <WalletConnectContext.Provider value={{
      client,
      initiate,
      approveProposal,
      rejectProposal,
      disconnect,
      pendingProposals,
      sessions,
      signatureRequests
    }}>
      { children }
    </WalletConnectContext.Provider>
  )
}

export const useWalletConnect = () => useContext(WalletConnectContext)