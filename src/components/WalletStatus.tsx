import { useContractKit } from "@celo-tools/use-contractkit";
import { Card, Col } from "antd";



export default function WalletStatus() {
  const { address, network, connect, walletType } = useContractKit();

  if (!address) {
    return (
      <Card title="Wallet Status">
        <p>Not logged in. <a href='#' onClick={connect}>Connect wallet</a></p>
      </Card>
    )
  }

  return (
    <Col span={8}>
      <Card title="Wallet Status" extra={<a href="#">More</a>}>
        <p><b>Wallet Type:</b> {walletType}</p>
        <p><b>Address:</b> {address}</p>
        <p><b>Network:</b> {network.name}</p>
      </Card>
    </Col>

  )
}