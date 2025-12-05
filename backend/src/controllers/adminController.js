const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取管理后台统计数据
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // 获取用户统计
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_users_week,
        COUNT(CASE WHEN status = 1 THEN 1 END) as active_users
      FROM users
    `);

    // 获取作品统计
    const [workStats] = await db.query(`
      SELECT 
        COUNT(*) as total_works,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_works_week
      FROM works WHERE status = 1
    `);

    // 获取地点统计
    const [locationStats] = await db.query(`
      SELECT 
        COUNT(*) as total_locations,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as new_locations_week
      FROM locations WHERE status = 1
    `);

    // 获取打卡统计
    const [checkinStats] = await db.query(`
      SELECT COUNT(*) as total_checkins
      FROM location_checkins
    `);

    res.json(successResponse({
      users: userStats[0],
      works: workStats[0],
      locations: locationStats[0],
      checkins: checkinStats[0]
    }));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(errorResponse(50001, '获取统计数据失败'));
  }
};

/**
 * 获取地点列表（管理后台）
 */
exports.getLocationList = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      keyword,
      category,
      city,
      status
    } = req.query;

    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (keyword) {
      conditions.push('(name LIKE ? OR address LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (city) {
      conditions.push('city = ?');
      params.push(city);
    }

    if (status !== undefined) {
      conditions.push('status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM locations ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [locations] = await db.query(
      `SELECT 
        l.*,
        u.nickname as creator_name
      FROM locations l
      LEFT JOIN users u ON l.created_by = u.id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(locations, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取地点列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取地点列表失败'));
  }
};

/**
 * 获取地点详情（管理后台）
 */
exports.getLocationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [locations] = await db.query(
      `SELECT l.*, u.nickname as creator_name
       FROM locations l
       LEFT JOIN users u ON l.created_by = u.id
       WHERE l.id = ?`,
      [id]
    );

    if (locations.length === 0) {
      return res.status(404).json(errorResponse(40401, '地点不存在'));
    }

    res.json(successResponse(locations[0]));
  } catch (error) {
    console.error('获取地点详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取地点详情失败'));
  }
};

/**
 * 创建地点（管理后台）
 */
exports.createLocation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      address,
      province,
      city,
      district,
      latitude,
      longitude,
      cover_image,
      images,
      description,
      category,
      best_time,
      opening_hours,
      ticket_price,
      tips,
      recommended_params
    } = req.body;

    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO locations (
        name, address, province, city, district, latitude, longitude,
        cover_image, images, description, category, best_time,
        opening_hours, ticket_price, tips, recommended_params, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, address, province, city, district, latitude, longitude,
        cover_image, JSON.stringify(images), description, category, best_time,
        opening_hours, ticket_price, tips, JSON.stringify(recommended_params), userId
      ]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建地点失败:', error);
    res.status(500).json(errorResponse(50001, '创建地点失败'));
  }
};

/**
 * 更新地点（管理后台）
 */
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      province,
      city,
      district,
      latitude,
      longitude,
      cover_image,
      images,
      description,
      category,
      best_time,
      opening_hours,
      ticket_price,
      tips,
      recommended_params,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE locations SET
        name = ?,
        address = ?,
        province = ?,
        city = ?,
        district = ?,
        latitude = ?,
        longitude = ?,
        cover_image = ?,
        images = ?,
        description = ?,
        category = ?,
        best_time = ?,
        opening_hours = ?,
        ticket_price = ?,
        tips = ?,
        recommended_params = ?,
        status = ?
      WHERE id = ?`,
      [
        name, address, province, city, district, latitude, longitude,
        cover_image, JSON.stringify(images), description, category, best_time,
        opening_hours, ticket_price, tips, JSON.stringify(recommended_params),
        status, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '地点不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新地点失败:', error);
    res.status(500).json(errorResponse(50001, '更新地点失败'));
  }
};

/**
 * 删除地点（管理后台）
 */
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // 软删除
    const [result] = await db.query(
      'UPDATE locations SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '地点不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除地点失败:', error);
    res.status(500).json(errorResponse(50001, '删除地点失败'));
  }
};

/**
 * 获取城市列表
 */
exports.getCityList = async (req, res) => {
  try {
    const [cities] = await db.query(
      `SELECT DISTINCT city, province, COUNT(*) as location_count
       FROM locations
       WHERE status = 1 AND city IS NOT NULL
       GROUP BY city, province
       ORDER BY location_count DESC`
    );

    res.json(successResponse(cities));
  } catch (error) {
    console.error('获取城市列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取城市列表失败'));
  }
};

/**
 * ========== 课程管理 ==========
 */

/**
 * 获取课程列表（管理后台）
 */
exports.getCourseList = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      category,
      difficulty,
      status
    } = req.query;

    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (keyword) {
      conditions.push('(c.title LIKE ? OR c.description LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      conditions.push('c.category = ?');
      params.push(category);
    }

    if (difficulty) {
      conditions.push('c.difficulty = ?');
      params.push(difficulty);
    }

    if (status !== undefined) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM courses c ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [courses] = await db.query(
      `SELECT 
        c.*,
        u.nickname as instructor_name
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(courses, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取课程列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取课程列表失败'));
  }
};

/**
 * 获取课程详情（管理后台）
 */
exports.getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query(
      `SELECT c.*, u.nickname as instructor_name
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.id = ?`,
      [id]
    );

    if (courses.length === 0) {
      return res.status(404).json(errorResponse(40401, '课程不存在'));
    }

    // 获取章节列表
    const [chapters] = await db.query(
      `SELECT * FROM course_chapters
       WHERE course_id = ?
       ORDER BY order_num ASC`,
      [id]
    );

    res.json(successResponse({
      ...courses[0],
      chapters
    }));
  } catch (error) {
    console.error('获取课程详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取课程详情失败'));
  }
};

/**
 * 创建课程（管理后台）
 */
exports.createCourse = async (req, res) => {
  try {
    const {
      title,
      cover_image,
      description,
      category,
      difficulty,
      type,
      instructor_id,
      duration,
      price,
      is_free
    } = req.body;

    if (!title) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO courses (
        title, cover_image, description, category, difficulty, type,
        instructor_id, duration, price, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, cover_image, description, category, difficulty, type,
        instructor_id, duration, price, is_free
      ]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建课程失败:', error);
    res.status(500).json(errorResponse(50001, '创建课程失败'));
  }
};

/**
 * 更新课程（管理后台）
 */
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      cover_image,
      description,
      category,
      difficulty,
      type,
      instructor_id,
      duration,
      price,
      is_free,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE courses SET
        title = ?,
        cover_image = ?,
        description = ?,
        category = ?,
        difficulty = ?,
        type = ?,
        instructor_id = ?,
        duration = ?,
        price = ?,
        is_free = ?,
        status = ?
      WHERE id = ?`,
      [
        title, cover_image, description, category, difficulty, type,
        instructor_id, duration, price, is_free, status, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '课程不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新课程失败:', error);
    res.status(500).json(errorResponse(50001, '更新课程失败'));
  }
};

/**
 * 删除课程（管理后台）
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // 软删除
    const [result] = await db.query(
      'UPDATE courses SET status = 2 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '课程不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除课程失败:', error);
    res.status(500).json(errorResponse(50001, '删除课程失败'));
  }
};

/**
 * 创建课程章节
 */
exports.createChapter = async (req, res) => {
  try {
    const { course_id } = req.params;
    const {
      title,
      description,
      video_url,
      content,
      duration,
      order_num,
      is_free
    } = req.body;

    if (!title) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO course_chapters (
        course_id, title, description, video_url, content, duration, order_num, is_free
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, title, description, video_url, content, duration, order_num, is_free]
    );

    // 更新课程章节数
    await db.query(
      'UPDATE courses SET chapter_count = chapter_count + 1 WHERE id = ?',
      [course_id]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建章节失败:', error);
    res.status(500).json(errorResponse(50001, '创建章节失败'));
  }
};

/**
 * 更新课程章节
 */
exports.updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      video_url,
      content,
      duration,
      order_num,
      is_free,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE course_chapters SET
        title = ?,
        description = ?,
        video_url = ?,
        content = ?,
        duration = ?,
        order_num = ?,
        is_free = ?,
        status = ?
      WHERE id = ?`,
      [title, description, video_url, content, duration, order_num, is_free, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '章节不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新章节失败:', error);
    res.status(500).json(errorResponse(50001, '更新章节失败'));
  }
};

/**
 * 删除课程章节
 */
exports.deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    // 获取章节信息
    const [chapters] = await db.query('SELECT course_id FROM course_chapters WHERE id = ?', [id]);
    
    if (chapters.length === 0) {
      return res.status(404).json(errorResponse(40401, '章节不存在'));
    }

    const courseId = chapters[0].course_id;

    // 删除章节
    await db.query('DELETE FROM course_chapters WHERE id = ?', [id]);

    // 更新课程章节数
    await db.query(
      'UPDATE courses SET chapter_count = chapter_count - 1 WHERE id = ?',
      [courseId]
    );

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除章节失败:', error);
    res.status(500).json(errorResponse(50001, '删除章节失败'));
  }
};

/**
 * ========== 技巧库管理 ==========
 */

/**
 * 获取技巧列表（管理后台）
 */
exports.getTipList = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      category,
      technique_type,
      difficulty,
      status
    } = req.query;

    const offset = (page - 1) * pageSize;
    let conditions = [];
    let params = [];

    if (keyword) {
      conditions.push('(t.title LIKE ? OR t.content LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (category) {
      conditions.push('t.category = ?');
      params.push(category);
    }

    if (technique_type) {
      conditions.push('t.technique_type = ?');
      params.push(technique_type);
    }

    if (difficulty) {
      conditions.push('t.difficulty = ?');
      params.push(difficulty);
    }

    if (status !== undefined) {
      conditions.push('t.status = ?');
      params.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM tips t ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [tips] = await db.query(
      `SELECT 
        t.*,
        u.nickname as author_name
      FROM tips t
      LEFT JOIN users u ON t.author_id = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(tips, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取技巧列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取技巧列表失败'));
  }
};

/**
 * 获取技巧详情（管理后台）
 */
exports.getTipDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [tips] = await db.query(
      `SELECT t.*, u.nickname as author_name
       FROM tips t
       LEFT JOIN users u ON t.author_id = u.id
       WHERE t.id = ?`,
      [id]
    );

    if (tips.length === 0) {
      return res.status(404).json(errorResponse(40401, '技巧不存在'));
    }

    res.json(successResponse(tips[0]));
  } catch (error) {
    console.error('获取技巧详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取技巧详情失败'));
  }
};

/**
 * 创建技巧（管理后台）
 */
exports.createTip = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      title,
      cover_image,
      content,
      images,
      category,
      technique_type,
      difficulty,
      reading_time
    } = req.body;

    if (!title || !content) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO tips (
        title, cover_image, content, images, category, technique_type,
        difficulty, reading_time, author_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, cover_image, content, JSON.stringify(images), category,
        technique_type, difficulty, reading_time, userId
      ]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建技巧失败:', error);
    res.status(500).json(errorResponse(50001, '创建技巧失败'));
  }
};

/**
 * 更新技巧（管理后台）
 */
exports.updateTip = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      cover_image,
      content,
      images,
      category,
      technique_type,
      difficulty,
      reading_time,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE tips SET
        title = ?,
        cover_image = ?,
        content = ?,
        images = ?,
        category = ?,
        technique_type = ?,
        difficulty = ?,
        reading_time = ?,
        status = ?
      WHERE id = ?`,
      [
        title, cover_image, content, JSON.stringify(images), category,
        technique_type, difficulty, reading_time, status, id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '技巧不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新技巧失败:', error);
    res.status(500).json(errorResponse(50001, '更新技巧失败'));
  }
};

/**
 * 删除技巧（管理后台）
 */
exports.deleteTip = async (req, res) => {
  try {
    const { id } = req.params;

    // 软删除
    const [result] = await db.query(
      'UPDATE tips SET status = 2 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '技巧不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除技巧失败:', error);
    res.status(500).json(errorResponse(50001, '删除技巧失败'));
  }
};

// ==================== 约拍活动管理 ====================

// 获取活动列表
exports.getActivityList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, activity_type, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键词搜索
    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ? OR a.location LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 活动类型筛选
    if (activity_type) {
      whereClause += ' AND a.activity_type = ?';
      params.push(activity_type);
    }

    // 状态筛选
    if (status !== undefined && status !== '') {
      whereClause += ' AND a.status = ?';
      params.push(parseInt(status));
    }

    // 获取总数
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM activities a ${whereClause}`,
      params
    );

    // 获取列表
    const [activities] = await db.query(
      `SELECT 
        a.*,
        u.nickname as creator_name,
        u.avatar as creator_avatar
      FROM activities a
      LEFT JOIN users u ON a.creator_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(activities, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取活动列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取活动列表失败'));
  }
};

// 获取活动详情
exports.getActivityDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[activity]] = await db.query(
      `SELECT 
        a.*,
        u.nickname as creator_name,
        u.avatar as creator_avatar
      FROM activities a
      LEFT JOIN users u ON a.creator_id = u.id
      WHERE a.id = ?`,
      [id]
    );

    if (!activity) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    // 获取参与者列表
    const [participants] = await db.query(
      `SELECT 
        ap.*,
        u.nickname,
        u.avatar
      FROM activity_participants ap
      LEFT JOIN users u ON ap.user_id = u.id
      WHERE ap.activity_id = ?
      ORDER BY ap.created_at DESC`,
      [id]
    );

    activity.participants = participants;

    res.json(successResponse(activity));
  } catch (error) {
    console.error('获取活动详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取活动详情失败'));
  }
};

// 创建活动
exports.createActivity = async (req, res) => {
  try {
    const {
      creator_id,
      title,
      cover_image,
      description,
      activity_type,
      location,
      latitude,
      longitude,
      start_time,
      end_time,
      max_participants,
      fee_type,
      fee_amount,
      requirements,
      schedule,
      notes,
      tags,
      status = 1
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO activities (
        creator_id, title, cover_image, description, activity_type,
        location, latitude, longitude, start_time, end_time,
        max_participants, fee_type, fee_amount, requirements,
        schedule, notes, tags, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        creator_id, title, cover_image, description, activity_type,
        location, latitude, longitude, start_time, end_time,
        max_participants || 0, fee_type, fee_amount || 0, requirements,
        schedule, notes, tags ? JSON.stringify(tags) : null, status
      ]
    );

    res.json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json(errorResponse(50001, '创建活动失败'));
  }
};

// 更新活动
exports.updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      cover_image,
      description,
      activity_type,
      location,
      latitude,
      longitude,
      start_time,
      end_time,
      max_participants,
      fee_type,
      fee_amount,
      requirements,
      schedule,
      notes,
      tags,
      status
    } = req.body;

    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (cover_image !== undefined) {
      updateFields.push('cover_image = ?');
      params.push(cover_image);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (activity_type !== undefined) {
      updateFields.push('activity_type = ?');
      params.push(activity_type);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      params.push(location);
    }
    if (latitude !== undefined) {
      updateFields.push('latitude = ?');
      params.push(latitude);
    }
    if (longitude !== undefined) {
      updateFields.push('longitude = ?');
      params.push(longitude);
    }
    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      params.push(end_time);
    }
    if (max_participants !== undefined) {
      updateFields.push('max_participants = ?');
      params.push(max_participants);
    }
    if (fee_type !== undefined) {
      updateFields.push('fee_type = ?');
      params.push(fee_type);
    }
    if (fee_amount !== undefined) {
      updateFields.push('fee_amount = ?');
      params.push(fee_amount);
    }
    if (requirements !== undefined) {
      updateFields.push('requirements = ?');
      params.push(requirements);
    }
    if (schedule !== undefined) {
      updateFields.push('schedule = ?');
      params.push(schedule);
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(notes);
    }
    if (tags !== undefined) {
      updateFields.push('tags = ?');
      params.push(tags ? JSON.stringify(tags) : null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(40001, '没有需要更新的字段'));
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新活动失败:', error);
    res.status(500).json(errorResponse(50001, '更新活动失败'));
  }
};

// 删除活动(软删除)
exports.deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE activities SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '活动不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除活动失败:', error);
    res.status(500).json(errorResponse(50001, '删除活动失败'));
  }
};

// ==================== 挑战赛管理 ====================

// 获取挑战赛列表
exports.getChallengeList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, difficulty, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    // 关键词搜索
    if (keyword) {
      whereClause += ' AND (c.title LIKE ? OR c.description LIKE ? OR c.theme LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern, keywordPattern);
    }

    // 难度筛选
    if (difficulty) {
      whereClause += ' AND c.difficulty = ?';
      params.push(difficulty);
    }

    // 状态筛选
    if (status !== undefined && status !== '') {
      whereClause += ' AND c.status = ?';
      params.push(parseInt(status));
    }

    // 获取总数
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM challenges c ${whereClause}`,
      params
    );

    // 获取列表
    const [challenges] = await db.query(
      `SELECT c.*
      FROM challenges c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(challenges, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取挑战赛列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取挑战赛列表失败'));
  }
};

// 获取挑战赛详情
exports.getChallengeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[challenge]] = await db.query(
      'SELECT * FROM challenges WHERE id = ?',
      [id]
    );

    if (!challenge) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    // 获取作品列表(前10个)
    const [works] = await db.query(
      `SELECT 
        cw.*,
        w.title as work_title,
        w.cover_image as work_cover,
        u.nickname as user_name,
        u.avatar as user_avatar
      FROM challenge_works cw
      LEFT JOIN works w ON cw.work_id = w.id
      LEFT JOIN users u ON cw.user_id = u.id
      WHERE cw.challenge_id = ?
      ORDER BY cw.vote_count DESC, cw.score DESC
      LIMIT 10`,
      [id]
    );

    challenge.top_works = works;

    res.json(successResponse(challenge));
  } catch (error) {
    console.error('获取挑战赛详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取挑战赛详情失败'));
  }
};

// 创建挑战赛
exports.createChallenge = async (req, res) => {
  try {
    const {
      title,
      cover_image,
      description,
      theme,
      organizer_type,
      organizer_id,
      start_time,
      end_time,
      difficulty,
      requirements,
      rules,
      prizes,
      status = 1
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO challenges (
        title, cover_image, description, theme, organizer_type,
        organizer_id, start_time, end_time, difficulty, requirements,
        rules, prizes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, cover_image, description, theme, organizer_type,
        organizer_id, start_time, end_time, difficulty, requirements,
        rules, prizes ? JSON.stringify(prizes) : null, status
      ]
    );

    res.json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建挑战赛失败:', error);
    res.status(500).json(errorResponse(50001, '创建挑战赛失败'));
  }
};

// 更新挑战赛
exports.updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      cover_image,
      description,
      theme,
      organizer_type,
      organizer_id,
      start_time,
      end_time,
      difficulty,
      requirements,
      rules,
      prizes,
      status
    } = req.body;

    const updateFields = [];
    const params = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      params.push(title);
    }
    if (cover_image !== undefined) {
      updateFields.push('cover_image = ?');
      params.push(cover_image);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      params.push(description);
    }
    if (theme !== undefined) {
      updateFields.push('theme = ?');
      params.push(theme);
    }
    if (organizer_type !== undefined) {
      updateFields.push('organizer_type = ?');
      params.push(organizer_type);
    }
    if (organizer_id !== undefined) {
      updateFields.push('organizer_id = ?');
      params.push(organizer_id);
    }
    if (start_time !== undefined) {
      updateFields.push('start_time = ?');
      params.push(start_time);
    }
    if (end_time !== undefined) {
      updateFields.push('end_time = ?');
      params.push(end_time);
    }
    if (difficulty !== undefined) {
      updateFields.push('difficulty = ?');
      params.push(difficulty);
    }
    if (requirements !== undefined) {
      updateFields.push('requirements = ?');
      params.push(requirements);
    }
    if (rules !== undefined) {
      updateFields.push('rules = ?');
      params.push(rules);
    }
    if (prizes !== undefined) {
      updateFields.push('prizes = ?');
      params.push(prizes ? JSON.stringify(prizes) : null);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(40001, '没有需要更新的字段'));
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE challenges SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新挑战赛失败:', error);
    res.status(500).json(errorResponse(50001, '更新挑战赛失败'));
  }
};

// 删除挑战赛(软删除)
exports.deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE challenges SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '挑战赛不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除挑战赛失败:', error);
    res.status(500).json(errorResponse(50001, '删除挑战赛失败'));
  }
};

// ==================== 器材管理 ====================

// 获取相机列表
exports.getCameraList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, brand, sensor_type, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (c.model LIKE ? OR c.description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (brand) {
      whereClause += ' AND c.brand = ?';
      params.push(brand);
    }

    if (sensor_type) {
      whereClause += ' AND c.sensor_type = ?';
      params.push(sensor_type);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND c.status = ?';
      params.push(parseInt(status));
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM cameras c ${whereClause}`,
      params
    );

    const [cameras] = await db.query(
      `SELECT c.*
      FROM cameras c
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(cameras, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取相机列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取相机列表失败'));
  }
};

// 获取相机详情
exports.getCameraDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[camera]] = await db.query(
      'SELECT * FROM cameras WHERE id = ?',
      [id]
    );

    if (!camera) {
      return res.status(404).json(errorResponse(40401, '相机不存在'));
    }

    res.json(successResponse(camera));
  } catch (error) {
    console.error('获取相机详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取相机详情失败'));
  }
};

// 创建相机
exports.createCamera = async (req, res) => {
  try {
    const {
      brand, model, cover_image, images, sensor_type,
      megapixels, iso_range, shutter_speed, continuous_shooting,
      focus_points, video_spec, weight, dimensions,
      release_date, price, description, status = 1
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO cameras (
        brand, model, cover_image, images, sensor_type,
        megapixels, iso_range, shutter_speed, continuous_shooting,
        focus_points, video_spec, weight, dimensions,
        release_date, price, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brand, model, cover_image, images ? JSON.stringify(images) : null, sensor_type,
        megapixels, iso_range, shutter_speed, continuous_shooting,
        focus_points, video_spec, weight, dimensions,
        release_date, price, description, status
      ]
    );

    res.json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建相机失败:', error);
    res.status(500).json(errorResponse(50001, '创建相机失败'));
  }
};

// 更新相机
exports.updateCamera = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand, model, cover_image, images, sensor_type,
      megapixels, iso_range, shutter_speed, continuous_shooting,
      focus_points, video_spec, weight, dimensions,
      release_date, price, description, status
    } = req.body;

    const updateFields = [];
    const params = [];

    if (brand !== undefined) { updateFields.push('brand = ?'); params.push(brand); }
    if (model !== undefined) { updateFields.push('model = ?'); params.push(model); }
    if (cover_image !== undefined) { updateFields.push('cover_image = ?'); params.push(cover_image); }
    if (images !== undefined) { updateFields.push('images = ?'); params.push(images ? JSON.stringify(images) : null); }
    if (sensor_type !== undefined) { updateFields.push('sensor_type = ?'); params.push(sensor_type); }
    if (megapixels !== undefined) { updateFields.push('megapixels = ?'); params.push(megapixels); }
    if (iso_range !== undefined) { updateFields.push('iso_range = ?'); params.push(iso_range); }
    if (shutter_speed !== undefined) { updateFields.push('shutter_speed = ?'); params.push(shutter_speed); }
    if (continuous_shooting !== undefined) { updateFields.push('continuous_shooting = ?'); params.push(continuous_shooting); }
    if (focus_points !== undefined) { updateFields.push('focus_points = ?'); params.push(focus_points); }
    if (video_spec !== undefined) { updateFields.push('video_spec = ?'); params.push(video_spec); }
    if (weight !== undefined) { updateFields.push('weight = ?'); params.push(weight); }
    if (dimensions !== undefined) { updateFields.push('dimensions = ?'); params.push(dimensions); }
    if (release_date !== undefined) { updateFields.push('release_date = ?'); params.push(release_date); }
    if (price !== undefined) { updateFields.push('price = ?'); params.push(price); }
    if (description !== undefined) { updateFields.push('description = ?'); params.push(description); }
    if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(40001, '没有需要更新的字段'));
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE cameras SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '相机不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新相机失败:', error);
    res.status(500).json(errorResponse(50001, '更新相机失败'));
  }
};

// 删除相机(软删除)
exports.deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE cameras SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '相机不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除相机失败:', error);
    res.status(500).json(errorResponse(50001, '删除相机失败'));
  }
};

// 获取镜头列表
exports.getLensList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, brand, lens_type, status } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (l.model LIKE ? OR l.description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (brand) {
      whereClause += ' AND l.brand = ?';
      params.push(brand);
    }

    if (lens_type) {
      whereClause += ' AND l.lens_type = ?';
      params.push(lens_type);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND l.status = ?';
      params.push(parseInt(status));
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM lenses l ${whereClause}`,
      params
    );

    const [lenses] = await db.query(
      `SELECT l.*
      FROM lenses l
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(lenses, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取镜头列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取镜头列表失败'));
  }
};

// 获取镜头详情
exports.getLensDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [[lens]] = await db.query(
      'SELECT * FROM lenses WHERE id = ?',
      [id]
    );

    if (!lens) {
      return res.status(404).json(errorResponse(40401, '镜头不存在'));
    }

    res.json(successResponse(lens));
  } catch (error) {
    console.error('获取镜头详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取镜头详情失败'));
  }
};

// 创建镜头
exports.createLens = async (req, res) => {
  try {
    const {
      brand, model, cover_image, images, mount, focal_length,
      max_aperture, lens_type, image_stabilization, autofocus,
      weight, filter_diameter, release_date, price, description, status = 1
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO lenses (
        brand, model, cover_image, images, mount, focal_length,
        max_aperture, lens_type, image_stabilization, autofocus,
        weight, filter_diameter, release_date, price, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        brand, model, cover_image, images ? JSON.stringify(images) : null, mount, focal_length,
        max_aperture, lens_type, image_stabilization, autofocus,
        weight, filter_diameter, release_date, price, description, status
      ]
    );

    res.json(successResponse({ id: result.insertId }, '创建成功'));
  } catch (error) {
    console.error('创建镜头失败:', error);
    res.status(500).json(errorResponse(50001, '创建镜头失败'));
  }
};

// 更新镜头
exports.updateLens = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      brand, model, cover_image, images, mount, focal_length,
      max_aperture, lens_type, image_stabilization, autofocus,
      weight, filter_diameter, release_date, price, description, status
    } = req.body;

    const updateFields = [];
    const params = [];

    if (brand !== undefined) { updateFields.push('brand = ?'); params.push(brand); }
    if (model !== undefined) { updateFields.push('model = ?'); params.push(model); }
    if (cover_image !== undefined) { updateFields.push('cover_image = ?'); params.push(cover_image); }
    if (images !== undefined) { updateFields.push('images = ?'); params.push(images ? JSON.stringify(images) : null); }
    if (mount !== undefined) { updateFields.push('mount = ?'); params.push(mount); }
    if (focal_length !== undefined) { updateFields.push('focal_length = ?'); params.push(focal_length); }
    if (max_aperture !== undefined) { updateFields.push('max_aperture = ?'); params.push(max_aperture); }
    if (lens_type !== undefined) { updateFields.push('lens_type = ?'); params.push(lens_type); }
    if (image_stabilization !== undefined) { updateFields.push('image_stabilization = ?'); params.push(image_stabilization); }
    if (autofocus !== undefined) { updateFields.push('autofocus = ?'); params.push(autofocus); }
    if (weight !== undefined) { updateFields.push('weight = ?'); params.push(weight); }
    if (filter_diameter !== undefined) { updateFields.push('filter_diameter = ?'); params.push(filter_diameter); }
    if (release_date !== undefined) { updateFields.push('release_date = ?'); params.push(release_date); }
    if (price !== undefined) { updateFields.push('price = ?'); params.push(price); }
    if (description !== undefined) { updateFields.push('description = ?'); params.push(description); }
    if (status !== undefined) { updateFields.push('status = ?'); params.push(status); }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(40001, '没有需要更新的字段'));
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE lenses SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '镜头不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新镜头失败:', error);
    res.status(500).json(errorResponse(50001, '更新镜头失败'));
  }
};

// 删除镜头(软删除)
exports.deleteLens = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE lenses SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '镜头不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除镜头失败:', error);
    res.status(500).json(errorResponse(50001, '删除镜头失败'));
  }
};

// ==================== 用户管理 ====================

/**
 * 获取用户列表
 */
exports.getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, role } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (u.nickname LIKE ? OR u.phone LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND u.status = ?';
      params.push(parseInt(status));
    }

    if (role) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM users u ${whereClause}`,
      params
    );

    const [users] = await db.query(
      `SELECT u.id, u.phone, u.nickname, u.avatar, u.bio, u.gender, u.location,
              u.role, u.status, u.followers_count, u.following_count, u.works_count,
              u.likes_count, u.created_at, u.updated_at
      FROM users u
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(users, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户列表失败'));
  }
};

/**
 * 获取用户详情
 */
exports.getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(
      `SELECT u.id, u.phone, u.nickname, u.avatar, u.bio, u.gender, u.birthday,
              u.location, u.role, u.status, u.followers_count, u.following_count,
              u.works_count, u.likes_count, u.created_at, u.updated_at
      FROM users u
      WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json(errorResponse(40401, '用户不存在'));
    }

    res.json(successResponse(users[0]));
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户详情失败'));
  }
};

/**
 * 更新用户信息
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, bio, gender, location, role, status } = req.body;

    const updateFields = [];
    const params = [];

    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      params.push(nickname);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      params.push(bio);
    }
    if (gender !== undefined) {
      updateFields.push('gender = ?');
      params.push(gender);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      params.push(location);
    }
    if (role !== undefined) {
      updateFields.push('role = ?');
      params.push(role);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      params.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json(errorResponse(10001, '没有提供更新字段'));
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '用户不存在'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json(errorResponse(50001, '更新用户失败'));
  }
};

/**
 * 禁用/启用用户
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status !== 0 && status !== 1) {
      return res.status(400).json(errorResponse(10001, '状态参数错误'));
    }

    const [result] = await db.query(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '用户不存在'));
    }

    res.json(successResponse(null, status === 1 ? '用户已启用' : '用户已禁用'));
  } catch (error) {
    console.error('更新用户状态失败:', error);
    res.status(500).json(errorResponse(50001, '更新用户状态失败'));
  }
};

// ==================== 作品管理 ====================

/**
 * 获取作品列表
 */
exports.getWorkList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, user_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND (w.title LIKE ? OR w.description LIKE ?)';
      const keywordPattern = `%${keyword}%`;
      params.push(keywordPattern, keywordPattern);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND w.status = ?';
      params.push(parseInt(status));
    }

    if (user_id) {
      whereClause += ' AND w.user_id = ?';
      params.push(user_id);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM works w ${whereClause}`,
      params
    );

    const [works] = await db.query(
      `SELECT w.*, u.nickname as author_name, u.avatar as author_avatar
      FROM works w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(works, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取作品列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取作品列表失败'));
  }
};

/**
 * 获取作品详情
 */
exports.getWorkDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [works] = await db.query(
      `SELECT w.*, u.nickname as author_name, u.avatar as author_avatar
      FROM works w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.id = ?`,
      [id]
    );

    if (works.length === 0) {
      return res.status(404).json(errorResponse(40401, '作品不存在'));
    }

    res.json(successResponse(works[0]));
  } catch (error) {
    console.error('获取作品详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取作品详情失败'));
  }
};

/**
 * 更新作品状态
 */
exports.updateWorkStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1, 2].includes(status)) {
      return res.status(400).json(errorResponse(10001, '状态参数错误'));
    }

    const [result] = await db.query(
      'UPDATE works SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '作品不存在'));
    }

    const statusText = { 0: '草稿', 1: '已发布', 2: '已删除' };
    res.json(successResponse(null, `作品已设置为${statusText[status]}`));
  } catch (error) {
    console.error('更新作品状态失败:', error);
    res.status(500).json(errorResponse(50001, '更新作品状态失败'));
  }
};

/**
 * 删除作品(软删除)
 */
exports.deleteWork = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE works SET status = 2 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '作品不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除作品失败:', error);
    res.status(500).json(errorResponse(50001, '删除作品失败'));
  }
};

// ==================== 评论管理 ====================

/**
 * 获取评论列表
 */
exports.getCommentList = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, status, work_id, user_id } = req.query;
    const offset = (page - 1) * pageSize;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (keyword) {
      whereClause += ' AND c.content LIKE ?';
      params.push(`%${keyword}%`);
    }

    if (status !== undefined && status !== '') {
      whereClause += ' AND c.status = ?';
      params.push(parseInt(status));
    }

    if (work_id) {
      whereClause += ' AND c.work_id = ?';
      params.push(work_id);
    }

    if (user_id) {
      whereClause += ' AND c.user_id = ?';
      params.push(user_id);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) as total FROM comments c ${whereClause}`,
      params
    );

    const [comments] = await db.query(
      `SELECT c.*, u.nickname as user_name, u.avatar as user_avatar,
              w.title as work_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN works w ON c.work_id = w.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(comments, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取评论列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取评论列表失败'));
  }
};

/**
 * 获取评论详情
 */
exports.getCommentDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const [comments] = await db.query(
      `SELECT c.*, u.nickname as user_name, u.avatar as user_avatar,
              w.title as work_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN works w ON c.work_id = w.id
      WHERE c.id = ?`,
      [id]
    );

    if (comments.length === 0) {
      return res.status(404).json(errorResponse(40401, '评论不存在'));
    }

    res.json(successResponse(comments[0]));
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取评论详情失败'));
  }
};

/**
 * 删除评论(软删除)
 */
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'UPDATE comments SET status = 0 WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '评论不存在'));
    }

    // 更新作品评论数
    await db.query(
      'UPDATE works SET comment_count = comment_count - 1 WHERE id = (SELECT work_id FROM comments WHERE id = ?)',
      [id]
    );

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json(errorResponse(50001, '删除评论失败'));
  }
};
