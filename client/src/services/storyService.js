import api from './api';

export const storyService = {
  async getActiveStories() {
    const response = await api.get('/stories');
    return response.data;
  },

  async createStory(storyData) {
    const response = await api.post('/stories', storyData);
    return response.data;
  },

  async viewStory(storyId) {
    const response = await api.post(`/stories/${storyId}/view`);
    return response.data;
  },

  async deleteStory(storyId) {
    const response = await api.delete(`/stories/${storyId}`);
    return response.data;
  },
};
