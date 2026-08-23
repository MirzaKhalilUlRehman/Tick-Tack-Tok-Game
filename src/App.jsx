import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import ProfileSetup from './pages/ProfileSetup';
import Home from './pages/Home';
import CreateRoom from './pages/CreateRoom';
import JoinRoom from './pages/JoinRoom';
import RoomPage from './pages/RoomPage';
import LudoLobby from './pages/LudoLobby';
import LudoGamePage from './pages/LudoGame';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import ConversationPage from './pages/ConversationPage';
import SearchPlayers from './pages/SearchPlayers';
import InstallAppPrompt from './components/common/InstallAppPrompt';
import NetworkStatusBar from './components/common/NetworkStatusBar';
import PWAUpdateNotification from './components/common/PWAUpdateNotification';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { profile, loading, createProfile, updateProfile, logout, hasProfile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <h2 className="text-base font-bold text-white font-display">Loading KM...</h2>
      </div>
    );
  }

  return (
    <Router>
      <NetworkStatusBar />
      <InstallAppPrompt />
      <PWAUpdateNotification />
      <Routes>
        {/* Entry Route: Setup Profile if new, or Home if profile exists */}
        <Route
          path="/"
          element={
            hasProfile ? (
              <Navigate to="/home" replace />
            ) : (
              <ProfileSetup onCreateProfile={createProfile} />
            )
          }
        />

        {/* Home Lobby */}
        <Route
          path="/home"
          element={
            hasProfile ? (
              <Home profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Search & Follow Players */}
        <Route
          path="/search"
          element={
            hasProfile ? (
              <SearchPlayers profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Inbox / Conversations List */}
        <Route
          path="/inbox"
          element={
            hasProfile ? (
              <Inbox profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Dedicated Conversation View */}
        <Route
          path="/inbox/:convId"
          element={
            hasProfile ? (
              <ConversationPage profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Profile Settings & Player Dashboards */}
        <Route
          path="/profile"
          element={
            hasProfile ? (
              <Profile
                profile={profile}
                onUpdateProfile={updateProfile}
                onLogout={logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile/:targetPlayerId"
          element={
            hasProfile ? (
              <Profile
                profile={profile}
                onUpdateProfile={updateProfile}
                onLogout={logout}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Create Room */}
        <Route
          path="/create-room"
          element={
            hasProfile ? (
              <CreateRoom profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Join Room */}
        <Route
          path="/join-room"
          element={
            hasProfile ? (
              <JoinRoom profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Multiplayer Game Room (Waiting / Active) */}
        <Route
          path="/room/:roomId"
          element={
            hasProfile ? (
              <RoomPage profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Ludo Dedicated Lobby & Game Routes */}
        <Route
          path="/ludo"
          element={
            hasProfile ? (
              <LudoLobby profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/ludo/:roomId"
          element={
            hasProfile ? (
              <LudoGamePage profile={profile} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
