import {
  Badge,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Input,
  Popover,
  Typography,
} from "antd";
import {
  Address,
  AddressFetchResult,
  AddressInfo,
  AddressInfoType,
  ParserResult,
} from "no-yolo-signatures";
import { useState } from "react";
import { TransactionSignatureRequestState, useWalletConnect } from "../hooks/use-walletconnect";
import { ParamType } from "@ethersproject/abi";

export function WalletConnectSessionRequest() {
  const { disconnect, sessions, approveSessionRequest, rejectSessionRequest } =
    useWalletConnect();
  const ret = Object.values(sessions).map((session) => {
    if (!session) {
      return (
        <Col span={8} key="sessionless client">
          <Card title="Session">Initializing</Card>
        </Col>
      );
    }

    const buttons = [];

    if (!session.connected) {
      buttons.push(
        <Button
          type="primary"
          key="approve"
          onClick={() => approveSessionRequest(session.key)}
        >
          Approve
        </Button>,
        <Button
          danger
          key="reject"
          onClick={() => rejectSessionRequest(session.key)}
        >
          Reject
        </Button>
      );
    }

    if (session.connected) {
      buttons.push(
        <Button danger onClick={() => disconnect(session.key)} key="disconnect">
          Disconnect
        </Button>
      );
    }

    return (
      <Collapse.Panel
        header={`Session: ${session.client.peerMeta?.name}`}
        key={session.key + "sessionRequest"}
      >
        <p>
          <b>Name:</b>{" "}
          <a href={session.client.peerMeta?.url}>
            {session.client.peerMeta?.name}
          </a>
        </p>
        <p>
          <b>Description:</b> {session.client.peerMeta?.description}
        </p>
        {buttons}
      </Collapse.Panel>
    );
  });

  return <Collapse activeKey={ret.map((_) => _.key as string)}>{ret}</Collapse>;
}

function AddressInfoC(props: { info: AddressInfo }) {
  switch (props.info.type) {
    case AddressInfoType.GenericAddressInfo:
      return (
        <Descriptions title="Generic">
          <Descriptions.Item label="Name">{props.info.name}</Descriptions.Item>
          <Descriptions.Item label="Description">
            {props.info.description}
          </Descriptions.Item>
        </Descriptions>
      );
    case AddressInfoType.TokenListInfo:
      return (
        <Descriptions title="TokenList">
          <Descriptions.Item label="Name">{props.info.name}</Descriptions.Item>
          <Descriptions.Item label="Symbol">
            {props.info.symbol}
          </Descriptions.Item>
        </Descriptions>
      );
    case AddressInfoType.ContextInfo:
      return (
        <Descriptions title="Context">
          <Descriptions.Item label="Context type">
            {props.info.contextType}
          </Descriptions.Item>
        </Descriptions>
      );
    default:
      break;
  }
  return null;
}

function AddressDescriptionValue(props: {
  address: Address;
  addressInfo: AddressFetchResult;
}) {
  const addyInfo = props.addressInfo[props.address];
  if (!addyInfo) {
    return <>{props.address}</>;
  }

  let name = props.address;

  if (addyInfo[0]) {
    switch (addyInfo[0].type) {
      case AddressInfoType.TokenListInfo:
        name = `Token: ${addyInfo[0].name} (${addyInfo[0].symbol})`;
        break;

      case AddressInfoType.GenericAddressInfo:
        name = addyInfo[0].name;
        break;
      default:
        break;
    }
  }

  return (
    <Popover
      title="Address Info"
      content={
        <>
          <Descriptions title="Raw">
            <Descriptions.Item>{props.address}</Descriptions.Item>
          </Descriptions>
          {addyInfo.map((info, index) => (
            <AddressInfoC info={info} key={index} />
          ))}
        </>
      }
    >
      <Badge color="blue" dot>
        <a href="#">{name}</a>
      </Badge>
    </Popover>
  );
}

function FunctionParameterValue(props: {
  arg: any;
  fragment: ParamType;
  result: ParserResult | undefined;
}) {
  if (props.fragment.type === "address") {
    const addressInfo = props.result?.addressInfo[props.arg];
    if (addressInfo) {
      return (
        <AddressDescriptionValue
          address={props.arg}
          addressInfo={props.result?.addressInfo!}
        />
      );
    }
  }
  if (props.fragment.arrayChildren) {
    const style = { marginLeft: "4px", marginRight: "4px" };
    const arr = props.arg.flatMap((val: any, index: number) => [
      <FunctionParameterValue
        key={index}
        arg={val}
        fragment={props.fragment.arrayChildren}
        result={props.result}
      />,
      <span key={`span${index}`} style={style}>
        ,
      </span>,
    ]);
    arr.splice(arr.length - 1, 1);
    return (
      <>
        <span style={style}>[</span>
        {arr}
        <span style={style}>]</span>
      </>
    );
  }
  return props.arg.toString();
}

function ParsedTransaction(props: {
  to: Address;
  result: ParserResult | undefined;
}) {
  if (!props.result) {
    return null;
  }
  if (!props.result.transactionDescription.ok) {
    return <p>Couldn't decode transaction</p>;
  }

  const transactionDescription = props.result.transactionDescription.result;

  const parsedArgs = transactionDescription.args.map((arg, index) => {
    const fragment = transactionDescription.functionFragment.inputs[index];
    return (
      <Descriptions.Item label={fragment.name} key={index} span={24}>
        <FunctionParameterValue
          arg={arg}
          fragment={fragment}
          result={props.result}
        />
      </Descriptions.Item>
    );
  });
  return (
    <Descriptions title="Parsed" bordered>
      <Descriptions.Item label="To" span={24}>
        <AddressDescriptionValue
          address={props.to}
          addressInfo={props.result.addressInfo}
        />
      </Descriptions.Item>
      <Descriptions.Item label="Function" span={24}>
        {transactionDescription.name}(
        {transactionDescription.functionFragment.inputs
          .map((_) => _.name)
          .join(", ")}
        )
      </Descriptions.Item>
      {parsedArgs}
    </Descriptions>
  );
}

export function WalletConnectSection() {
  const { initiate } = useWalletConnect();
  const [secret, setSecret] = useState("");
  return (
    <Col md={12} sm={24}>
      <Card title="WalletConnect">
        <Input.Group>
          <Input.Search
            value={secret}
            onChange={(evt) => setSecret(evt.target.value)}
            onSearch={(value) => {
              initiate(value);
              setSecret("");
            }}
            enterButton="Connect"
            placeholder="Paste the WC URI here"
          />
        </Input.Group>
        <Divider />
        <WalletConnectSessionRequest />
      </Card>
    </Col>
  );
}

export function WalletConnectTransactionSignatureRequests() {
  const { signatureRequests, approveTransactionSignature, rejectTransactionSignature } = useWalletConnect();
  const empty = Object.keys(signatureRequests).length === 0 ? <p>No signature requests</p> : null
  const ret = Object.values(signatureRequests).map((request) => {
    const action = request.state === TransactionSignatureRequestState.AwaitUserAction ? (<>
      <Button onClick={() => approveTransactionSignature(request.key)} type={"primary"}>Approve</Button>
      <Button onClick={() => rejectTransactionSignature(request.key)} danger>Reject</Button>
    </>) : null
    let state = null
    switch (request.state) {
      case TransactionSignatureRequestState.Mined:
        state = <p>Mined: {request.txHash}</p>
        break;
    
      default:
        state = request.state
        break;
    }
    return (
      <Collapse.Panel
        header={`Request to ${request.transaction.to}`}
        key={request.key}
      >
        <p>Dapp requests signature:</p>
        <Descriptions title="Transaction" bordered>
          <Descriptions.Item label="Status" span={24}>
            {state}
          </Descriptions.Item>
          <Descriptions.Item label="From" span={24}>
            {request.transaction.from}
          </Descriptions.Item>
          <Descriptions.Item label="To" span={24}>
            {request.transaction.to}
          </Descriptions.Item>
          <Descriptions.Item label="Data" span={24}>
            {request.transaction.data}
          </Descriptions.Item>
        </Descriptions>
        <Divider />

        <ParsedTransaction
          result={request.noYoloResult}
          to={request.transaction.to}
        />
        <Divider />
        { action }
      </Collapse.Panel>
    );
  });
  return (
    <Col span={24}>
      <Card title="Transaction Requests">
        { empty }
        <Collapse activeKey={ret.map((_) => _.key as string)}>{ret}</Collapse>
      </Card>
    </Col>
  );
}
