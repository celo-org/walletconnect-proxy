import { Card, Col, Descriptions, Select } from "antd";
import { useOnboard } from "../hooks/use-onboard";
import { NETWORKS } from "no-yolo-signatures";

const { Option } = Select;

export default function WalletStatus() {
  const { address, selectWallet, chainId, changeNetwork } = useOnboard();

  const network = (
    <Descriptions.Item label="Network" span={24}>
      <Select defaultValue={chainId} onChange={changeNetwork}>
        {Object.values(NETWORKS).map((network) => (
          <Option value={network.chainId}>{network.name}</Option>
        ))}
      </Select>
    </Descriptions.Item>
  );
  if (!address) {
    return (
      <Col md={12} sm={24}>
        <Card title="Wallet Status">
          <p>
            Not logged in.{" "}
            <a href="#" onClick={selectWallet}>
              Connect wallet
            </a>
          </p>
          {network}
        </Card>
      </Col>
    );
  }

  return (
    <Col md={12} sm={24}>
      <Card title="Wallet Status">
        <Descriptions bordered>
          <Descriptions.Item label="Address" span={24}>
            {address}
          </Descriptions.Item>
          {network}
        </Descriptions>
      </Card>
    </Col>
  );
}
