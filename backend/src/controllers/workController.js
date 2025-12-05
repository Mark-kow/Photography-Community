const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');
const { canEditWork, canDeleteWork } = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

/**
 * 上传图片
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse(10001, '没有上传文件'));
    }

    const imageUrl = `/uploads/works/${req.file.filename}`;
    
    res.json(successResponse({ 
      url: imageUrl,
      filename: req.file.filename
    }, '上传成功'));
  } catch (error) {
    console.error('上传图片失败:', error);
    res.status(500).json(errorResponse(50001, '上传图片失败'));
  }
};

/**
 * 发布作品
 */
exports.createWork = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      title, description, images, location, 
      camera, lens, aperture, shutter_speed, iso, focal_length, 
      tags 
    } = req.body;

    // 验证必填字段
    if (!images || images.length === 0) {
      return res.status(400).json(errorResponse(10001, '至少上传一张图片'));
    }

    // 插入作品
    const [result] = await db.query(
      `INSERT INTO works 
       (user_id, title, description, images, location, camera, lens, 
        aperture, shutter_speed, iso, focal_length, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId, title, description, JSON.stringify(images), location,
        camera, lens, aperture, shutter_speed, iso, focal_length,
        tags ? JSON.stringify(tags) : null
      ]
    );

    const workId = result.insertId;

    // 更新用户作品数
    await db.query(
      'UPDATE users SET works_count = works_count + 1 WHERE id = ?',
      [userId]
    );

    res.status(201).json(successResponse({ id: workId }, '发布成功'));
  } catch (error) {
    console.error('发布作品失败:', error);
    res.status(500).json(errorResponse(50001, '发布作品失败'));
  }
};

/**
 * 获取推荐Feed流（综合推荐算法：时间、点赞、评论、浏览量）
 */
exports.getFeed = async (req, res) => {
  try {
    const currentUserId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM works WHERE status = 1'
    );
    const total = countResult[0].total;

    // 获取作品列表，使用综合推荐算法
    // 推荐分数计算公式：
    // score = like_weight * like_count + comment_weight * comment_count + view_weight * view_count + time_weight * time_score
    // 时间分数：7天内作品获得加权（越新越高），7天后按时间递减
    const [works] = await db.query(
      `SELECT w.id, w.title, w.description, w.images, w.location, w.camera, w.tags,
              w.like_count, w.comment_count, w.view_count, w.created_at,
              u.id as user_id, u.nickname, u.avatar,
              (
                -- 点赞权重：3分/个
                w.like_count * 3 +
                -- 评论权重：5分/个（评论比点赞更有价值）
                w.comment_count * 5 +
                -- 浏览权重：0.1分/次（浏览量大但权重低）
                w.view_count * 0.1 +
                -- 时间新鲜度权重（7天内线性递减，7天后固定为0）
                CASE 
                  WHEN DATEDIFF(NOW(), w.created_at) <= 7 THEN 
                    (7 - DATEDIFF(NOW(), w.created_at)) * 10
                  ELSE 0
                END
              ) as recommend_score
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 1
       ORDER BY recommend_score DESC, w.created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, offset]
    );

    // 解析JSON字段（MySQL2会自动解析JSON类型，但为了兼容性检查一下）
    works.forEach(work => {
      if (typeof work.images === 'string') {
        work.images = JSON.parse(work.images);
      }
      if (work.tags && typeof work.tags === 'string') {
        work.tags = JSON.parse(work.tags);
      }
    });

    // 如果已登录，检查点赞和收藏状态
    if (currentUserId && works.length > 0) {
      const workIds = works.map(w => w.id);
      
      const [likes] = await db.query(
        'SELECT target_id FROM likes WHERE user_id = ? AND target_id IN (?) AND target_type = "work"',
        [currentUserId, workIds]
      );
      const likedIds = new Set(likes.map(l => l.target_id));
      
      const [collections] = await db.query(
        'SELECT work_id FROM collections WHERE user_id = ? AND work_id IN (?)',
        [currentUserId, workIds]
      );
      const collectedIds = new Set(collections.map(c => c.work_id));
      
      works.forEach(work => {
        work.is_liked = likedIds.has(work.id);
        work.is_collected = collectedIds.has(work.id);
      });
    }

    res.json(paginationResponse(works, page, pageSize, total));
  } catch (error) {
    console.error('获取Feed流失败:', error);
    res.status(500).json(errorResponse(50001, '获取Feed流失败'));
  }
};

/**
 * 获取关注动态
 */
exports.getFollowingFeed = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 获取关注的用户ID列表
    const [follows] = await db.query(
      'SELECT followee_id FROM follows WHERE follower_id = ?',
      [userId]
    );

    if (follows.length === 0) {
      return res.json(paginationResponse([], page, pageSize, 0));
    }

    const followeeIds = follows.map(f => f.followee_id);

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM works WHERE user_id IN (?) AND status = 1',
      [followeeIds]
    );
    const total = countResult[0].total;

    // 获取作品列表
    const [works] = await db.query(
      `SELECT w.id, w.title, w.description, w.images, w.location, w.camera, w.tags,
              w.like_count, w.comment_count, w.view_count, w.created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.user_id IN (?) AND w.status = 1
       ORDER BY w.created_at DESC
       LIMIT ? OFFSET ?`,
      [followeeIds, pageSize, offset]
    );

    // 解析JSON字段（MySQL2会自动解析JSON类型，但为了兼容性检查一下）
    works.forEach(work => {
      if (typeof work.images === 'string') {
        work.images = JSON.parse(work.images);
      }
      if (work.tags && typeof work.tags === 'string') {
        work.tags = JSON.parse(work.tags);
      }
    });

    res.json(paginationResponse(works, page, pageSize, total));
  } catch (error) {
    console.error('获取关注动态失败:', error);
    res.status(500).json(errorResponse(50001, '获取关注动态失败'));
  }
};

/**
 * 搜索作品
 */
exports.searchWorks = async (req, res) => {
  try {
    const { keyword } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    if (!keyword) {
      return res.status(400).json(errorResponse(10001, '请提供搜索关键词'));
    }

    const searchPattern = `%${keyword}%`;

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 1 AND (
         w.title LIKE ? OR 
         w.description LIKE ? OR 
         w.location LIKE ? OR
         u.nickname LIKE ?
       )`,
      [searchPattern, searchPattern, searchPattern, searchPattern]
    );
    const total = countResult[0].total;

    // 搜索作品
    const [works] = await db.query(
      `SELECT w.id, w.title, w.description, w.images, w.location, w.camera, w.tags,
              w.like_count, w.comment_count, w.view_count, w.created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.status = 1 AND (
         w.title LIKE ? OR 
         w.description LIKE ? OR 
         w.location LIKE ? OR
         u.nickname LIKE ?
       )
       ORDER BY w.like_count DESC, w.created_at DESC
       LIMIT ? OFFSET ?`,
      [searchPattern, searchPattern, searchPattern, searchPattern, pageSize, offset]
    );

    // 解析JSON字段（MySQL2会自动解析JSON类型，但为了兼容性检查一下）
    works.forEach(work => {
      if (typeof work.images === 'string') {
        work.images = JSON.parse(work.images);
      }
      if (work.tags && typeof work.tags === 'string') {
        work.tags = JSON.parse(work.tags);
      }
    });

    res.json(paginationResponse(works, page, pageSize, total));
  } catch (error) {
    console.error('搜索作品失败:', error);
    res.status(500).json(errorResponse(50001, '搜索作品失败'));
  }
};

/**
 * 获取作品详情
 */
exports.getWorkDetail = async (req, res) => {
  try {
    const workId = req.params.id;
    const currentUserId = req.user?.userId;

    const [works] = await db.query(
      `SELECT w.*, u.id as user_id, u.nickname, u.avatar, u.bio
       FROM works w
       JOIN users u ON w.user_id = u.id
       WHERE w.id = ? AND w.status = 1`,
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    const work = works[0];

    // 解析JSON字段（MySQL2会自动解析JSON类型，但为了兼容性检查一下）
    if (typeof work.images === 'string') {
      work.images = JSON.parse(work.images);
    }
    if (work.tags && typeof work.tags === 'string') {
      work.tags = JSON.parse(work.tags);
    }

    // 增加浏览量
    await db.query(
      'UPDATE works SET view_count = view_count + 1 WHERE id = ?',
      [workId]
    );

    // 如果已登录，检查点赞和收藏状态
    if (currentUserId) {
      const [likes] = await db.query(
        'SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "work"',
        [currentUserId, workId]
      );
      work.is_liked = likes.length > 0;

      const [collections] = await db.query(
        'SELECT id FROM collections WHERE user_id = ? AND work_id = ?',
        [currentUserId, workId]
      );
      work.is_collected = collections.length > 0;
    }

    res.json(successResponse(work));
  } catch (error) {
    console.error('获取作品详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取作品详情失败'));
  }
};

/**
 * 更新作品
 */
exports.updateWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const currentUser = req.user;
    const { title, description, location, camera, lens, aperture, shutter_speed, iso, focal_length, tags } = req.body;

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT * FROM works WHERE id = ?',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    const work = works[0];

    // 检查权限：普通用户只能编辑自己的作品，editor和admin可以编辑所有作品
    if (!canEditWork(work, currentUser)) {
      return res.status(403).json(errorResponse(40300, '无权编辑此作品'));
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) { updateFields.push('title = ?'); updateValues.push(title); }
    if (description !== undefined) { updateFields.push('description = ?'); updateValues.push(description); }
    if (location !== undefined) { updateFields.push('location = ?'); updateValues.push(location); }
    if (camera !== undefined) { updateFields.push('camera = ?'); updateValues.push(camera); }
    if (lens !== undefined) { updateFields.push('lens = ?'); updateValues.push(lens); }
    if (aperture !== undefined) { updateFields.push('aperture = ?'); updateValues.push(aperture); }
    if (shutter_speed !== undefined) { updateFields.push('shutter_speed = ?'); updateValues.push(shutter_speed); }
    if (iso !== undefined) { updateFields.push('iso = ?'); updateValues.push(iso); }
    if (focal_length !== undefined) { updateFields.push('focal_length = ?'); updateValues.push(focal_length); }
    if (tags !== undefined) { updateFields.push('tags = ?'); updateValues.push(JSON.stringify(tags)); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(10001, '没有需要更新的字段'));
    }

    updateValues.push(workId);

    await db.query(
      `UPDATE works SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新作品失败:', error);
    res.status(500).json(errorResponse(50001, '更新作品失败'));
  }
};

/**
 * 删除作品
 */
exports.deleteWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const currentUser = req.user;

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT * FROM works WHERE id = ?',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    const work = works[0];
    const workOwnerId = work.user_id;

    // 检查权限：只有管理员和作品所有者可以删除
    if (!canDeleteWork(work, currentUser)) {
      return res.status(403).json(errorResponse(40300, '无权删除此作品'));
    }

    // 软删除
    await db.query(
      'UPDATE works SET status = 2 WHERE id = ?',
      [workId]
    );

    // 更新用户作品数
    await db.query(
      'UPDATE users SET works_count = works_count - 1 WHERE id = ? AND works_count > 0',
      [workOwnerId]
    );

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json(errorResponse(50001, '删除作品失败'));
  }
};

/**
 * 点赞作品
 */
exports.likeWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.userId;

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT user_id FROM works WHERE id = ? AND status = 1',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    const workAuthorId = works[0].user_id;

    // 检查是否已点赞
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "work"',
      [userId, workId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经点赞过'));
    }

    // 添加点赞
    await db.query(
      'INSERT INTO likes (user_id, target_id, target_type) VALUES (?, ?, "work")',
      [userId, workId]
    );

    // 更新作品点赞数
    await db.query(
      'UPDATE works SET like_count = like_count + 1 WHERE id = ?',
      [workId]
    );

    // 更新作者获赞数
    await db.query(
      'UPDATE users SET likes_count = likes_count + 1 WHERE id = ?',
      [workAuthorId]
    );

    res.json(successResponse(null, '点赞成功'));
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json(errorResponse(50001, '点赞失败'));
  }
};

/**
 * 取消点赞
 */
exports.unlikeWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.userId;

    // 获取作品信息
    const [works] = await db.query(
      'SELECT user_id FROM works WHERE id = ?',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    const workAuthorId = works[0].user_id;

    // 删除点赞
    const [result] = await db.query(
      'DELETE FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "work"',
      [userId, workId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(10001, '未点赞该作品'));
    }

    // 更新作品点赞数
    await db.query(
      'UPDATE works SET like_count = like_count - 1 WHERE id = ? AND like_count > 0',
      [workId]
    );

    // 更新作者获赞数
    await db.query(
      'UPDATE users SET likes_count = likes_count - 1 WHERE id = ? AND likes_count > 0',
      [workAuthorId]
    );

    res.json(successResponse(null, '取消点赞成功'));
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json(errorResponse(50001, '取消点赞失败'));
  }
};

/**
 * 收藏作品
 */
exports.collectWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.userId;

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT id FROM works WHERE id = ? AND status = 1',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    // 检查是否已收藏
    const [existing] = await db.query(
      'SELECT id FROM collections WHERE user_id = ? AND work_id = ?',
      [userId, workId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经收藏过'));
    }

    // 添加收藏
    await db.query(
      'INSERT INTO collections (user_id, work_id) VALUES (?, ?)',
      [userId, workId]
    );

    // 更新作品收藏数
    await db.query(
      'UPDATE works SET collect_count = collect_count + 1 WHERE id = ?',
      [workId]
    );

    res.json(successResponse(null, '收藏成功'));
  } catch (error) {
    console.error('收藏失败:', error);
    res.status(500).json(errorResponse(50001, '收藏失败'));
  }
};

/**
 * 取消收藏
 */
exports.uncollectWork = async (req, res) => {
  try {
    const workId = req.params.id;
    const userId = req.user.userId;

    // 删除收藏
    const [result] = await db.query(
      'DELETE FROM collections WHERE user_id = ? AND work_id = ?',
      [userId, workId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(10001, '未收藏该作品'));
    }

    // 更新作品收藏数
    await db.query(
      'UPDATE works SET collect_count = collect_count - 1 WHERE id = ? AND collect_count > 0',
      [workId]
    );

    res.json(successResponse(null, '取消收藏成功'));
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json(errorResponse(50001, '取消收藏失败'));
  }
};
