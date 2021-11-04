import './App.css';
import '@celo-tools/use-contractkit/lib/styles.css';
import { NetworkNames } from '@celo-tools/use-contractkit';
import { ContractKitProvider } from '@celo-tools/use-contractkit';
import Header from './components/Header';
import { Layout, Row } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { WalletConnectInput, WalletConnectSessionRequest, WalletConnectTransactionSignatureRequests } from './components/WalletConnect';
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
              <WalletConnectSessionRequest />
              <WalletConnectTransactionSignatureRequests />
            </Row>
          </div>
        </Content>
      </Layout>
    </WalletConnectContextProvider>
  </ContractKitProvider>

  );
}

export default App;
