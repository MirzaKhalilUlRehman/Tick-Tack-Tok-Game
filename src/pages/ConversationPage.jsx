/**
 * KM Conversation Page
 * Full-page view for direct mutual-follow messaging between two players.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, UserPlus, Loader2 } from 'lucide-react';
import Header from '../components/common/Header';
import ChatPanel from '../components/chat/ChatPanel';
import { subscribeConversation } from '../services/chatService';
import { useSocial } from '../hooks/useSocial';
import { getAvatarById } from '../data/avatars';
import { useSound } from '../hooks/useSound';

export default function ConversationPage({ profile }) {
  const { convId } = useParams();
  const navigate = useNavigate();
  const [convData, setConvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isMutual, socialData } = useSocial(profile);
  const { playClick, playPop } = useSound();

  useEffect(() => {
    if (!convId) return;

    const unsub = subscribeConversation(convId, (data) => {
      setConvData(data);
      setLoading(false);
    });

    return () => unsub?.();
  }, [convId]);

  const participantProfiles = convData?.participantProfiles || {};
  const otherPlayer =
    Object.values(participantProfiles).find(
      (p) => p.playerId !== profile?.playerId
    ) || null;

  const isAllowedToChat = otherPlayer ? isMutual(otherPlayer.playerId) : true;

  const otherAvatar = getAvatarById(otherPlayer?.avatar || 'fox');

  return (
    <div id="conversation-page" className="min-h-screen atmospheric-bg flex flex-col justify-between">
      <div>
        <Header profile={profile} />

        <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4">
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between">
            <button
              id="back-to-inbox-btn"
              type="button"
              onClick={() => {
                playClick();
                navigate('/inbox');
              }}
              className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Inbox</span>
            </button>

            {otherPlayer && (
              <div className="flex items-center gap-2 text-xs font-mono text-white/40">
                <span>@{otherPlayer.playerId}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-3" />
              <p className="text-xs text-white/50">Loading conversation...</p>
            </div>
          ) : !isAllowedToChat && otherPlayer ? (
            /* Locked State if mutual follow no longer exists */
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl mx-auto text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Mutual Follow Required
                </h3>
                <p className="text-xs text-white/50 max-w-sm mx-auto mt-1">
                  Messaging with {otherPlayer.displayName} requires both players to follow each other.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  playPop();
                  navigate('/search');
                }}
                className="inline-flex items-center gap-2 py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Manage Follow Status</span>
              </button>
            </div>
          ) : (
            <ChatPanel
              convId={convId}
              conversationData={convData}
              playerProfile={profile}
              otherPlayer={otherPlayer}
            />
          )}
        </main>
      </div>
    </div>
  );
}
