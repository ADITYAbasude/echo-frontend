import Layout from "./layout/Layout";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import HomePage from "./pages/common/HomePage";
import StudioPage from "./pages/studio/StudioPage";
import UploadVideo from "./pages/studio/UploadVideo";
import Verify from "./pages/studio/Verify";
import CompleteAccount from "./pages/studio/CompleteAccount";
import LoginPage from "./pages/common/LoginPage";
import BroadcastPage from "./pages/common/BroadcastPage";
import VideoPage from "./pages/common/VideoPage";
import { HelmetProvider } from 'react-helmet-async';
import Settings from './pages/common/SettingsPage';
import Collection from "./pages/common/CollectionPage";
import GoLivePage from "./pages/studio/GoLivePage";

function App() {
  return (
    <HelmetProvider>
      <div className="dark select-none">
        <Router>
          <Layout>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/">
                <Route path="/" element={<HomePage />} />
                <Route path=":broadcastName" element={<BroadcastPage />} />
                <Route path="content/:contentID" element={<VideoPage />} />
              </Route>
              <Route path="/studio">
                <Route path="complete-account" element={<CompleteAccount />} />
                <Route path=":broadcastName" element={<StudioPage />} />
                <Route path=":broadcastName/create" element={<UploadVideo />} />
                <Route path=":broadcastName/live" element={<GoLivePage />} />
                <Route path="verify" element={<Verify />} />
              </Route>
              <Route path="/settings" element={<Settings />} />
              <Route path="/collection" element={<Collection />} />
            </Routes>
          </Layout>
        </Router>
      </div>
    </HelmetProvider>
  );
}

export default App;
