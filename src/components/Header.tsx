import { Button, PageHeader } from "antd";
import { useOnboard } from "../hooks/use-onboard";

export default function Header() {
    const { address, selectWallet, disconnectWallet } = useOnboard()
    const text = !!address ? `Log out` : "Connect wallet"
    const toggleLogin = !!address ? disconnectWallet : selectWallet
    return <PageHeader
    ghost={false}
    title="WalletConnect Proxy"
    subTitle="This is a subtitle"
    extra={[
      <Button key="1" type="primary" onClick={toggleLogin}>
        {text}
      </Button>,
    ]}
  >
  </PageHeader>
}