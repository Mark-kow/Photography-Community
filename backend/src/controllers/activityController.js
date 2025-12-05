const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取活动列表
 */
exports.getActivities = async (req, res) => {
  try {
    const { activityType, location, status, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let conditions = [];
    let params = [];

    if (activityType) {
      conditions.push('a.activity_type = ?');
      params.push(activityType);
    }
    if (location) {
      conditions.push('a.location LIKE ?');
      params.push(`%${location}%`);
    }
    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    } else {
      // 默认只显示招募中和已满员的活动
      conditions.push('a.status IN (1, 2)');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM activities a ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [activities] = await db.query(
      `SELECT a.*, u.nickname as creator_name, u.avatar as creator_avatar
       FROM activities a
       JOIN users u ON a.creator_id = u.id
       ${whereClause}
       ORDER BY a.start_time ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(activities, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取活动列表失败'));
  }
};

/**
 * 获取活动详情
 */
exports.getActivityById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    const [activities] = await db.query(
      `SELECT a.*, u.nickname as creator_name, u.avatar as creator_avatar
       FROM activities a
       JOIN users u ON a.creator_id = u.id
       WHERE a.id = ?`,
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    const activity = activities[0];

    // 获取参与者列表
    const [participants] = await db.query(
      `SELECT u.id, u.nickname, u.avatar, ap.status, ap.created_at
       FROM activity_participants ap
       JOIN users u ON ap.user_id = u.id
       WHERE ap.activity_id = ? AND ap.status != 0
       ORDER BY ap.created_at ASC`,
      [id]
    );
    activity.participants = participants;

    // 如果用户已登录，检查是否已报名
    if (currentUserId) {
      const [userParticipant] = await db.query(
        'SELECT status FROM activity_participants WHERE activity_id = ? AND user_id = ?',
        [id, currentUserId]
      );
      activity.user_participated = userParticipant.length > 0 ? userParticipant[0].status : 0;
    }

    res.json(successResponse(activity));
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取活动详情失败'));
  }
};

/**
 * 创建活动
 */
exports.createActivity = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const {
      title, coverImage, description, activityType, location, latitude, longitude,
      startTime, endTime, maxParticipants, feeType, feeAmount,
      requirements, schedule, notes, tags
    } = req.body;

    if (!title || !startTime || !location) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO activities (
        creator_id, title, cover_image, description, activity_type, location,
        latitude, longitude, start_time, end_time, max_participants, fee_type,
        fee_amount, requirements, schedule, notes, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creatorId, title, coverImage, description, activityType, location,
        latitude, longitude, startTime, endTime, maxParticipants || 0, feeType,
        feeAmount || 0, requirements, schedule, notes, JSON.stringify(tags)
      ]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json(errorResponse(50001, '创建活动失败'));
  }
};

/**
 * 更新活动
 */
exports.updateActivity = async (req, res) => {
  try {
    const creatorId = req.user.userId;
    const { id } = req.params;
    const updateData = req.body;

    // 验证是否是创建者
    const [activities] = await db.query(
      'SELECT creator_id FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    if (activities[0].creator_id !== creatorId) {
      return res.status(403).json(errorResponse(40301, '无权限修改'));
    }

    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'title', 'cover_image', 'description', 'activity_type', 'location',
      'latitude', 'longitude', 'start_time', 'end_time', 'max_participants',
      'fee_type', 'fee_amount', 'requirements', 'schedule', 'notes', 'tags', 'status'
    ];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        updateFields.push(`${dbField} = ?`);
        updateValues.push(field === 'tags' ? JSON.stringify(updateData[field]) : updateData[field]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(10001, '没有需要更新的字段'));
    }

    updateValues.push(id);

    await db.query(
      `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json(errorResponse(50001, '更新活动失败'));
  }
};

/**
 * 报名参加活动
 */
exports.joinActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { message: userMessage } = req.body;

    // 获取活动信息
    const [activities] = await db.query(
      'SELECT max_participants, current_participants, status FROM activities WHERE id = ?',
      [id]
    );

    if (activities.length === 0) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    const activity = activities[0];

    if (activity.status === 0) {
      return res.status(400).json(errorResponse(10001, '活动已取消'));
    }

    if (activity.status === 4) {
      return res.status(400).json(errorResponse(10001, '活动已结束'));
    }

    // 检查人数限制
    if (activity.max_participants > 0 && activity.current_participants >= activity.max_participants) {
      return res.status(400).json(errorResponse(10001, '活动已满员'));
    }

    // 检查是否已报名
    const [existing] = await db.query(
      'SELECT id, status FROM activity_participants WHERE activity_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0 && existing[0].status !== 0) {
      return res.status(409).json(errorResponse(10001, '已经报名过该活动'));
    }

    // 报名
    if (existing.length > 0) {
      // 重新报名
      await db.query(
        'UPDATE activity_participants SET status = 1, message = ? WHERE activity_id = ? AND user_id = ?',
        [userMessage, id, userId]
      );
    } else {
      await db.query(
        'INSERT INTO activity_participants (activity_id, user_id, message) VALUES (?, ?, ?)',
        [id, userId, userMessage]
      );
    }

    // 更新活动参与人数
    await db.query(
      'UPDATE activities SET current_participants = current_participants + 1 WHERE id = ?',
      [id]
    );

    // 检查是否满员
    const [updated] = await db.query(
      'SELECT max_participants, current_participants FROM activities WHERE id = ?',
      [id]
    );
    
    if (updated[0].max_participants > 0 && updated[0].current_participants >= updated[0].max_participants) {
      await db.query('UPDATE activities SET status = 2 WHERE id = ?', [id]);
    }

    res.json(successResponse(null, '报名成功'));
  } catch (error) {
    console.error('报名活动失败:', error);
    res.status(500).json(errorResponse(50001, '报名活动失败'));
  }
};

/**
 * 取消报名
 */
exports.cancelParticipation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE activity_participants SET status = 0 WHERE activity_id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '未报名该活动'));
    }

    // 更新活动参与人数
    await db.query(
      'UPDATE activities SET current_participants = current_participants - 1 WHERE id = ? AND current_participants > 0',
      [id]
    );

    // 如果之前是满员状态，改为招募中
    await db.query(
      'UPDATE activities SET status = 1 WHERE id = ? AND status = 2',
      [id]
    );

    res.json(successResponse(null, '已取消报名'));
  } catch (error) {
    console.error('取消报名失败:', error);
    res.status(500).json(errorResponse(50001, '取消报名失败'));
  }
};

/**
 * 获取我参与的活动
 */
exports.getMyActivities = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type = 'joined', page = 1, pageSize = 20 } = req.query; // type: joined-已报名, created-我创建的
    const offset = (page - 1) * pageSize;

    let query, countQuery, params;

    if (type === 'created') {
      // 我创建的活动
      countQuery = 'SELECT COUNT(*) as total FROM activities WHERE creator_id = ?';
      query = `
        SELECT a.*, u.nickname as creator_name, u.avatar as creator_avatar
        FROM activities a
        JOIN users u ON a.creator_id = u.id
        WHERE a.creator_id = ?
        ORDER BY a.created_at DESC
        LIMIT ? OFFSET ?
      `;
      params = [userId];
    } else {
      // 我参与的活动
      countQuery = `
        SELECT COUNT(*) as total 
        FROM activity_participants ap 
        WHERE ap.user_id = ? AND ap.status = 1
      `;
      query = `
        SELECT a.*, u.nickname as creator_name, u.avatar as creator_avatar, ap.status as my_status
        FROM activity_participants ap
        JOIN activities a ON ap.activity_id = a.id
        JOIN users u ON a.creator_id = u.id
        WHERE ap.user_id = ? AND ap.status = 1
        ORDER BY a.start_time ASC
        LIMIT ? OFFSET ?
      `;
      params = [userId];
    }

    const [countResult] = await db.query(countQuery, params);
    const total = countResult[0].total;

    const [activities] = await db.query(query, [...params, parseInt(pageSize), offset]);

    res.json(paginationResponse(activities, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取我的活动失败:', error);
    res.status(500).json(errorResponse(50001, '获取我的活动失败'));
  }
};
