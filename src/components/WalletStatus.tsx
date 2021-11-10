import { Card, Col, Select } from "antd";
import { useOnboard } from "../hooks/use-onboard";

const { Option } = Select

export default function WalletStatus() {
  const { address, selectWallet, chainId, changeNetwork } = useOnboard();

  const network = (
    <p>
      <h5>Network</h5>
      <Select defaultValue={chainId} onChange={changeNetwork}>
        <Option value={1}>Ethereum Mainnet</Option>
        <Option value={42220}>Celo Mainnet</Option>
      </Select>
    </p>
  )
  if (!address) {
    return (
      <Col md={12} sm={24}>
        <Card title="Wallet Status">
          <p>Not logged in. <a href='#' onClick={selectWallet}>Connect wallet</a></p>
          {network}
        </Card>
      </Col>
    )
  }

  return (
    <Col md={12} sm={24}>
      <Card title="Wallet Status" extra={<a href="#">More</a>}>
        <p><b>Address:</b> {address}</p>
        {network}
      </Card>
    </Col>

  )
}