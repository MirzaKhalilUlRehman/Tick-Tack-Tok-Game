/**
 * KM Inbox Page
 * Dedicated messaging center displaying mutual follow conversations,
 * unread badges, offline delivered messages, and real-time previews.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  UserPlus,
  ArrowRight,
  Clock,
  Check,
  CheckCheck,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import Header from '../components/common/Header';
import { useInbox } from '../hooks/useInbox';
import { useSocial } from '../hooks/useSocial';
import { getAvatarById } from '../data/avatars';
import { useSound } from '../hooks/useSound';

export default function Inbox({ profile }) {
  const navigate = useNavigate();
  const { conversations, loading } = useInbox(profile);
  const { socialData } = useSocial(profile);
  const [filterQuery, setFilterQuery] = useState('');
  const { playClick, playPop } = useSound();

  const handleOpenConversation = (convId) => {
    playClick();
    navigate(`/inbox/${convId}`);
  };

  const handleGoToSearch = () => {
    playPop();
    navigate('/search');
  };

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    if (!filterQuery.trim()) return true;
    const participants = conv.participantProfiles || {};
    return Object.values(participants).some((p) => {
      if (p.playerId === profile?.playerId) return false;
      return (
        p.displayName?.toLowerCase().includes(filterQuery.toLowerCase()) ||
        p.playerId?.toLowerCase().includes(filterQuery.toLowerCase())
      );
    });
  });

  return (
    <div id="inbox-page" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} />

        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                Inbox
              </h1>
              <p className="text-xs sm:text-sm text-white/50 mt-0.5">
                Direct messages with your mutual followers.
              </p>
            </div>

            <button
              id="inbox-find-players-btn"
              type="button"
              onClick={handleGoToSearch}
              className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Find Players</span>
            </button>
          </div>

          {/* Search / Filter Filter Input */}
          {conversations.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="inbox-search-filter"
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter conversations..."
                className="w-full bg-white/[0.04] border border-white/10 focus:border-indigo-500 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
              />
            </div>
          )}

          {/* Conversation List */}
          <div className="space-y-2.5">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
                <p className="text-xs text-white/50">Loading inbox...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-2xl mx-auto text-indigo-300">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    {filterQuery ? 'No matching conversations' : 'No Conversations Yet'}
                  </h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                    {filterQuery
                      ? 'Try searching with a different name or Player ID.'
                      : 'To unlock messaging, both players must follow each other. Search for a player by their Player ID and connect!'}
                  </p>
                </div>

                {!filterQuery && (
                  <button
                    id="empty-inbox-search-btn"
                    type="button"
                    onClick={handleGoToSearch}
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Search Players by ID</span>
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const profiles = conv.participantProfiles || {};
                const otherPlayer =
                  Object.values(profiles).find(
                    (p) => p.playerId !== profile?.playerId
                  ) || { displayName: 'Player', avatar: 'fox', playerId: 'PLAYER' };

                const otherAvatar = getAvatarById(otherPlayer.avatar);
                const lastMsg = conv.lastMessage;
                const messages = conv.messages || {};

                // Calculate unread count in this conversation
                let unreadCount = 0;
                for (const m of Object.values(messages)) {
                  if (
                    m.senderId !== profile?.playerId &&
                    (!m.seenBy || !m.seenBy[profile?.playerId])
                  ) {
                    unreadCount += 1;
                  }
                }

                const isMeLastSender = lastMsg?.senderId === profile?.playerId;

                return (
                  <div
                    key={conv.convId}
                    id={`inbox-item-${conv.convId}`}
                    onClick={() => handleOpenConversation(conv.convId)}
                    className="bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 sm:p-4.5 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    {/* Left: Avatar & Text */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${otherAvatar.color} flex items-center justify-center text-2xl shadow-md ring-1 ${otherAvatar.ring} shrink-0 group-hover:scale-105 transition-transform`}
                      >
                        <span>{otherAvatar.emoji}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm font-bold text-white font-display truncate">
                            {otherPlayer.displayName}
                          </h4>
                          {lastMsg?.timestamp && (
                            <span className="text-[11px] text-white/40 shrink-0 font-mono">
                              {new Date(lastMsg.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-white/60 truncate">
                          {isMeLastSender && (
                            <span className="text-indigo-400 font-semibold shrink-0">
                              You:
                            </span>
                          )}
                          <p className="truncate text-xs text-white/70">
                            {lastMsg?.text || 'No messages yet'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Unread Badge & Arrow */}
                    <div className="flex items-center gap-3 shrink-0">
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black font-mono shadow-md shadow-indigo-600/50 animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
