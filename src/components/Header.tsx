import { Button, Col, Layout, Menu, Row } from "antd";
import { useOnboard } from "../hooks/use-onboard";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const { address, selectWallet, disconnectWallet } = useOnboard();
  const text = !!address ? `Log out` : "Connect wallet";
  const toggleLogin = !!address ? disconnectWallet : selectWallet;
  const location = useLocation();
  return (
    <Layout.Header title="WalletConnect Proxy">
      <Row>
        <Col flex="none">
          <h1 style={{ color: "white", marginRight: "20px" }}>
            WalletConnect Proxy
          </h1>
        </Col>
        <Col flex="auto">
          <Menu
            mode="horizontal"
            theme="dark"
            selectedKeys={[location.pathname]}
          >
            <Menu.Item key="/">
              <Link to="/">Home</Link>
            </Menu.Item>
            <Menu.Item key="/settings">
              <Link to="/settings">Parser Settings</Link>
            </Menu.Item>
          </Menu>
        </Col>
        <Col flex="0 1 100px">
          <Button key="1" type="primary" onClick={toggleLogin}>
            {text}
          </Button>
          ,
        </Col>
      </Row>
    </Layout.Header>
  );
}
