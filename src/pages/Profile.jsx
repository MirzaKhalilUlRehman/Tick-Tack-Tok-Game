import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Copy,
  Check,
  Save,
  Trophy,
  Flame,
  User,
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Swords,
  Gamepad2,
  Calendar,
  Clock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import Header from '../components/common/Header';
import AvatarPicker from '../components/common/AvatarPicker';
import Toast from '../components/common/Toast';
import { getAvatarById } from '../data/avatars';
import { getStoredStats, updateStoredStats } from '../utils/storage';
import { useSound } from '../hooks/useSound';
import {
  subscribeToUserProfileInDb,
  subscribeToSocialInDb,
  subscribeToRelationshipInDb,
  followPlayerInDb,
  unfollowPlayerInDb,
  getAllUsersFromDb,
} from '../firebase/database';

export default function Profile({ profile: myProfile, onUpdateProfile, onLogout }) {
  const { targetPlayerId } = useParams();
  const navigate = useNavigate();
  const { playClick, playPop } = useSound();

  // If no param, or param matches my own ID, viewing my own dashboard
  const isOwnProfile = !targetPlayerId || targetPlayerId.toUpperCase() === myProfile?.playerId?.toUpperCase();
  const activePlayerId = isOwnProfile ? myProfile?.playerId : targetPlayerId.toUpperCase();

  const [playerData, setPlayerData] = useState(isOwnProfile ? myProfile : null);
  const [socialData, setSocialData] = useState({ following: [], followers: [], friends: [] });
  const [mySocialData, setMySocialData] = useState({ following: [], followers: [], friends: [] });
  const [relationshipData, setRelationshipData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'h2h' | 'social' | 'edit'
  const [socialListModal, setSocialListModal] = useState(null); // 'followers' | 'following' | 'friends' | null

  // Edit profile form state
  const [displayName, setDisplayName] = useState(myProfile?.displayName || '');
  const [avatarId, setAvatarId] = useState(myProfile?.avatar || 'fox');
  const [copiedId, setCopiedId] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [followingActionLoading, setFollowingActionLoading] = useState(false);

  // Subscribe to active player's user profile in Firebase
  useEffect(() => {
    if (!activePlayerId) return;

    const unsubscribe = subscribeToUserProfileInDb(activePlayerId, (data) => {
      if (data) {
        setPlayerData(data);
        if (isOwnProfile) {
          setDisplayName(data.displayName || '');
          setAvatarId(data.avatar || 'fox');
        }
      } else if (!isOwnProfile) {
        setPlayerData({
          playerId: activePlayerId,
          displayName: activePlayerId,
          avatar: 'fox',
        });
      }
    });

    return () => unsubscribe();
  }, [activePlayerId, isOwnProfile]);

  // Subscribe to active player's social connections
  useEffect(() => {
    if (!activePlayerId) return;
    const unsubscribe = subscribeToSocialInDb(activePlayerId, (data) => {
      setSocialData(data);
    });
    return () => unsubscribe();
  }, [activePlayerId]);

  // Subscribe to viewer's social data if viewing someone else (to check if I follow them)
  useEffect(() => {
    if (isOwnProfile || !myProfile?.playerId) return;
    const unsubscribe = subscribeToSocialInDb(myProfile.playerId, (data) => {
      setMySocialData(data);
    });
    return () => unsubscribe();
  }, [isOwnProfile, myProfile?.playerId]);

  // If viewing another player, subscribe to head-to-head relationship
  useEffect(() => {
    if (isOwnProfile || !myProfile?.playerId || !activePlayerId) {
      setRelationshipData(null);
      return;
    }

    const unsubscribe = subscribeToRelationshipInDb(myProfile.playerId, activePlayerId, (data) => {
      setRelationshipData(data);
    });

    return () => unsubscribe();
  }, [isOwnProfile, myProfile?.playerId, activePlayerId]);

  // Fetch all users to display rich details in followers/following/friends lists
  useEffect(() => {
    let mounted = true;
    getAllUsersFromDb().then((users) => {
      if (mounted) setAllUsers(users);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopyId = () => {
    if (activePlayerId) {
      playClick();
      navigator.clipboard.writeText(activePlayerId);
      setCopiedId(true);
      setToastMsg(`Player ID ${activePlayerId} copied!`);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) return;

    try {
      setSaving(true);
      playPop();
      await onUpdateProfile({
        displayName: cleanName,
        avatar: avatarId,
      });
      setToastMsg('Profile updated successfully!');
      setActiveTab('stats');
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  const isFollowingTarget = mySocialData?.following?.includes(activePlayerId);
  const isFriendWithTarget = mySocialData?.friends?.includes(activePlayerId) || 
    (isFollowingTarget && socialData?.following?.includes(myProfile?.playerId));

  const handleToggleFollow = async () => {
    if (isOwnProfile || !myProfile?.playerId || !activePlayerId) return;

    try {
      setFollowingActionLoading(true);
      playPop();
      if (isFollowingTarget) {
        await unfollowPlayerInDb(myProfile.playerId, activePlayerId);
        setToastMsg(`Unfollowed ${playerData?.displayName || activePlayerId}`);
      } else {
        await followPlayerInDb(
          { playerId: myProfile.playerId, displayName: myProfile.displayName, avatar: myProfile.avatar },
          { playerId: activePlayerId, displayName: playerData?.displayName, avatar: playerData?.avatar }
        );
        setToastMsg(`Now following ${playerData?.displayName || activePlayerId}!`);
      }
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowingActionLoading(false);
    }
  };

  const handleOpenChat = () => {
    playClick();
    navigate('/inbox');
  };

  // Compile full stats
  const career = playerData?.stats || {
    matchesPlayed: 0,
    matchesWon: 0,
    tttMatches: 0,
    tttWins: 0,
    tttLosses: 0,
    tttDraws: 0,
    ludoMatches: 0,
    ludoWins: 0,
    ludoLosses: 0,
  };

  // Fallback to local storage if viewing self and database is empty
  const localStats = isOwnProfile ? getStoredStats() : {};
  const tttWins = Math.max(career.tttWins || 0, localStats.tttWins || 0);
  const tttLosses = Math.max(career.tttLosses || 0, localStats.tttLosses || 0);
  const tttDraws = Math.max(career.tttDraws || 0, localStats.tttDraws || 0);
  const tttTotal = Math.max(career.tttMatches || 0, tttWins + tttLosses + tttDraws);
  const tttWinRate = tttTotal > 0 ? Math.round((tttWins / tttTotal) * 100) : 0;

  const ludoWins = Math.max(career.ludoWins || 0, localStats.ludoWins || 0);
  const ludoLosses = Math.max(career.ludoLosses || 0, localStats.ludoLosses || 0);
  const ludoTotal = Math.max(career.ludoMatches || 0, ludoWins + ludoLosses);
  const ludoWinRate = ludoTotal > 0 ? Math.round((ludoWins / ludoTotal) * 100) : 0;

  const totalMatches = Math.max(career.matchesPlayed || 0, tttTotal + ludoTotal);
  const totalWins = Math.max(career.matchesWon || 0, tttWins + ludoWins);
  const overallWinRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

  const avatar = getAvatarById(playerData?.avatar || avatarId || 'fox');

  // Head-to-head calculations
  const myId = myProfile?.playerId;
  const oppId = activePlayerId;
  const p1Id = relationshipData?.player1Id;
  const myH2HWins = relationshipData
    ? (p1Id === myId ? relationshipData.player1Wins : relationshipData.player2Wins) || 0
    : 0;
  const oppH2HWins = relationshipData
    ? (p1Id === oppId ? relationshipData.player1Wins : relationshipData.player2Wins) || 0
    : 0;
  const h2hMatchesCount = relationshipData?.matchesPlayed || 0;
  const h2hHistory = relationshipData?.matchHistory || [];

  return (
    <div id="profile-page" className="min-h-screen atmospheric-bg flex flex-col pb-12">
      <Header profile={myProfile} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            id="profile-back-btn"
            type="button"
            onClick={() => {
              playClick();
              navigate(-1);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold border border-white/10 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <span className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
            {isOwnProfile ? 'Your Dashboard' : 'Player Dossier'}
          </span>
        </div>

        {/* Hero Card */}
        <div className="bg-white/[0.04] backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Avatar */}
            <div className="relative">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br ${avatar.color} flex items-center justify-center text-5xl shadow-2xl ring-4 ${avatar.ring}`}
              >
                <span>{avatar.emoji}</span>
              </div>
              <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-white/20 text-[10px] font-black text-indigo-400 font-mono shadow">
                {isOwnProfile ? 'YOU' : 'PLAYER'}
              </span>
            </div>

            {/* Core Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white">
                  {playerData?.displayName || activePlayerId}
                </h1>
                {isFriendWithTarget && !isOwnProfile && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    Mutual Friend
                  </span>
                )}
              </div>

              {/* Player ID Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/10">
                <span className="text-xs text-white/50 font-medium">Player ID:</span>
                <span className="text-xs font-mono font-black text-indigo-300 tracking-wider">
                  {activePlayerId}
                </span>
                <button
                  id="profile-hero-copy-id-btn"
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Copy Player ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Social Summary Pills */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialListModal('followers')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span><strong>{socialData?.followers?.length || 0}</strong> Followers</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSocialListModal('following')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-pink-400" />
                  <span><strong>{socialData?.following?.length || 0}</strong> Following</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSocialListModal('friends')}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white/80 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span><strong>{socialData?.friends?.length || 0}</strong> Friends</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:items-end gap-2.5 w-full sm:w-auto">
              {!isOwnProfile ? (
                <>
                  <button
                    id="profile-toggle-follow-btn"
                    type="button"
                    disabled={followingActionLoading}
                    onClick={handleToggleFollow}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
                      isFollowingTarget
                        ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                    }`}
                  >
                    {isFollowingTarget ? (
                      <>
                        <UserCheck className="w-4 h-4" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow Player</span>
                      </>
                    )}
                  </button>

                  <button
                    id="profile-direct-message-btn"
                    type="button"
                    onClick={handleOpenChat}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Send Message</span>
                  </button>
                </>
              ) : (
                <button
                  id="profile-edit-tab-toggle-btn"
                  type="button"
                  onClick={() => {
                    playClick();
                    setActiveTab(activeTab === 'edit' ? 'stats' : 'edit');
                  }}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                    activeTab === 'edit'
                      ? 'bg-indigo-600 text-white border-indigo-500'
                      : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{activeTab === 'edit' ? 'View Stats' : 'Edit Profile'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('stats');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Career Overview</span>
          </button>

          {!isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('h2h');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'h2h'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Swords className="w-4 h-4" />
              <span>Head-to-Head</span>
            </button>
          )}

          {isOwnProfile && (
            <button
              type="button"
              onClick={() => {
                playClick();
                setActiveTab('edit');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-display font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Edit Details</span>
            </button>
          )}
        </div>

        {/* Tab 1: Stats & Per-Game Breakdown */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Top 3 Metric Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-white/50 font-bold block mb-1">
                  Matches Played
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-white">
                  {totalMatches}
                </span>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-white/50 font-bold block mb-1">
                  Matches Won
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-emerald-400">
                  {totalWins}
                </span>
              </div>

              <div className="bg-white/[0.04] backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-white/10 text-center">
                <span className="text-[10px] sm:text-xs font-mono uppercase text-white/50 font-bold block mb-1">
                  Win Rate
                </span>
                <span className="text-2xl sm:text-3xl font-black font-display text-amber-400">
                  {overallWinRate}%
                </span>
              </div>
            </div>

            {/* Game 1: Tic Tac Toe Breakdown */}
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl">
                    ❌⭕
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display text-white">Tic Tac Toe</h3>
                    <p className="text-xs text-white/40">Multiplayer Quick Rounds</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-indigo-400">{tttWinRate}% Win Rate</span>
                  <p className="text-[10px] text-white/40">{tttTotal} Games</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-mono uppercase block">Played</span>
                  <span className="text-sm sm:text-base font-bold text-white">{tttTotal}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-emerald-400/80 font-mono uppercase block">Won</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400">{tttWins}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-rose-400/80 font-mono uppercase block">Lost</span>
                  <span className="text-sm sm:text-base font-bold text-rose-400">{tttLosses}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-amber-400/80 font-mono uppercase block">Draws</span>
                  <span className="text-sm sm:text-base font-bold text-amber-400">{tttDraws}</span>
                </div>
              </div>
            </div>

            {/* Game 2: Ludo Breakdown */}
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-5 sm:p-6 border border-white/10 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                    🎲
                  </div>
                  <div>
                    <h3 className="text-sm font-black font-display text-white">Ludo</h3>
                    <p className="text-xs text-white/40">2-Player Classic Board</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-black text-amber-400">{ludoWinRate}% Win Rate</span>
                  <p className="text-[10px] text-white/40">{ludoTotal} Games</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-white/40 font-mono uppercase block">Played</span>
                  <span className="text-sm sm:text-base font-bold text-white">{ludoTotal}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-emerald-400/80 font-mono uppercase block">Won</span>
                  <span className="text-sm sm:text-base font-bold text-emerald-400">{ludoWins}</span>
                </div>
                <div className="bg-black/30 rounded-xl p-2.5 border border-white/5">
                  <span className="text-[10px] text-rose-400/80 font-mono uppercase block">Lost</span>
                  <span className="text-sm sm:text-base font-bold text-rose-400">{ludoLosses}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Head-to-Head Record with Opponent */}
        {activeTab === 'h2h' && !isOwnProfile && (
          <div className="space-y-6">
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl text-center space-y-4">
              <h3 className="text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
                Permanent Head-to-Head Record
              </h3>

              <div className="flex items-center justify-around py-4">
                {/* Me */}
                <div className="text-center space-y-1">
                  <span className="text-3xl font-black text-indigo-400 font-display">{myH2HWins}</span>
                  <p className="text-xs font-bold text-white">You ({myProfile?.displayName})</p>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-mono text-white/40 font-bold">TOTAL</span>
                  <span className="text-sm font-mono text-white/80 font-bold">{h2hMatchesCount} Matches</span>
                </div>

                {/* Opponent */}
                <div className="text-center space-y-1">
                  <span className="text-3xl font-black text-pink-400 font-display">{oppH2HWins}</span>
                  <p className="text-xs font-bold text-white">{playerData?.displayName || activePlayerId}</p>
                </div>
              </div>
            </div>

            {/* Match History Timeline */}
            <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
              <h3 className="text-sm font-black font-display text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Recent Head-to-Head Matches</span>
              </h3>

              {h2hHistory.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  No completed matches recorded between you two yet. Play a round of Tic Tac Toe or Ludo!
                </div>
              ) : (
                <div className="space-y-2.5">
                  {h2hHistory.slice(-10).reverse().map((match, idx) => {
                    const didIWin = match.winnerId === myId;
                    const isDraw = match.isDraw;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-black/40 border border-white/5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {match.gameType === 'ludo' ? '🎲' : '❌⭕'}
                          </span>
                          <div>
                            <p className="text-xs font-bold text-white">
                              {match.gameType === 'ludo' ? 'Ludo' : 'Tic Tac Toe'} (Round {match.round || 1})
                            </p>
                            <p className="text-[10px] text-white/40 font-mono">
                              {new Date(match.timestamp).toLocaleDateString()} at {new Date(match.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full font-mono ${
                            isDraw
                              ? 'bg-slate-700 text-white'
                              : didIWin
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isDraw ? 'Tied' : didIWin ? 'Victory' : 'Defeat'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Edit Profile (Own profile only) */}
        {activeTab === 'edit' && isOwnProfile && (
          <div className="bg-white/[0.04] backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
            <h2 className="text-base font-black font-display text-white">Edit Profile Details</h2>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label
                  htmlFor="edit-display-name-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-white/50 mb-2"
                >
                  Display Name
                </label>
                <input
                  id="edit-display-name-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  className="w-full bg-black/60 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 rounded-xl px-4 py-3 text-sm text-white outline-none transition-all"
                />
              </div>

              <AvatarPicker
                selectedId={avatarId}
                onSelect={(id) => {
                  playClick();
                  setAvatarId(id);
                }}
              />

              <button
                id="save-profile-btn"
                type="submit"
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-display text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Social List Modal (Followers / Following / Friends) */}
      {socialListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black font-display text-white capitalize flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>
                  {socialListModal === 'followers'
                    ? 'Followers'
                    : socialListModal === 'following'
                    ? 'Following'
                    : 'Mutual Friends'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSocialListModal(null)}
                className="text-white/50 hover:text-white text-xs font-bold px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(socialData?.[socialListModal] || []).length === 0 ? (
                <p className="text-center py-8 text-white/40 text-xs">
                  No {socialListModal} found for this player.
                </p>
              ) : (
                socialData[socialListModal].map((targetId) => {
                  const targetUser = allUsers.find((u) => u.playerId === targetId);
                  const userAvatar = getAvatarById(targetUser?.avatar || 'fox');

                  return (
                    <div
                      key={targetId}
                      onClick={() => {
                        playClick();
                        setSocialListModal(null);
                        navigate(`/profile/${targetId}`);
                      }}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${userAvatar.color} flex items-center justify-center text-lg`}
                        >
                          {userAvatar.emoji}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            {targetUser?.displayName || targetId}
                          </p>
                          <p className="text-[10px] font-mono text-indigo-400 font-bold">
                            {targetId}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-white/30" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg('')} />}
    </div>
  );
}
