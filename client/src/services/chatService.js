import api from './api';

export const chatService = {
  async getConversations() {
    const response = await api.get('/chats');
    return response.data;
  },

  async getOrCreateDirectChat(recipientId) {
    const response = await api.post('/chats/direct', { recipientId });
    return response.data;
  },

  async getMessages(conversationId, page = 1) {
    const response = await api.get(`/messages/${conversationId}?page=${page}&limit=50`);
    return response.data;
  },

  async sendMessage(messageData) {
    const response = await api.post('/messages', messageData);
    return response.data;
  },

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async reactToMessage(messageId, emoji) {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  async votePoll(messageId, optionId) {
    const response = await api.post(`/messages/${messageId}/poll/vote`, { optionId });
    return response.data;
  },

  async deleteMessage(messageId, deleteForEveryone = false) {
    const response = await api.delete(`/messages/${messageId}`, {
      data: { deleteForEveryone },
    });
    return response.data;
  },

  async starMessage(messageId) {
    const response = await api.post(`/messages/${messageId}/star`);
    return response.data;
  },

  async createGroup(groupData) {
    const response = await api.post('/groups', groupData);
    return response.data;
  },

  async updateGroup(groupId, groupData) {
    const response = await api.put(`/groups/${groupId}`, groupData);
    return response.data;
  },

  async manageGroupMembers(groupId, memberData) {
    const response = await api.post(`/groups/${groupId}/members`, memberData);
    return response.data;
  },

  async createChannel(channelData) {
    const response = await api.post('/channels', channelData);
    return response.data;
  },

  async exploreChannels() {
    const response = await api.get('/channels/explore');
    return response.data;
  },

  async toggleSubscribeChannel(channelId) {
    const response = await api.post(`/channels/${channelId}/subscribe`);
    return response.data;
  },

  async searchUsers(query) {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  async updateProfile(profileData) {
    const response = await api.put('/users/profile', profileData);
    return response.data;
  },

  async updateSettings(settingsData) {
    const response = await api.put('/users/settings', settingsData);
    return response.data;
  },

  async updatePublicKey(keysData) {
    const response = await api.put('/users/keys', keysData);
    return response.data;
  },

  async getCallHistory() {
    const response = await api.get('/calls/history');
    return response.data;
  },

  async logCall(callData) {
    const response = await api.post('/calls/log', callData);
    return response.data;
  },

  async submitReport(reportData) {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  // Connection & Block system
  async sendFriendRequest(recipientId, message) {
    const response = await api.post('/users/requests/send', { recipientId, message });
    return response.data;
  },

  async getFriendRequests() {
    const response = await api.get('/users/requests/list');
    return response.data;
  },

  async getRequests() {
    return this.getFriendRequests();
  },

  async respondFriendRequest(requestId, action) {
    const response = await api.post(`/users/requests/${requestId}/respond`, { action });
    return response.data;
  },

  async cancelFriendRequest(requestId) {
    const response = await api.post(`/users/requests/${requestId}/cancel`);
    return response.data;
  },

  async toggleBlockUser(userId) {
    const response = await api.post(`/users/block/${userId}`);
    return response.data;
  },

  async getBlockedUsers() {
    const response = await api.get('/users/blocked/list');
    return response.data;
  },
};
