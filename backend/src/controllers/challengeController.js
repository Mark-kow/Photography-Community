const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取挑战赛列表
 */
exports.getChallenges = async (req, res) => {
  try {
    const { status, difficulty, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let conditions = [];
    let params = [];

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    } else {
      // 默认显示报名中、进行中和评选中的挑战赛
      conditions.push('status IN (1, 2, 3)');
    }

    if (difficulty) {
      conditions.push('difficulty = ?');
      params.push(difficulty);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM challenges ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [challenges] = await db.query(
      `SELECT * FROM challenges ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(challenges, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取挑战赛列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取挑战赛列表失败'));
  }
};

/**
 * 获取挑战赛详情
 */
exports.getChallengeById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const [challenges] = await db.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (challenges.length === 0) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    const challenge = challenges[0];

    // 更新浏览量
    await db.query(
      'UPDATE challenges SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    // 获取参赛作品列表（前20个，按投票数排序）
    const [works] = await db.query(
      `SELECT cw.*, w.title, w.description, w.images, w.created_at as work_created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM challenge_works cw
       JOIN works w ON cw.work_id = w.id
       JOIN users u ON cw.user_id = u.id
       WHERE cw.challenge_id = ?
       ORDER BY cw.vote_count DESC, cw.score DESC
       LIMIT 20`,
      [id]
    );
    challenge.top_works = works;

    // 如果用户已登录，检查是否已参赛和投票情况
    if (currentUserId) {
      const [userWorks] = await db.query(
        'SELECT work_id FROM challenge_works WHERE challenge_id = ? AND user_id = ?',
        [id, currentUserId]
      );
      challenge.user_participated = userWorks.length > 0;
      challenge.user_work_id = userWorks.length > 0 ? userWorks[0].work_id : null;

      // 获取用户已投票的作品ID列表
      const [votes] = await db.query(
        'SELECT work_id FROM challenge_votes WHERE challenge_id = ? AND user_id = ?',
        [id, currentUserId]
      );
      challenge.user_voted_works = votes.map(v => v.work_id);
    }

    res.json(successResponse(challenge));
  } catch (error) {
    console.error('获取挑战赛详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取挑战赛详情失败'));
  }
};

/**
 * 参赛（提交作品）
 */
exports.submitWork = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { challengeId, workId } = req.body;

    if (!challengeId || !workId) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 检查挑战赛是否存在和状态
    const [challenges] = await db.query(
      'SELECT status, end_time FROM challenges WHERE id = ?',
      [challengeId]
    );

    if (challenges.length === 0) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    const challenge = challenges[0];

    if (challenge.status === 0) {
      return res.status(400).json(errorResponse(10001, '挑战赛未开始'));
    }

    if (challenge.status > 2) {
      return res.status(400).json(errorResponse(10001, '挑战赛已结束报名'));
    }

    // 检查作品是否属于当前用户
    const [works] = await db.query(
      'SELECT id FROM works WHERE id = ? AND user_id = ?',
      [workId, userId]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(40401, '作品不存在或无权限'));
    }

    // 检查是否已参赛
    const [existing] = await db.query(
      'SELECT id FROM challenge_works WHERE challenge_id = ? AND user_id = ?',
      [challengeId, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经参加过该挑战赛'));
    }

    // 提交作品
    await db.query(
      'INSERT INTO challenge_works (challenge_id, work_id, user_id) VALUES (?, ?, ?)',
      [challengeId, workId, userId]
    );

    // 更新挑战赛统计
    await db.query(
      `UPDATE challenges 
       SET participant_count = participant_count + 1, 
           work_count = work_count + 1 
       WHERE id = ?`,
      [challengeId]
    );

    res.json(successResponse(null, '参赛成功'));
  } catch (error) {
    console.error('提交作品失败:', error);
    res.status(500).json(errorResponse(50001, '提交作品失败'));
  }
};

/**
 * 投票
 */
exports.voteWork = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { challengeId, workId } = req.body;

    if (!challengeId || !workId) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 检查挑战赛状态
    const [challenges] = await db.query(
      'SELECT status FROM challenges WHERE id = ?',
      [challengeId]
    );

    if (challenges.length === 0) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    if (challenges[0].status !== 2 && challenges[0].status !== 3) {
      return res.status(400).json(errorResponse(10001, '当前不在投票期'));
    }

    // 检查作品是否存在于该挑战赛中
    const [challengeWorks] = await db.query(
      'SELECT id FROM challenge_works WHERE challenge_id = ? AND work_id = ?',
      [challengeId, workId]
    );

    if (challengeWorks.length === 0) {
      return res.status(404).json(errorResponse(40401, '作品不存在'));
    }

    // 检查是否已投票
    const [existing] = await db.query(
      'SELECT id FROM challenge_votes WHERE challenge_id = ? AND work_id = ? AND user_id = ?',
      [challengeId, workId, userId]
    );

    if (existing.length > 0) {
      return res.status(409).json(errorResponse(10001, '已经投过票了'));
    }

    // 投票
    await db.query(
      'INSERT INTO challenge_votes (challenge_id, work_id, user_id) VALUES (?, ?, ?)',
      [challengeId, workId, userId]
    );

    // 更新作品投票数
    await db.query(
      'UPDATE challenge_works SET vote_count = vote_count + 1 WHERE challenge_id = ? AND work_id = ?',
      [challengeId, workId]
    );

    res.json(successResponse(null, '投票成功'));
  } catch (error) {
    console.error('投票失败:', error);
    res.status(500).json(errorResponse(50001, '投票失败'));
  }
};

/**
 * 取消投票
 */
exports.cancelVote = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { challengeId, workId } = req.body;

    if (!challengeId || !workId) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 删除投票
    const [result] = await db.query(
      'DELETE FROM challenge_votes WHERE challenge_id = ? AND work_id = ? AND user_id = ?',
      [challengeId, workId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '未投过票'));
    }

    // 更新作品投票数
    await db.query(
      'UPDATE challenge_works SET vote_count = vote_count - 1 WHERE challenge_id = ? AND work_id = ? AND vote_count > 0',
      [challengeId, workId]
    );

    res.json(successResponse(null, '已取消投票'));
  } catch (error) {
    console.error('取消投票失败:', error);
    res.status(500).json(errorResponse(50001, '取消投票失败'));
  }
};

/**
 * 获取挑战赛作品列表
 */
exports.getChallengeWorks = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { sortBy = 'vote', page = 1, pageSize = 20 } = req.query; // sortBy: vote-投票, score-评分, time-时间
    const offset = (page - 1) * pageSize;

    let orderBy = 'cw.vote_count DESC';
    if (sortBy === 'score') {
      orderBy = 'cw.score DESC, cw.vote_count DESC';
    } else if (sortBy === 'time') {
      orderBy = 'cw.created_at DESC';
    }

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM challenge_works WHERE challenge_id = ?',
      [challengeId]
    );
    const total = countResult[0].total;

    // 获取作品列表
    const [works] = await db.query(
      `SELECT cw.*, w.title, w.description, w.images, w.created_at as work_created_at,
              u.id as user_id, u.nickname, u.avatar
       FROM challenge_works cw
       JOIN works w ON cw.work_id = w.id
       JOIN users u ON cw.user_id = u.id
       WHERE cw.challenge_id = ?
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [challengeId, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(works, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取挑战赛作品列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取挑战赛作品列表失败'));
  }
};

/**
 * 获取我参与的挑战赛
 */
exports.getMyChallenges = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取总数
    const [countResult] = await db.query(
      'SELECT COUNT(DISTINCT cw.challenge_id) as total FROM challenge_works cw WHERE cw.user_id = ?',
      [userId]
    );
    const total = countResult[0].total;

    // 获取列表
    const [challenges] = await db.query(
      `SELECT c.*, cw.work_id, cw.vote_count, cw.score, cw.ranking
       FROM challenge_works cw
       JOIN challenges c ON cw.challenge_id = c.id
       WHERE cw.user_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(challenges, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取我的挑战赛失败:', error);
    res.status(500).json(errorResponse(50001, '获取我的挑战赛失败'));
  }
};
