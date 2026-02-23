import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import Activity from "./pages/Activity"
import Alerts from "./pages/Alerts"
import Profile from "./pages/Profile"
import Settings from "./pages/Settings"
import Upload from "./pages/Upload"
import Login from "./pages/auth/Login"
import SignUp from "./pages/auth/SignUp"
import StreamDetails from "./pages/StreamDetails"
import ChannelDetails from "./pages/ChannelDetails"
import { Layout } from "./components/layout"

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/stream/:id" element={<StreamDetails />} />
        <Route path="/channel/:id" element={<ChannelDetails />} />
      </Route>

      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/sign-up" element={<SignUp />} />
    </Routes>
  )
}

export default App
