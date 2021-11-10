import "./App.css";
import Header from "./components/Header";
import { Layout, Row } from "antd";
import { Content } from "antd/lib/layout/layout";
import {
  WalletConnectSection,
  WalletConnectTransactionSignatureRequests,
} from "./components/WalletConnect";
import { WalletConnectContextProvider } from "./hooks/use-walletconnect";
import WalletStatus from "./components/WalletStatus";
import { OnboardContextProvider } from "./hooks/use-onboard";

function App() {
  return (
    <OnboardContextProvider>
      <WalletConnectContextProvider>
        <Layout>
          <Header />
          <Content style={{ padding: "0 50px", minHeight: "280px" }}>
            <div className="site-layout-content">
              <Row gutter={16}>
                <WalletStatus />
                <WalletConnectSection />
                <WalletConnectTransactionSignatureRequests />
              </Row>
            </div>
          </Content>
        </Layout>
      </WalletConnectContextProvider>
    </OnboardContextProvider>
  );
}

export default App;
