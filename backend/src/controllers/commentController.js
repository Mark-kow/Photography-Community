const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取作品评论列表
 */
exports.getWorkComments = async (req, res) => {
  try {
    const workId = req.params.workId;
    const currentUserId = req.user?.userId;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 20;
    const offset = (page - 1) * pageSize;

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT id FROM works WHERE id = ? AND status = 1',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM comments WHERE work_id = ? AND status = 1 AND parent_id IS NULL',
      [workId]
    );
    const total = countResult[0].total;

    // 获取评论列表（仅顶级评论）
    const [comments] = await db.query(
      `SELECT c.id, c.content, c.like_count, c.created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.work_id = ? AND c.status = 1 AND c.parent_id IS NULL
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [workId, pageSize, offset]
    );

    // 获取每条评论的回复数量和部分回复
    for (const comment of comments) {
      // 获取回复数量
      const [replyCount] = await db.query(
        'SELECT COUNT(*) as count FROM comments WHERE parent_id = ? AND status = 1',
        [comment.id]
      );
      comment.reply_count = replyCount[0].count;

      // 获取最新2条回复
      const [replies] = await db.query(
        `SELECT c.id, c.content, c.created_at,
                u.id as user_id, u.nickname, u.avatar
         FROM comments c
         JOIN users u ON c.user_id = u.id
         WHERE c.parent_id = ? AND c.status = 1
         ORDER BY c.created_at ASC
         LIMIT 2`,
        [comment.id]
      );
      comment.replies = replies;

      // 如果已登录，检查点赞状态
      if (currentUserId) {
        const [likes] = await db.query(
          'SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "comment"',
          [currentUserId, comment.id]
        );
        comment.is_liked = likes.length > 0;
      }
    }

    res.json(paginationResponse(comments, page, pageSize, total));
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取评论列表失败'));
  }
};

/**
 * 发表评论
 */
exports.createComment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { workId, content, parentId } = req.body;

    // 验证必填字段
    if (!workId || !content) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 验证内容长度
    if (content.length > 500) {
      return res.status(400).json(errorResponse(10001, '评论内容不能超过500字'));
    }

    // 检查作品是否存在
    const [works] = await db.query(
      'SELECT id FROM works WHERE id = ? AND status = 1',
      [workId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(30001, '作品不存在'));
    }

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const [parentComments] = await db.query(
        'SELECT id FROM comments WHERE id = ? AND work_id = ? AND status = 1',
        [parentId, workId]
      );

      if (parentComments.length === 0) {
        return res.status(404).json(errorResponse(10001, '父评论不存在'));
      }
    }

    // 插入评论
    const [result] = await db.query(
      'INSERT INTO comments (work_id, user_id, parent_id, content) VALUES (?, ?, ?, ?)',
      [workId, userId, parentId || null, content]
    );

    const commentId = result.insertId;

    // 更新作品评论数（仅顶级评论）
    if (!parentId) {
      await db.query(
        'UPDATE works SET comment_count = comment_count + 1 WHERE id = ?',
        [workId]
      );
    }

    res.status(201).json(successResponse({ id: commentId }, '评论成功'));
  } catch (error) {
    console.error('发表评论失败:', error);
    res.status(500).json(errorResponse(50001, '发表评论失败'));
  }
};

/**
 * 删除评论
 */
exports.deleteComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    // 检查评论是否存在且属于当前用户
    const [comments] = await db.query(
      'SELECT work_id, parent_id FROM comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (comments.length === 0) {
      return res.status(404).json(errorResponse(10001, '评论不存在或无权限'));
    }

    const comment = comments[0];

    // 软删除评论
    await db.query(
      'UPDATE comments SET status = 0 WHERE id = ?',
      [commentId]
    );

    // 如果是顶级评论，更新作品评论数
    if (!comment.parent_id) {
      await db.query(
        'UPDATE works SET comment_count = comment_count - 1 WHERE id = ? AND comment_count > 0',
        [comment.work_id]
      );
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json(errorResponse(50001, '删除评论失败'));
  }
};

/**
 * 点赞评论
 */
exports.likeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    // 检查评论是否存在
    const [comments] = await db.query(
      'SELECT id FROM comments WHERE id = ? AND status = 1',
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json(errorResponse(10001, '评论不存在'));
    }

    // 检查是否已点赞
    const [existing] = await db.query(
      'SELECT id FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "comment"',
      [userId, commentId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经点赞过'));
    }

    // 添加点赞
    await db.query(
      'INSERT INTO likes (user_id, target_id, target_type) VALUES (?, ?, "comment")',
      [userId, commentId]
    );

    // 更新评论点赞数
    await db.query(
      'UPDATE comments SET like_count = like_count + 1 WHERE id = ?',
      [commentId]
    );

    res.json(successResponse(null, '点赞成功'));
  } catch (error) {
    console.error('点赞评论失败:', error);
    res.status(500).json(errorResponse(50001, '点赞评论失败'));
  }
};

/**
 * 取消点赞评论
 */
exports.unlikeComment = async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    // 删除点赞
    const [result] = await db.query(
      'DELETE FROM likes WHERE user_id = ? AND target_id = ? AND target_type = "comment"',
      [userId, commentId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(10001, '未点赞该评论'));
    }

    // 更新评论点赞数
    await db.query(
      'UPDATE comments SET like_count = like_count - 1 WHERE id = ? AND like_count > 0',
      [commentId]
    );

    res.json(successResponse(null, '取消点赞成功'));
  } catch (error) {
    console.error('取消点赞评论失败:', error);
    res.status(500).json(errorResponse(50001, '取消点赞评论失败'));
  }
};
