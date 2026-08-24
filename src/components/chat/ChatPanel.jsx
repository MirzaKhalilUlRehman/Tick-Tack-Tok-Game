/**
 * Modern Text & Emoji Chat Panel for KM
 * Features:
 * - Text messages + Emojis only
 * - Instagram-style message replies (Swipe-to-reply on mobile + hover button on desktop)
 * - Reply preview composer banner with cancel button
 * - In-bubble quoted reply preview with smooth click-to-scroll & glowing highlight
 * - Real-time "+ Follow" banner when playing matches with unfollowed opponents
 * - Emoji message reactions (❤️ 😂 😮 😢 👍 👎)
 * - Real-time typing indicators & Seen receipts
 * - Smooth auto-scrolling & sound effects
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
  Reply,
  UserPlus,
  Sparkles,
} from 'lucide-react';
import { getAvatarById } from '../../data/avatars';
import {
  sendTextMessage,
  toggleReaction,
  setTypingStatus,
  markChatSeen,
} from '../../services/chatService';
import { followPlayer } from '../../services/socialService';
import { useSocial } from '../../hooks/useSocial';
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
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState(null);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { playPop, playClick } = useSound();

  const { isFollowing, isMutual } = useSocial(playerProfile);

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
    const currentReply = replyingTo;
    setInputText('');
    setReplyingTo(null);
    setIsEmojiPickerOpen(false);

    try {
      await sendTextMessage(convId, playerProfile, cleanText, currentReply);
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

  const handleStartReply = (msg) => {
    playClick();
    setReplyingTo({
      id: msg.id,
      messageId: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName || 'Player',
      text: msg.text || '',
    });
    inputRef.current?.focus();
  };

  const scrollToOriginalMessage = (targetMsgId) => {
    if (!targetMsgId) return;
    const el = document.getElementById(`chat-msg-${targetMsgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(targetMsgId);
      setTimeout(() => {
        setHighlightedMsgId(null);
      }, 1600);
    }
  };

  const handleFollowOpponent = async () => {
    if (!otherPlayer || !playerProfile || isFollowSubmitting) return;
    try {
      setIsFollowSubmitting(true);
      playPop();
      await followPlayer(playerProfile, otherPlayer);
    } catch (err) {
      console.warn('Follow opponent error:', err);
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  const otherAvatar = getAvatarById(otherPlayer?.avatar || 'fox');
  const isAlreadyFollowingOther = otherPlayer?.playerId ? isFollowing(otherPlayer.playerId) : false;
  const isMutualWithOther = otherPlayer?.playerId ? isMutual(otherPlayer.playerId) : false;

  return (
    <div
      id="chat-panel"
      className="flex flex-col h-[520px] sm:h-[600px] w-full bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
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
            className="flex items-center gap-3 cursor-pointer group min-w-0"
            title="View Player Profile"
          >
            {otherPlayer ? (
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br ${otherAvatar.color} flex items-center justify-center text-lg shadow-md ring-1 ${otherAvatar.ring} group-hover:scale-105 transition-transform shrink-0`}
              >
                <span>{otherAvatar.emoji}</span>
              </div>
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0">
                💬
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5 group-hover:text-indigo-300 transition-colors truncate">
                <span className="truncate">{otherPlayer?.displayName || 'Match Chat'}</span>
                {otherPlayer?.playerId && <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-indigo-300 shrink-0" />}
              </h3>
              <p className="text-[11px] text-white/50 font-mono truncate">
                {otherPlayer?.playerId ? `@${otherPlayer.playerId}` : 'Live Match Discussion'}
              </p>
            </div>
          </div>

          {isMutualWithOther ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Friends</span>
            </div>
          ) : isAlreadyFollowingOther ? (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold shrink-0">
              <Check className="w-3 h-3 text-indigo-400" />
              <span>Following</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Follow Opponent Option Banner in Active Game Chat */}
      {otherPlayer && !isAlreadyFollowingOther && otherPlayer.playerId !== playerProfile?.playerId && (
        <div
          id="follow-opponent-chat-banner"
          className="mx-3 my-2 p-2.5 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-between gap-2 shadow-sm animate-in fade-in-50 duration-200"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-white/60 shrink-0">Playing with:</span>
            <span className="font-bold text-xs text-white truncate">{otherPlayer.displayName}</span>
          </div>
          <button
            id="follow-opponent-in-game-btn"
            type="button"
            disabled={isFollowSubmitting}
            onClick={handleFollowOpponent}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Follow {otherPlayer.displayName?.split(' ')[0] || ''}</span>
          </button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 select-text">
        {messageList.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-white/40">
            <span className="text-3xl mb-2">💬</span>
            <p className="text-xs font-semibold text-white/60">No messages yet</p>
            <p className="text-[11px] text-white/40 max-w-xs mt-1">
              Say hello or react with emojis! Swipe right on any message to reply.
            </p>
          </div>
        ) : (
          messageList.map((msg) => (
            <MessageBubbleItem
              key={msg.id}
              msg={msg}
              playerProfile={playerProfile}
              isHighlighted={highlightedMsgId === msg.id}
              activeReactionMsgId={activeReactionMsgId}
              setActiveReactionMsgId={setActiveReactionMsgId}
              onSelectReaction={handleSelectReaction}
              onStartReply={handleStartReply}
              onScrollToOriginal={scrollToOriginalMessage}
            />
          ))
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

      {/* Reply Context Banner */}
      {replyingTo && (
        <div
          id="chat-replying-banner"
          className="px-3.5 py-2 bg-indigo-950/80 border-t border-indigo-500/40 flex items-center justify-between gap-2 text-xs backdrop-blur-md animate-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Reply className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <span className="font-bold text-indigo-300 mr-1.5 text-[11px]">
                Replying to {replyingTo.senderName}:
              </span>
              <span className="text-white/70 italic text-[11px] truncate">
                "{replyingTo.text?.substring(0, 60)}{replyingTo.text?.length > 60 ? '...' : ''}"
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white cursor-pointer shrink-0"
            title="Cancel reply"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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

      {/* Message Composer */}
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
          className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 ${
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
          placeholder={replyingTo ? `Reply to ${replyingTo.senderName}...` : "Type a message..."}
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

/**
 * Swipeable Individual Message Bubble Component
 * Supports touch swipe to reply on mobile and hover reply button on desktop
 */
function MessageBubbleItem({
  msg,
  playerProfile,
  isHighlighted,
  activeReactionMsgId,
  setActiveReactionMsgId,
  onSelectReaction,
  onStartReply,
  onScrollToOriginal,
}) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const isMe = msg.senderId === playerProfile?.playerId;
  const senderAvatar = getAvatarById(msg.avatar || 'fox');
  const reactions = msg.reactions || {};
  const reactionEntries = Object.entries(reactions);
  const myReaction = reactions[playerProfile?.playerId];
  const isPickerOpen = activeReactionMsgId === msg.id;

  const reactionCounts = reactionEntries.reduce((acc, [, em]) => {
    acc[em] = (acc[em] || 0) + 1;
    return acc;
  }, {});

  const seenList = Object.keys(msg.seenBy || {});
  const isSeenByOther = seenList.some((id) => id !== playerProfile?.playerId);

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - touchStartX;
    if (delta > 0 && delta < 85) {
      setSwipeOffset(delta);
    }
  };

  const handleTouchEnd = () => {
    if (swipeOffset > 40) {
      onStartReply(msg);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(20);
        } catch (e) {}
      }
    }
    setSwipeOffset(0);
    setTouchStartX(null);
  };

  return (
    <div
      id={`chat-msg-${msg.id}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined,
        transition: swipeOffset === 0 ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
      }}
      className={`flex gap-2.5 group relative select-text transition-all ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      } ${
        isHighlighted
          ? 'ring-2 ring-indigo-400 bg-indigo-500/20 p-2 rounded-3xl animate-pulse'
          : ''
      }`}
    >
      {/* Swipe Reply Icon Indicator */}
      {swipeOffset > 25 && (
        <div
          className={`absolute left-0 -ml-8 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center transition-all ${
            swipeOffset > 40 ? 'scale-110 opacity-100' : 'scale-90 opacity-60'
          }`}
        >
          <Reply className="w-3.5 h-3.5" />
        </div>
      )}

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
          style={{
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            maxWidth: '100%',
          }}
          className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-normal leading-relaxed break-words shadow-lg transition-all ${
            isMe
              ? 'bg-indigo-600 text-white rounded-br-xs'
              : 'bg-white/10 text-white/90 rounded-bl-xs border border-white/10'
          }`}
        >
          {/* Quoted Reply Preview */}
          {msg.replyTo && (
            <div
              id={`chat-quote-reply-${msg.id}`}
              onClick={() => onScrollToOriginal(msg.replyTo.messageId)}
              className="mb-2 p-2 rounded-xl bg-black/30 border-l-2 border-indigo-400 text-[11px] cursor-pointer hover:bg-black/45 transition-colors select-none"
              title="Click to view replied message"
            >
              <div className="flex items-center gap-1 font-bold text-indigo-300 text-[10px]">
                <Reply className="w-2.5 h-2.5" />
                <span>{msg.replyTo.senderName || 'Player'}</span>
              </div>
              <p className="text-white/80 line-clamp-1 truncate mt-0.5" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                {msg.replyTo.textPreview || 'Original message'}
              </p>
            </div>
          )}

          <p style={{ wordWrap: 'break-word', overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxWidth: '100%' }}>
            {msg.text}
          </p>

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

          {/* Desktop Hover Controls (Reply Button & Reaction Trigger) */}
          <div
            className={`hidden group-hover:flex items-center gap-1 absolute -top-3 ${
              isMe ? '-left-16' : '-right-16'
            } transition-opacity z-20`}
          >
            <button
              type="button"
              onClick={() => onStartReply(msg)}
              className="p-1.5 rounded-full bg-slate-900 border border-white/20 text-white/70 hover:text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
              title="Reply to message"
            >
              <Reply className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() =>
                setActiveReactionMsgId(isPickerOpen ? null : msg.id)
              }
              className="p-1.5 rounded-full bg-slate-900 border border-white/20 text-white/70 hover:text-white shadow-md cursor-pointer hover:scale-110 transition-transform"
              title="Add reaction"
            >
              <Smile className="w-3 h-3" />
            </button>
          </div>

          {/* Reaction Picker Popover */}
          {isPickerOpen && (
            <MessageReactionPicker
              isOpen={isPickerOpen}
              currentReaction={myReaction}
              onSelectReaction={(emoji) =>
                onSelectReaction(msg.id, emoji, reactions)
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
                    onSelectReaction(msg.id, emoji, reactions)
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
}
