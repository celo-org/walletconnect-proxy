import { useContractKit } from "@celo-tools/use-contractkit";
import { Button, PageHeader } from "antd";

export default function Header() {
    const { account, connect, destroy } = useContractKit()
    const text = !!account ? `Log out` : "Connect wallet"
    const toggleLogin = !!account ? destroy : connect
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