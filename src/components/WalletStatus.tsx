import { Card, Col } from "antd";
import { useOnboard } from "../hooks/use-onboard";



export default function WalletStatus() {
  const { address, selectWallet } = useOnboard();

  if (!address) {
    return (
      <Card title="Wallet Status">
        <p>Not logged in. <a href='#' onClick={selectWallet}>Connect wallet</a></p>
      </Card>
    )
  }

  return (
    <Col span={8}>
      <Card title="Wallet Status" extra={<a href="#">More</a>}>
        <p><b>Address:</b> {address}</p>
      </Card>
    </Col>

  )
}