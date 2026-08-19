const Story = require('../models/Story');
const User = require('../models/User');

// @desc Get active stories (from contacts/self)
// @route GET /api/stories
exports.getActiveStories = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    // Fetch active stories
    const stories = await Story.find({
      expiresAt: { $gt: now },
    })
      .populate('user', 'name username avatar')
      .populate('viewers.user', 'name username avatar')
      .sort({ createdAt: -1 });

    // Group stories by user
    const grouped = {};
    stories.forEach((story) => {
      if (!story.user) return;
      const uid = story.user._id.toString();
      if (!grouped[uid]) {
        grouped[uid] = {
          user: story.user,
          stories: [],
          hasUnviewed: false,
        };
      }
      const isViewed = story.viewers.some((v) => v.user && v.user._id.toString() === userId.toString());
      if (!isViewed && uid !== userId.toString()) {
        grouped[uid].hasUnviewed = true;
      }
      grouped[uid].stories.push(story);
    });

    res.status(200).json({
      success: true,
      storyFeed: Object.values(grouped),
    });
  } catch (error) {
    next(error);
  }
};

// @desc Post a new status/story
// @route POST /api/stories
exports.createStory = async (req, res, next) => {
  try {
    const { type = 'text', content, mediaUrl, backgroundColor, caption, privacy } = req.body;
    const userId = req.user._id;

    if (type === 'text' && !content) {
      return res.status(400).json({ success: false, message: 'Text story content cannot be empty.' });
    }
    if ((type === 'image' || type === 'video') && !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Media URL is required for image/video story.' });
    }

    const story = await Story.create({
      user: userId,
      type,
      content: content || '',
      mediaUrl: mediaUrl || '',
      backgroundColor: backgroundColor || '#4f46e5',
      caption: caption || '',
      privacy: privacy || 'contacts',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    const populatedStory = await Story.findById(story._id).populate('user', 'name username avatar');

    res.status(201).json({
      success: true,
      message: 'Status published for 24 hours.',
      story: populatedStory,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark story as viewed
// @route POST /api/stories/:id/view
exports.viewStory = async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story expired or not found.' });
    }

    const alreadyViewed = story.viewers.some((v) => v.user.toString() === userId.toString());
    if (!alreadyViewed && story.user.toString() !== userId.toString()) {
      story.viewers.push({ user: userId, viewedAt: new Date() });
      await story.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @desc Delete own story
// @route DELETE /api/stories/:id
exports.deleteStory = async (req, res, next) => {
  try {
    const storyId = req.params.id;
    const userId = req.user._id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    if (story.user.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only delete your own status.' });
    }

    await Story.findByIdAndDelete(storyId);

    res.status(200).json({
      success: true,
      message: 'Status deleted.',
    });
  } catch (error) {
    next(error);
  }
};
