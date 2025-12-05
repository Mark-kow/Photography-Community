const db = require('../config/database');
const axios = require('axios');

// 千问API配置
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';

// 获取地点列表
exports.getLocations = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      category, 
      city, 
      sortBy = 'checkin_count', // checkin_count, rating, created_at
      latitude, 
      longitude, 
      distance = 50 // 默认50km范围内
    } = req.query;

    const offset = (page - 1) * pageSize;
    let whereConditions = ['status = 1'];
    let params = [];

    // 按分类筛选
    if (category) {
      whereConditions.push('category = ?');
      params.push(category);
    }

    // 按城市筛选
    if (city) {
      whereConditions.push('city = ?');
      params.push(city);
    }

    const whereClause = whereConditions.join(' AND ');

    // 如果提供了经纬度，按距离排序
    let orderBy = 'checkin_count DESC';
    if (sortBy === 'rating') {
      orderBy = 'rating DESC, checkin_count DESC';
    } else if (sortBy === 'created_at') {
      orderBy = 'created_at DESC';
    }

    // 计算距离（如果提供了用户位置）
    let selectFields = 'id, name, address, city, latitude, longitude, cover_image, description, category, best_time, ticket_price, checkin_count, work_count, rating';
    if (latitude && longitude) {
      selectFields = `*, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance`;
      params.unshift(latitude, longitude, latitude);
      
      // 添加距离筛选
      whereConditions.push(`(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) <= ?`);
      params.push(latitude, longitude, latitude, distance);
      
      orderBy = 'distance ASC';
    }

    const sql = `
      SELECT ${selectFields}
      FROM locations
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(pageSize), offset);

    const [locations] = await db.query(sql, params);

    // 获取总数
    const countSql = `SELECT COUNT(*) as total FROM locations WHERE ${whereClause}`;
    const countParams = params.slice(latitude && longitude ? 3 : 0, -2);
    const [countResult] = await db.query(countSql, countParams);

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: locations,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('获取地点列表失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取地点列表失败',
      error: error.message
    });
  }
};

// 获取地点详情
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.query;

    let selectFields = '*';
    let params = [id];
    
    // 如果提供了用户位置，计算距离
    if (latitude && longitude) {
      selectFields = `*, 
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance`;
      params = [latitude, longitude, latitude, id];
    }

    const [locations] = await db.query(
      `SELECT ${selectFields} FROM locations WHERE id = ? AND status = 1`,
      params
    );

    if (locations.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '地点不存在'
      });
    }

    const location = locations[0];

    // 获取打卡用户列表（最新的10个）
    const [checkins] = await db.query(`
      SELECT lc.*, u.id as user_id, u.nickname, u.avatar
      FROM location_checkins lc
      LEFT JOIN users u ON lc.user_id = u.id
      WHERE lc.location_id = ?
      ORDER BY lc.created_at DESC
      LIMIT 10
    `, [id]);

    // 获取拍摄攻略列表
    const [guides] = await db.query(`
      SELECT lg.*, u.nickname as author_name, u.avatar as author_avatar
      FROM location_guides lg
      LEFT JOIN users u ON lg.user_id = u.id
      WHERE lg.location_id = ? AND lg.status = 1
      ORDER BY lg.like_count DESC, lg.created_at DESC
      LIMIT 5
    `, [id]);

    // 获取精选作品
    const [works] = await db.query(`
      SELECT w.*, u.nickname, u.avatar
      FROM works w
      LEFT JOIN users u ON w.user_id = u.id
      WHERE w.location = ? AND w.status = 1
      ORDER BY w.like_count DESC, w.created_at DESC
      LIMIT 12
    `, [location.name]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...location,
        recent_checkins: checkins,
        guides: guides,
        featured_works: works
      }
    });
  } catch (error) {
    console.error('获取地点详情失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取地点详情失败',
      error: error.message
    });
  }
};

// 创建地点
exports.createLocation = async (req, res) => {
  try {
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

    const [result] = await db.query(
      `INSERT INTO locations (
        name, address, province, city, district, latitude, longitude,
        cover_image, images, description, category, best_time,
        opening_hours, ticket_price, tips, recommended_params, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, address, province, city, district, latitude, longitude,
        cover_image, JSON.stringify(images || []), description, category, best_time,
        opening_hours, ticket_price, tips, JSON.stringify(recommended_params || {}),
        req.user.id
      ]
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('创建地点失败:', error);
    res.status(500).json({
      code: 50000,
      message: '创建地点失败',
      error: error.message
    });
  }
};

// 打卡
exports.checkin = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      work_id,
      images,
      content,
      rating,
      visit_date,
      weather
    } = req.body;

    // 检查地点是否存在
    const [locations] = await db.query(
      'SELECT id FROM locations WHERE id = ? AND status = 1',
      [id]
    );

    if (locations.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '地点不存在'
      });
    }

    // 创建打卡记录
    const [result] = await db.query(
      `INSERT INTO location_checkins (
        location_id, user_id, work_id, images, content, rating, visit_date, weather
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        work_id || null,
        JSON.stringify(images || []),
        content,
        rating,
        visit_date || new Date().toISOString().split('T')[0],
        weather
      ]
    );

    // 更新地点打卡次数
    await db.query(
      'UPDATE locations SET checkin_count = checkin_count + 1 WHERE id = ?',
      [id]
    );

    // 更新地点评分
    if (rating) {
      const [avgRating] = await db.query(
        'SELECT AVG(rating) as avg_rating FROM location_checkins WHERE location_id = ? AND rating IS NOT NULL',
        [id]
      );
      await db.query(
        'UPDATE locations SET rating = ? WHERE id = ?',
        [avgRating[0].avg_rating, id]
      );
    }

    res.json({
      code: 200,
      message: '打卡成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('打卡失败:', error);
    res.status(500).json({
      code: 50000,
      message: '打卡失败',
      error: error.message
    });
  }
};

// 获取用户打卡记录
exports.getUserCheckins = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const [checkins] = await db.query(`
      SELECT lc.*, l.name as location_name, l.cover_image as location_cover, l.city
      FROM location_checkins lc
      LEFT JOIN locations l ON lc.location_id = l.id
      WHERE lc.user_id = ?
      ORDER BY lc.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(pageSize), offset]);

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM location_checkins WHERE user_id = ?',
      [userId]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: checkins,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('获取打卡记录失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取打卡记录失败',
      error: error.message
    });
  }
};

// 创建拍摄攻略
exports.createGuide = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      images,
      best_positions,
      equipment_suggestions,
      transportation,
      notes
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO location_guides (
        location_id, user_id, title, content, images, best_positions,
        equipment_suggestions, transportation, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        title,
        content,
        JSON.stringify(images || []),
        JSON.stringify(best_positions || []),
        equipment_suggestions,
        transportation,
        notes
      ]
    );

    res.json({
      code: 200,
      message: '攻略创建成功',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('创建攻略失败:', error);
    res.status(500).json({
      code: 50000,
      message: '创建攻略失败',
      error: error.message
    });
  }
};

// 获取攻略详情
exports.getGuideById = async (req, res) => {
  try {
    const { guideId } = req.params;

    const [guides] = await db.query(`
      SELECT lg.*, u.nickname as author_name, u.avatar as author_avatar,
             l.name as location_name, l.address
      FROM location_guides lg
      LEFT JOIN users u ON lg.user_id = u.id
      LEFT JOIN locations l ON lg.location_id = l.id
      WHERE lg.id = ? AND lg.status = 1
    `, [guideId]);

    if (guides.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '攻略不存在'
      });
    }

    // 增加浏览量
    await db.query(
      'UPDATE location_guides SET view_count = view_count + 1 WHERE id = ?',
      [guideId]
    );

    res.json({
      code: 200,
      message: 'success',
      data: guides[0]
    });
  } catch (error) {
    console.error('获取攻略详情失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取攻略详情失败',
      error: error.message
    });
  }
};
