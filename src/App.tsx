import './App.css';
import '@celo-tools/use-contractkit/lib/styles.css';
import { NetworkNames, useContractKit } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import Header from './components/Header';
import { Badge, Card, Col, Descriptions, Layout, Popover, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { WalletConnectInput, WalletConnectProposals, WalletConnectSessions, WalletConnectTransactionSignatureRequests } from './components/WalletConnect';
import { WalletConnectContextProvider } from './hooks/use-walletconnect';
import WalletStatus from './components/WalletStatus';

function App() {
  return (<ContractKitProvider
    dapp={{
      name: 'My awesome dApp',
      description: 'My awesome description',
      url: 'https://example.com',
      icon: "test"
    }}

    network={{
      name: NetworkNames.Alfajores,
      rpcUrl: 'https://alfajores-forno.celo-testnet.org',
      graphQl: 'https://alfajores-blockscout.celo-testnet.org/graphiql',
      explorer: 'https://alfajores-blockscout.celo-testnet.org',
      chainId: 44787,
    }}

    connectModal={{
      denylist: []
    }}
  >
    <WalletConnectContextProvider>
      <Layout>
        <Header />
        <Content style={{ padding: '0 50px', minHeight: '280px' }}>
          <div className="site-layout-content">
            <Row gutter={16}>
              <WalletStatus />
              <WalletConnectInput />
              <WalletConnectProposals />
              <WalletConnectSessions />
              <WalletConnectTransactionSignatureRequests />
              <Col span={24}>
                <Card title="Test">
                  <Descriptions title="Transaction" bordered>
                    <Descriptions.Item label="From">0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121</Descriptions.Item>
                    <Descriptions.Item label="To">0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121</Descriptions.Item>
                    <Descriptions.Item label="Gas">0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121</Descriptions.Item>
                    <Descriptions.Item label="Data" span={2}>0x38ed17390000000000000000000000000000000000000000000000000b666984893140000000000000000000000000000000000000000000000000000000c23c4697303f00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000747c688444661fc5b59af8b9cb8a2da0034bf5c400000000000000000000000000000000000000000000000000000000617c6c090000000000000000000000000000000000000000000000000000000000000003000000000000000000000000d8763cba276a3738e6de85b4b3bf5fded6d6ca73000000000000000000000000471ece3750da237f93b8e339c536989b8978a438000000000000000000000000e919f65739c26a42616b7b8eedc6b5524d1e3ac4</Descriptions.Item>
                  </Descriptions>
                  <Descriptions title="Parsed" bordered>
                    <Descriptions.Item label="Function" span={24}>increaseAllowance(spender, value)</Descriptions.Item>
                    <Descriptions.Item label="spender">
                      <Popover content={"test"} title="Spender Info">
                        <Badge dot color='blue'>


                        <a href='#'>Mento cUSD Exchange</a>
                        </Badge>
                      </Popover>

                    </Descriptions.Item>
                    <Descriptions.Item label="value">30000000000</Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>

            </Row>
          </div>
        </Content>
      </Layout>
    </WalletConnectContextProvider>
  </ContractKitProvider>

  );
}

export default App;
