/**
 * KM Player Search & Social Follow Page
 * Allows discovering players by Player ID, managing Follow / Unfollow relationships,
 * and checking Mutual Follow status required for messaging.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  UserCheck,
  UserX,
  MessageSquare,
  Users,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import Header from '../components/common/Header';
import Toast from '../components/common/Toast';
import { useSocial } from '../hooks/useSocial';
import { getAvatarById } from '../data/avatars';
import { useSound } from '../hooks/useSound';

export default function SearchPlayers({ profile }) {
  const navigate = useNavigate();
  const {
    socialData,
    followPlayer,
    unfollowPlayer,
    searchPlayers,
    isFollowing,
    isFollower,
    isMutual,
    startConversation,
  } = useSocial(profile);

  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'following' | 'followers'
  const [toastMsg, setToastMsg] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const { playClick, playPop } = useSound();

  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanQuery = searchInput.trim().toUpperCase();
    if (!cleanQuery) return;

    playClick();
    setSearching(true);
    setHasSearched(true);
    try {
      const results = await searchPlayers(cleanQuery);
      // Filter out current user from results
      const filtered = (results || []).filter((u) => u.playerId !== profile?.playerId);
      setSearchResults(filtered);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleToggleFollow = async (targetUser) => {
    if (!targetUser?.playerId || actionLoadingId) return;
    const targetId = targetUser.playerId;
    setActionLoadingId(targetId);
    playPop();

    try {
      const currentlyFollowing = isFollowing(targetId);
      if (currentlyFollowing) {
        await unfollowPlayer(targetId);
        setToastMsg(`Unfollowed ${targetUser.displayName}`);
      } else {
        await followPlayer(targetUser);
        const willBeMutual = isFollower(targetId);
        if (willBeMutual) {
          setToastMsg(`🎉 Mutual follow! Messaging unlocked with ${targetUser.displayName}`);
        } else {
          setToastMsg(`Now following ${targetUser.displayName}`);
        }
      }
    } catch (e) {
      console.error('Follow error:', e);
      setToastMsg('Failed to update follow status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenChat = async (targetUser) => {
    playPop();
    try {
      const conv = await startConversation(targetUser);
      if (conv?.convId) {
        navigate(`/inbox/${conv.convId}`);
      }
    } catch (e) {
      console.error('Start chat error:', e);
    }
  };

  const followingList = Object.values(socialData?.following || {});
  const followersList = Object.values(socialData?.followers || {});

  return (
    <div id="search-players-page" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} />

        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          {/* Page Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
              Player Discovery & Follow
            </h1>
            <p className="text-xs sm:text-sm text-white/50 mt-0.5">
              Find other players by their unique Player ID. Mutual follow unlocks messaging.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-2xl">
            <button
              id="tab-search"
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('search');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search by ID</span>
            </button>

            <button
              id="tab-following"
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('following');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'following'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Following ({followingList.length})</span>
            </button>

            <button
              id="tab-followers"
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('followers');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'followers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Followers ({followersList.length})</span>
            </button>
          </div>

          {/* TAB 1: Search */}
          {activeTab === 'search' && (
            <div className="space-y-5">
              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="search-player-id-input"
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                    placeholder="Enter Player ID (e.g. PL-7K2X or Name)"
                    autoFocus
                    className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-mono text-white placeholder-white/40 outline-none uppercase transition-all"
                  />
                </div>
                <button
                  id="search-submit-btn"
                  type="submit"
                  disabled={!searchInput.trim() || searching}
                  className="px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 shrink-0"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
              </form>

              {/* Search Results List */}
              <div className="space-y-3">
                {searching ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
                    <p className="text-xs text-white/50">Searching players...</p>
                  </div>
                ) : hasSearched && searchResults.length === 0 ? (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center">
                    <p className="text-sm font-bold text-white font-display mb-1">No Player Found</p>
                    <p className="text-xs text-white/50">
                      Verify the Player ID and try again.
                    </p>
                  </div>
                ) : (
                  searchResults.map((user) => (
                    <PlayerFollowCard
                      key={user.playerId}
                      user={user}
                      isFollowing={isFollowing(user.playerId)}
                      isFollower={isFollower(user.playerId)}
                      isMutual={isMutual(user.playerId)}
                      loading={actionLoadingId === user.playerId}
                      onToggleFollow={() => handleToggleFollow(user)}
                      onOpenChat={() => handleOpenChat(user)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Following */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {followingList.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-white font-display">You are not following anyone yet</p>
                  <p className="text-xs text-white/50">
                    Use the Search tab to find other players by their Player ID.
                  </p>
                </div>
              ) : (
                followingList.map((user) => (
                  <PlayerFollowCard
                    key={user.playerId}
                    user={user}
                    isFollowing={true}
                    isFollower={isFollower(user.playerId)}
                    isMutual={isMutual(user.playerId)}
                    loading={actionLoadingId === user.playerId}
                    onToggleFollow={() => handleToggleFollow(user)}
                    onOpenChat={() => handleOpenChat(user)}
                  />
                ))
              )}
            </div>
          )}

          {/* TAB 3: Followers */}
          {activeTab === 'followers' && (
            <div className="space-y-3">
              {followersList.length === 0 ? (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8 text-center space-y-2">
                  <p className="text-sm font-bold text-white font-display">No followers yet</p>
                  <p className="text-xs text-white/50">
                    Share your Player ID ({profile?.playerId}) with friends so they can follow you.
                  </p>
                </div>
              ) : (
                followersList.map((user) => (
                  <PlayerFollowCard
                    key={user.playerId}
                    user={user}
                    isFollowing={isFollowing(user.playerId)}
                    isFollower={true}
                    isMutual={isMutual(user.playerId)}
                    loading={actionLoadingId === user.playerId}
                    onToggleFollow={() => handleToggleFollow(user)}
                    onOpenChat={() => handleOpenChat(user)}
                  />
                ))
              )}
            </div>
          )}
        </main>
      </div>

      <Toast message={toastMsg} type="info" onClose={() => setToastMsg('')} />
    </div>
  );
}

function PlayerFollowCard({
  user,
  isFollowing,
  isFollower,
  isMutual,
  loading,
  onToggleFollow,
  onOpenChat,
}) {
  const avatar = getAvatarById(user.avatar || 'fox');

  return (
    <div
      id={`player-card-${user.playerId}`}
      className="bg-white/[0.03] hover:bg-white/[0.05] border border-white/10 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 transition-all"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-2xl shadow-md ring-1 ${avatar.ring} shrink-0`}
        >
          <span>{avatar.emoji}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-white font-display truncate">
              {user.displayName}
            </h4>
            {isMutual && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold shrink-0">
                Mutual
              </span>
            )}
          </div>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            @{user.playerId}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Message button if mutual */}
        {isMutual && (
          <button
            id={`message-player-btn-${user.playerId}`}
            type="button"
            onClick={onOpenChat}
            className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
          </button>
        )}

        {/* Follow / Following Toggle Button */}
        <button
          id={`follow-toggle-btn-${user.playerId}`}
          type="button"
          disabled={loading}
          onClick={onToggleFollow}
          className={`flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isFollowing
              ? 'bg-white/10 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-white hover:text-rose-300'
              : isFollower
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isFollowing ? (
            <>
              <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>Following</span>
            </>
          ) : isFollower ? (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Follow Back</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Follow</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
