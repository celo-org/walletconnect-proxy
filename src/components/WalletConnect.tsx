import {
  Alfajores,
  Baklava,
  Mainnet,
} from "@celo-tools/use-contractkit";
import { Address } from "@celo/contractkit";
import { Badge, Button, Card, Col, Descriptions, Input, Popover, Typography } from "antd";
import DescriptionsItem from "antd/lib/descriptions/Item";
import { AddressFetchResult, AddressInfo, AddressInfoType, ParserResult, TransactionDescription } from "no-yolo-signatures";
import { ParamType } from "no-yolo-signatures/node_modules/@ethersproject/abi";
import { disconnect } from "process";
import { parse } from "querystring";
import { useState } from "react";
import { useWalletConnect } from "../hooks/use-walletconnect";
const { Paragraph } = Typography

const networks = [Alfajores, Baklava, Mainnet];

const matchToNetwork = (caipId: string) => {
  const [prefix, chainId] = caipId.split(":")
  if (prefix !== 'eip155') return undefined
  return networks.find(n => n.chainId.toString() === chainId)
}

export function WalletConnectInput() {
  const { initiate } = useWalletConnect()
  const [secret, setSecret] = useState('')
  return <Col span={8}><Card title="WalletConnect Status">
    <Typography>
      <Paragraph>
        Hello. Input your WC secret
      </Paragraph>
      <Input value={secret} onChange={(evt) => setSecret(evt.target.value)} />
      <Button onClick={() => { initiate(secret) }}>Start</Button>
    </Typography>
  </Card>
  </Col>
}

export function WalletConnectProposals() {
  const { pendingProposals, approveProposal, rejectProposal } = useWalletConnect()
  const props = pendingProposals.map(proposal => {
    const networksRequested = proposal.permissions.blockchain.chains.map(_ => matchToNetwork(_))

    return (
      <Col span={8} key={proposal.topic}>
        <Card title="WalletConnect Connection Proposal">
          <h3>New Request</h3>
          <p><b>Name:</b> <a href={proposal.proposer.metadata.url}>{proposal.proposer.metadata.name}</a></p>
          <p><b>Description:</b> {proposal.proposer.metadata.description}</p>
          <p><b>Chains Requested:</b> {networksRequested.map(_ => _ ? _.name : '').join(', ')}</p>
          <p><b>Methods Requested:</b> {proposal.permissions.jsonrpc.methods.join(', ')}</p>
          <Button type="primary" onClick={() => approveProposal(proposal)} >Approve</Button>
          <Button danger onClick={() => rejectProposal(proposal)} >Reject</Button>
        </Card>
      </Col>
    )
  })

  return (<>
    {props}
  </>)
}

export function WalletConnectSessions() {
  const { client, disconnect, sessions } = useWalletConnect()
  if (!client) {
    return null
  }
  const ret = sessions.map(session => {
    const networksRequested = session.permissions.blockchain.chains.map(_ => matchToNetwork(_))
    return (
      <Col span={8} key={session.topic}>
        <Card title="Session">
          <p><b>Name:</b> <a href={session.peer.metadata.url}>{session.peer.metadata.name}</a></p>
          <p><b>Description:</b> {session.peer.metadata.description}</p>
          <p><b>Chains Requested:</b> {networksRequested.map(_ => _ ? _.name : '').join(', ')}</p>
          <p><b>Methods Requested:</b> {session.permissions.jsonrpc.methods.join(', ')}</p>
          <Button danger onClick={() => disconnect(session)}>Disconnect</Button>
        </Card>
      </Col>
    )
  })
  return (<>
    {ret}
  </>)
}

function AddressInfoC(props: { info: AddressInfo }) {
  switch (props.info.type) {
    case AddressInfoType.GenericAddressInfo:
      return (
        <Descriptions title="Generic">
          <Descriptions.Item label="Name">{props.info.name}</Descriptions.Item>
          <Descriptions.Item label="Description">{props.info.description}</Descriptions.Item>
        </Descriptions>
      )
    case AddressInfoType.TokenListInfo:
      return (
        <Descriptions title="TokenList">
          <Descriptions.Item label="Name">{props.info.name}</Descriptions.Item>
          <Descriptions.Item label="Symbol">{props.info.symbol}</Descriptions.Item>
        </Descriptions>
      )
    default:
      break;
  }
  return null
}

function AddressDescriptionValue(props: { address: Address, addressInfo: AddressFetchResult }) {
  const addyInfo = props.addressInfo[props.address]
  if (!addyInfo) {
    return <>{props.address}</>
  }

  // @ts-ignore
  const name = addyInfo[0] && addyInfo[0].name ? addyInfo[0]?.name :  props.address


  return (
    <Popover title="Address Info" content={<>
      <Descriptions title="Raw">
        <Descriptions.Item>{props.address}</Descriptions.Item>
      </Descriptions>
      {addyInfo.map((info, index) => <AddressInfoC info={info} key={index} />)}
    </>}>
      <Badge color='blue' dot>
        <a href='#'>{name}</a>
      </Badge>
    </Popover>
  )
  
}

function ParsedTransaction(props:{ to: Address, result: ParserResult | undefined }) {
  if (!props.result) {
    return null
  }
  if (!props.result.transactionDescription.ok) {
    return null
  }

  const transactionDescription = props.result.transactionDescription.result

  const parsedArgs = transactionDescription.args.map((arg, index) => {
    const fragment = transactionDescription.functionFragment.inputs[index]
    let value = arg.toString()
    if (fragment.type === 'address') {
      const addressInfo = props.result?.addressInfo[arg]
      if (addressInfo) {
       value = <AddressDescriptionValue address={arg} addressInfo={props.result?.addressInfo!} />
      }

    }
    return (
      <Descriptions.Item label={fragment.name} key={index}>
        {value}
      </Descriptions.Item>
    )
  })
  return (
    <Descriptions title="Parsed" bordered>
      <Descriptions.Item label="To">
        <AddressDescriptionValue address={props.to} addressInfo={props.result.addressInfo} />
        </Descriptions.Item>
      <Descriptions.Item label="Function" span={3}>{transactionDescription.name}({transactionDescription.functionFragment.inputs.map(_ => _.name).join(', ')})</Descriptions.Item>
      {parsedArgs}
    </Descriptions>
  )

}
export function WalletConnectTransactionSignatureRequests() {
  const { client, signatureRequests, sessions } = useWalletConnect()
  if (!client) {
    return null
  }
  const ret = signatureRequests.map(request => {
    const session = sessions.find(_ => _.topic === request.sessionTopic)
    if (!session) { return null }

    return <Col span={24} key={session.topic}>
      <Card title="Transaction Signature Request">
        <p>Dapp <a href={session.peer.metadata.url}>{session.peer.metadata.name}</a> requests signature:</p>
        <Descriptions title="Transaction" bordered>
          <Descriptions.Item label="From">{request.rawRequest.from}</Descriptions.Item>
          <Descriptions.Item label="To">{request.rawRequest.to}</Descriptions.Item>
          <Descriptions.Item label="Data" span={2}>{request.rawRequest.data}</Descriptions.Item>
        </Descriptions>

        <ParsedTransaction result={request.noYoloResult} to={request.rawRequest.to} />
      </Card>
    </Col>
  })
  return (<>
    {ret}
  </>)
}
