import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { chatService } from '../services/chatService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { useE2EE } from '../hooks/useE2EE';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { encryptMessage, decryptMessage, fingerprint } = useE2EE();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'groups' | 'channels' | 'calls'
  const [searchQuery, setSearchQuery] = useState('');
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Fetch user conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await chatService.getConversations();
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user?._id, fetchConversations]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversation || !activeConversation._id) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let isMounted = true;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await chatService.getMessages(activeConversation._id);
        if (isMounted && res.success) {
          // Decrypt any E2EE messages safely
          const rawMsgs = res.messages || [];
          const processedMessages = await Promise.all(
            rawMsgs.map(async (msg) => {
              try {
                if (msg.isEncrypted && msg.encryptedPayload && msg.nonce) {
                  const senderPub =
                    msg.sender?.publicKey ||
                    activeConversation.participants?.find((p) => (p.user?._id || p._id) === (msg.sender?._id || msg.sender))?.publicKey;
                  if (senderPub) {
                    const decrypted = await decryptMessage(msg.encryptedPayload, msg.nonce, senderPub);
                    return { ...msg, decryptedContent: decrypted || msg.content };
                  }
                }
              } catch (decErr) {
                // If decryption fails or not applicable, fallback to plain content
              }
              return msg;
            })
          );

          if (isMounted) {
            setMessages(processedMessages);
          }
        }
      } catch (err) {
        console.error('Error fetching messages', err);
        if (isMounted) setMessages([]);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };

    loadMessages();

    if (socket) {
      socket.emit('conversation:join', activeConversation._id);
    }

    return () => {
      isMounted = false;
      if (socket) {
        socket.emit('conversation:leave', activeConversation._id);
      }
    };
  }, [activeConversation?._id, socket]);

  // Listen to incoming real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = async (newMsg) => {
      if (activeConversation && newMsg.conversation === activeConversation._id) {
        let processedMsg = newMsg;
        try {
          if (newMsg.isEncrypted && newMsg.encryptedPayload && newMsg.nonce) {
            const senderPub = newMsg.sender?.publicKey;
            if (senderPub) {
              const decrypted = await decryptMessage(newMsg.encryptedPayload, newMsg.nonce, senderPub);
              processedMsg = { ...newMsg, decryptedContent: decrypted || newMsg.content };
            }
          }
        } catch (e) {}

        setMessages((prev) => {
          if (prev.some((m) => m._id === processedMsg._id)) return prev;
          return [...prev, processedMsg];
        });

        // Send read receipt
        socket.emit('message:read', {
          messageIds: [processedMsg._id],
          conversationId: activeConversation._id,
          senderId: processedMsg.sender?._id,
        });
      }

      // Update conversations list with latest message preview
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === newMsg.conversation) {
            return {
              ...c,
              lastMessage: newMsg,
              lastMessageAt: newMsg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        })
      );
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    };

    const handleMessageDeleted = ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
        )
      );
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:reaction', handleReactionUpdate);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:reaction', handleReactionUpdate);
      socket.off('message:deleted', handleMessageDeleted);
    };
  }, [socket, activeConversation?._id]);

  // Send message handler
  const sendMessage = async ({
    content = '',
    type = 'text',
    mediaUrl = '',
    mediaMeta = {},
    poll = null,
    isViewOnce = false,
  }) => {
    if (!activeConversation) return;

    try {
      let isEncrypted = false;
      let encryptedPayload = '';
      let nonce = '';

      // Perform local E2EE if direct chat with recipient public key
      if (type === 'text' && !activeConversation.isGroup && !activeConversation.isChannel) {
        const recipient = activeConversation.participants?.find((p) => (p.user?._id || p._id) !== user?._id);
        const recipientPub = recipient?.user?.publicKey || recipient?.publicKey;

        if (recipientPub) {
          try {
            const encrypted = await encryptMessage(content, recipientPub);
            encryptedPayload = encrypted.encryptedPayload;
            nonce = encrypted.nonce;
            isEncrypted = true;
          } catch (e) {
            console.warn('Encryption fallback to plain transport:', e);
          }
        }
      }

      const messagePayload = {
        conversationId: activeConversation._id,
        content,
        type,
        mediaUrl,
        mediaMeta,
        poll,
        isViewOnce,
        isEncrypted,
        encryptedPayload,
        nonce,
        replyTo: replyingTo?._id,
      };

      const res = await chatService.sendMessage(messagePayload);
      if (res.success && res.message) {
        const fullMsg = { ...res.message, decryptedContent: content };
        setMessages((prev) => {
          if (prev.some((m) => m._id === fullMsg._id)) return prev;
          return [...prev, fullMsg];
        });
        setReplyingTo(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // React to a message
  const reactToMessage = async (messageId, emoji) => {
    try {
      const res = await chatService.reactToMessage(messageId, emoji);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: res.reactions } : m))
        );
      }
    } catch (e) {
      console.error('Reaction error', e);
    }
  };

  // Vote on poll
  const votePoll = async (messageId, optionIndex) => {
    try {
      const res = await chatService.votePoll(messageId, optionIndex);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, poll: res.poll } : m))
        );
      }
    } catch (e) {
      console.error('Poll vote error', e);
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
        )
      );
    } catch (e) {
      console.error('Delete message error', e);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        loadingConversations,
        loadingMessages,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        infoDrawerOpen,
        setInfoDrawerOpen,
        replyingTo,
        setReplyingTo,
        fetchConversations,
        sendMessage,
        reactToMessage,
        votePoll,
        deleteMessage,
        fingerprint,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
