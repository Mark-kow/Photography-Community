const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取当前用户信息
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await db.query(
      `SELECT id, phone, nickname, avatar, bio, gender, birthday, location, 
              followers_count, following_count, works_count, likes_count, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse(20001, '用户不存在'));
    }

    res.json(successResponse(users[0]));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户信息失败'));
  }
};

/**
 * 更新当前用户信息
 */
exports.updateCurrentUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { nickname, avatar, bio, gender, birthday, location } = req.body;

    const updateFields = [];
    const updateValues = [];

    if (nickname) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (avatar !== undefined) {
      updateFields.push('avatar = ?');
      updateValues.push(avatar);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      updateValues.push(gender);
    }
    if (birthday !== undefined) {
      updateFields.push('birthday = ?');
      updateValues.push(birthday);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(10001, '没有需要更新的字段'));
    }

    updateValues.push(userId);

    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json(errorResponse(50001, '更新用户信息失败'));
  }
};

/**
 * 获取用户资料
 */
exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user?.userId;

    const [users] = await db.query(
      `SELECT id, nickname, avatar, bio, gender, location,
              followers_count, following_count, works_count, likes_count, created_at
       FROM users WHERE id = ? AND status = 1`,
      [targetUserId]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse(20001, '用户不存在'));
    }

    const user = users[0];

    // 如果已登录，检查是否已关注
    if (currentUserId) {
      const [follows] = await db.query(
        'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
        [currentUserId, targetUserId]
      );
      user.is_following = follows.length > 0;
    }

    res.json(successResponse(user));
  } catch (error) {
    console.error('获取用户资料失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户资料失败'));
  }
};

/**
 * 获取用户作品列表
 */
exports.getUserWorks = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM works WHERE user_id = ? AND status = 1',
      [userId]
    );
    const total = countResult[0].total;

    // 获取作品列表
    const [works] = await db.query(
      `SELECT w.id, w.title, w.description, w.images, w.location, 
              w.like_count, w.comment_count, w.view_count, w.created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.user_id = ? AND w.status = 1
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    // MySQL2会自动解析JSON字段,无需手动解析
    // works.forEach(work => {
    //   work.images = JSON.parse(work.images);
    // });

    res.json(paginationResponse(works, page, pageSize, total));
  } catch (error) {
    console.error('获取用户作品失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户作品失败'));
  }
};

/**
 * 关注用户
 */
exports.followUser = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followeeId = parseInt(req.params.id);

    // 不能关注自己
    if (followerId === followeeId) {
      return res.status(400).json(errorResponse(10001, '不能关注自己'));
    }

    // 检查目标用户是否存在
    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ? AND status = 1',
      [followeeId]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse(20001, '用户不存在'));
    }

    // 检查是否已关注
    const [existing] = await db.query(
      'SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, followeeId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经关注过该用户'));
    }

    // 创建关注关系
    await db.query(
      'INSERT INTO follows (follower_id, followee_id) VALUES (?, ?)',
      [followerId, followeeId]
    );

    // 更新计数
    await db.query(
      'UPDATE users SET following_count = following_count + 1 WHERE id = ?',
      [followerId]
    );
    await db.query(
      'UPDATE users SET followers_count = followers_count + 1 WHERE id = ?',
      [followeeId]
    );

    res.json(successResponse(null, '关注成功'));
  } catch (error) {
    console.error('关注用户失败:', error);
    res.status(500).json(errorResponse(50001, '关注用户失败'));
  }
};

/**
 * 取消关注
 */
exports.unfollowUser = async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followeeId = parseInt(req.params.id);

    // 删除关注关系
    const [result] = await db.query(
      'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, followeeId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(10001, '未关注该用户'));
    }

    // 更新计数
    await db.query(
      'UPDATE users SET following_count = following_count - 1 WHERE id = ? AND following_count > 0',
      [followerId]
    );
    await db.query(
      'UPDATE users SET followers_count = followers_count - 1 WHERE id = ? AND followers_count > 0',
      [followeeId]
    );

    res.json(successResponse(null, '取消关注成功'));
  } catch (error) {
    console.error('取消关注失败:', error);
    res.status(500).json(errorResponse(50001, '取消关注失败'));
  }
};

/**
 * 获取关注列表
 */
exports.getFollowing = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM follows WHERE follower_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // 获取关注列表
    const [users] = await db.query(
      `SELECT u.id, u.nickname, u.avatar, u.bio, u.followers_count, u.works_count
       FROM follows f
       JOIN users u ON f.followee_id = u.id
       WHERE f.follower_id = ? AND u.status = 1
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    res.json(paginationResponse(users, page, pageSize, total));
  } catch (error) {
    console.error('获取关注列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取关注列表失败'));
  }
};

/**
 * 获取粉丝列表
 */
exports.getFollowers = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM follows WHERE followee_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // 获取粉丝列表
    const [users] = await db.query(
      `SELECT u.id, u.nickname, u.avatar, u.bio, u.followers_count, u.works_count
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.followee_id = ? AND u.status = 1
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    res.json(paginationResponse(users, page, pageSize, total));
  } catch (error) {
    console.error('获取粉丝列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取粉丝列表失败'));
  }
};
