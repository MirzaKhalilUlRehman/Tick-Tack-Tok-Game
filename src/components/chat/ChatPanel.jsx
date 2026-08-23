/**
 * Modern Text & Emoji Chat Panel for KM
 * Features:
 * - Text messages + Emojis only
 * - Single-button emoji picker popover (no persistent quick emoji row)
 * - Emoji message reactions (❤️ 😂 😮 😢 👍 👎)
 * - Real-time typing indicators & Seen receipts
 * - Smooth auto-scrolling
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Smile,
  Check,
  CheckCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { getAvatarById } from '../../data/avatars';
import {
  sendTextMessage,
  toggleReaction,
  setTypingStatus,
  markChatSeen,
} from '../../services/chatService';
import MessageReactionPicker, { REACTION_EMOJIS } from './MessageReactionPicker';
import { useSound } from '../../hooks/useSound';

const POPULAR_EMOJIS = [
  '😀', '😂', '🤣', '😍', '😎', '🥳', '🤔', '💀',
  '❤️', '🔥', '👏', '👍', '👎', '🎉', '✨', '💯',
  '🎮', '🎯', '💥', '⚡', '🚀', '👀', '🤝', '🙌',
  '🏆', '⚔️', '🛡️', '👑', '🤩', '😜', '😭', '🤯',
];

export default function ChatPanel({
  convId,
  conversationData,
  playerProfile,
  otherPlayer = null,
  isHeaderCompact = false,
}) {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { playPop, playClick } = useSound();

  const messages = conversationData?.messages || {};
  const typingMap = conversationData?.typing || {};

  // Sort messages chronologically
  const messageList = Object.values(messages).sort(
    (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
  );

  // Auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageList.length]);

  // Mark messages as seen when conversation opens or new messages arrive
  useEffect(() => {
    if (convId && playerProfile?.playerId) {
      markChatSeen(convId, playerProfile.playerId);
    }
  }, [convId, messageList.length, playerProfile?.playerId]);

  // Handle typing status broadcast with debounce
  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (convId && playerProfile?.playerId) {
      setTypingStatus(convId, playerProfile.playerId, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(convId, playerProfile.playerId, false);
      }, 2000);
    }
  };

  // Clean up typing status on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (convId && playerProfile?.playerId) {
        setTypingStatus(convId, playerProfile.playerId, false);
      }
    };
  }, [convId, playerProfile?.playerId]);

  // Check if other player is typing
  const isOtherTyping = Object.entries(typingMap).some(([pId, timestamp]) => {
    if (pId === playerProfile?.playerId || !timestamp) return false;
    return Date.now() - timestamp < 4000;
  });

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || !convId || !playerProfile) return;

    playPop();
    setInputText('');
    setIsEmojiPickerOpen(false);

    try {
      await sendTextMessage(convId, playerProfile, cleanText);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const handleSelectReaction = async (msgId, emoji, currentReactions) => {
    playPop();
    setActiveReactionMsgId(null);
    try {
      await toggleReaction(convId, msgId, playerProfile.playerId, emoji, currentReactions);
    } catch (err) {
      console.error('Toggle reaction error:', err);
    }
  };

  const handleInsertEmoji = (emoji) => {
    playClick();
    setInputText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const otherAvatar = getAvatarById(otherPlayer?.avatar || 'fox');

  return (
    <div
      id="chat-panel"
      className="flex flex-col h-[520px] sm:h-[600px] w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
    >
      {/* Top Conversation Header */}
      {!isHeaderCompact && (
        <div className="p-3.5 sm:p-4 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => {
              if (otherPlayer?.playerId) {
                navigate(`/profile/${otherPlayer.playerId}`);
              }
            }}
            className="flex items-center gap-3 cursor-pointer group"
            title="View Player Profile"
          >
            {otherPlayer ? (
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br ${otherAvatar.color} flex items-center justify-center text-lg shadow-md ring-1 ${otherAvatar.ring} group-hover:scale-105 transition-transform`}
              >
                <span>{otherAvatar.emoji}</span>
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg">
                💬
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors">
                <span>{otherPlayer?.displayName || 'Chat'}</span>
                {otherPlayer?.playerId && <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-indigo-300" />}
              </h3>
              <p className="text-[11px] text-white/50 font-mono">
                {otherPlayer?.playerId ? `@${otherPlayer.playerId}` : 'Direct Conversation'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>Mutual Follow</span>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 select-text">
        {messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-semibold text-white/60">No messages yet</p>
            <p className="text-[11px] text-white/40 max-w-xs mt-1">
              Say hello! Messages are permanently stored and delivered even when offline.
            </p>
          </div>
        ) : (
          messageList.map((msg) => {
            const isMe = msg.senderId === playerProfile?.playerId;
            const senderAvatar = getAvatarById(msg.avatar || 'fox');
            const reactions = msg.reactions || {};
            const reactionEntries = Object.entries(reactions);
            const myReaction = reactions[playerProfile?.playerId];
            const isPickerOpen = activeReactionMsgId === msg.id;

            // Group reactions by emoji
            const reactionCounts = reactionEntries.reduce((acc, [, em]) => {
              acc[em] = (acc[em] || 0) + 1;
              return acc;
            }, {});

            // Seen check
            const seenList = Object.keys(msg.seenBy || {});
            const isSeenByOther = seenList.some((id) => id !== playerProfile?.playerId);

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 group relative ${
                  isMe ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Sender Avatar */}
                <div
                  className={`w-7 h-7 rounded-xl bg-gradient-to-br ${senderAvatar.color} flex items-center justify-center text-xs shadow-sm shrink-0 self-end`}
                  title={msg.senderName}
                >
                  <span>{senderAvatar.emoji}</span>
                </div>

                {/* Message Bubble Container */}
                <div className={`max-w-[78%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {/* Sender Name if not me */}
                  {!isMe && (
                    <span className="text-[10px] font-bold text-white/40 px-1 mb-0.5">
                      {msg.senderName}
                    </span>
                  )}

                  {/* Bubble */}
                  <div
                    className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal leading-relaxed break-words shadow-lg transition-all ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white/10 text-white/90 rounded-bl-xs border border-white/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Meta info (Time & Seen status) */}
                    <div
                      className={`flex items-center gap-1 text-[9px] mt-1 justify-end ${
                        isMe ? 'text-indigo-200/70' : 'text-white/40'
                      }`}
                    >
                      <span>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                      {isMe && (
                        <span>
                          {isSeenByOther ? (
                            <CheckCheck className="w-3 h-3 text-cyan-300" title="Seen" />
                          ) : (
                            <Check className="w-3 h-3 text-white/60" title="Sent" />
                          )}
                        </span>
                      )}
                    </div>

                    {/* Reaction trigger hover button */}
                    <button
                      type="button"
                      onClick={() =>
                        setActiveReactionMsgId(isPickerOpen ? null : msg.id)
                      }
                      className={`absolute -top-3 ${
                        isMe ? '-left-6' : '-right-6'
                      } opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full bg-slate-900 border border-white/20 text-white/70 hover:text-white shadow-md cursor-pointer`}
                      title="Add reaction"
                    >
                      <Smile className="w-3 h-3" />
                    </button>

                    {/* Reaction Picker Popover */}
                    {isPickerOpen && (
                      <MessageReactionPicker
                        isOpen={isPickerOpen}
                        currentReaction={myReaction}
                        onSelectReaction={(emoji) =>
                          handleSelectReaction(msg.id, emoji, reactions)
                        }
                      />
                    )}
                  </div>

                  {/* Attached Reaction Pills */}
                  {Object.keys(reactionCounts).length > 0 && (
                    <div
                      className={`flex items-center gap-1 mt-1 flex-wrap ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {Object.entries(reactionCounts).map(([emoji, count]) => {
                        const iReacted = myReaction === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              handleSelectReaction(msg.id, emoji, reactions)
                            }
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                              iReacted
                                ? 'bg-indigo-500/30 border-indigo-500/50 text-white ring-1 ring-indigo-500/50'
                                : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            <span>{emoji}</span>
                            <span className="text-[10px] text-white/60">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator Bar */}
      {isOtherTyping && (
        <div className="px-4 py-1.5 bg-white/[0.02] border-t border-white/5 flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[11px] text-indigo-300 font-medium italic">
            {otherPlayer?.displayName || 'Player'} is typing...
          </span>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {isEmojiPickerOpen && (
        <div className="absolute bottom-16 left-3 sm:left-4 z-30 p-3 bg-slate-900/98 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 w-72">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Emoji Palette
            </span>
            <button
              type="button"
              onClick={() => setIsEmojiPickerOpen(false)}
              className="text-white/40 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
            {POPULAR_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleInsertEmoji(emoji)}
                className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Composer (Only text input + ONE emoji icon + Send button) */}
      <form
        id="chat-composer-form"
        onSubmit={handleSendMessage}
        className="p-2.5 sm:p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2"
      >
        {/* Single Emoji Picker Button */}
        <button
          id="chat-emoji-toggle-btn"
          type="button"
          onClick={() => {
            playClick();
            setIsEmojiPickerOpen((prev) => !prev);
          }}
          className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
            isEmojiPickerOpen
              ? 'bg-indigo-600 text-white'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-indigo-300'
          }`}
          title="Emoji Picker"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          id="chat-message-input"
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 bg-white/5 border border-white/10 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-white/40 outline-none transition-all"
        />

        {/* Send Button */}
        <button
          id="chat-send-btn"
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
          title="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
