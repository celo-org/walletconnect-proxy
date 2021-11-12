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
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ParserSettings from "./components/ParserSettings";
import { NoYoloContextProvider } from "./hooks/use-no-yolo-parser";
function App() {
  return (
    <OnboardContextProvider>
      <NoYoloContextProvider>
        <WalletConnectContextProvider>
          <BrowserRouter>
            <Layout>
              <Header />
              <Content style={{ padding: "0 25px", minHeight: "280px" }}>
                <div className="site-layout-content">
                  <Routes>
                    <Route
                      path="/"
                      element={
                        <Row gutter={16}>
                          <WalletStatus />
                          <WalletConnectSection />
                          <WalletConnectTransactionSignatureRequests />
                        </Row>
                      }
                    />
                    <Route path="/settings" element={<ParserSettings />} />
                  </Routes>
                </div>
              </Content>
            </Layout>
          </BrowserRouter>
        </WalletConnectContextProvider>
      </NoYoloContextProvider>
    </OnboardContextProvider>
  );
}

export default App;
