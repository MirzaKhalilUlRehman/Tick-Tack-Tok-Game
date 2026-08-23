/**
 * Inbox Hook for KM
 * Manages user's mutual conversations, unread message badges, and real-time previews.
 */
import { useState, useEffect } from 'react';
import { subscribeUserInbox } from '../services/chatService';

export function useInbox(profile) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.playerId) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const unsub = subscribeUserInbox(profile.playerId, (list) => {
      // Sort conversations by most recent update
      const sorted = (list || []).sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
      );
      setConversations(sorted);
      setLoading(false);
    });

    return () => unsub?.();
  }, [profile?.playerId]);

  // Calculate total unread messages across all conversations
  const totalUnreadCount = conversations.reduce((total, conv) => {
    const messages = conv.messages || {};
    let unreadInConv = 0;
    for (const msg of Object.values(messages)) {
      if (msg.senderId !== profile?.playerId && (!msg.seenBy || !msg.seenBy[profile?.playerId])) {
        unreadInConv += 1;
      }
    }
    return total + unreadInConv;
  }, 0);

  return {
    conversations,
    loading,
    totalUnreadCount,
  };
}
