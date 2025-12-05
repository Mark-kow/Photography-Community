const db = require('../config/database');
const { successResponse, errorResponse, paginationResponse } = require('../utils/helpers');

/**
 * 获取相机列表
 */
exports.getCameras = async (req, res) => {
  try {
    const { brand, sensorType, minPrice, maxPrice, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let conditions = ['status = 1'];
    let params = [];

    if (brand) {
      conditions.push('brand = ?');
      params.push(brand);
    }
    if (sensorType) {
      conditions.push('sensor_type = ?');
      params.push(sensorType);
    }
    if (minPrice) {
      conditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM cameras ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [cameras] = await db.query(
      `SELECT * FROM cameras ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(cameras, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取相机列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取相机列表失败'));
  }
};

/**
 * 获取相机详情
 */
exports.getCameraById = async (req, res) => {
  try {
    const { id } = req.params;

    const [cameras] = await db.query(
      'SELECT * FROM cameras WHERE id = ?',
      [id]
    );

    if (cameras.length === 0) {
      return res.status(404).json(errorResponse(40401, '相机不存在'));
    }

    res.json(successResponse(cameras[0]));
  } catch (error) {
    console.error('获取相机详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取相机详情失败'));
  }
};

/**
 * 获取镜头列表
 */
exports.getLenses = async (req, res) => {
  try {
    const { brand, mount, lensType, minPrice, maxPrice, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let conditions = ['status = 1'];
    let params = [];

    if (brand) {
      conditions.push('brand = ?');
      params.push(brand);
    }
    if (mount) {
      conditions.push('mount = ?');
      params.push(mount);
    }
    if (lensType) {
      conditions.push('lens_type = ?');
      params.push(lensType);
    }
    if (minPrice) {
      conditions.push('price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push('price <= ?');
      params.push(parseFloat(maxPrice));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM lenses ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [lenses] = await db.query(
      `SELECT * FROM lenses ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(lenses, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取镜头列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取镜头列表失败'));
  }
};

/**
 * 获取镜头详情
 */
exports.getLensById = async (req, res) => {
  try {
    const { id } = req.params;

    const [lenses] = await db.query(
      'SELECT * FROM lenses WHERE id = ?',
      [id]
    );

    if (lenses.length === 0) {
      return res.status(404).json(errorResponse(40401, '镜头不存在'));
    }

    res.json(successResponse(lenses[0]));
  } catch (error) {
    console.error('获取镜头详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取镜头详情失败'));
  }
};

/**
 * 添加器材到用户库
 */
exports.addToUserEquipment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { equipmentType, equipmentId, customName, purchaseDate, purchasePrice, shutterCount, notes } = req.body;

    if (!equipmentType || (!equipmentId && !customName)) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    // 如果是相机或镜头，验证器材是否存在
    if (equipmentId) {
      const table = equipmentType === 'camera' ? 'cameras' : 'lenses';
      const [items] = await db.query(`SELECT id FROM ${table} WHERE id = ?`, [equipmentId]);
      if (items.length === 0) {
        return res.status(404).json(errorResponse(40401, '器材不存在'));
      }
    }

    await db.query(
      `INSERT INTO user_equipments (user_id, equipment_type, equipment_id, custom_name, 
       purchase_date, purchase_price, shutter_count, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, equipmentType, equipmentId, customName, purchaseDate, purchasePrice, shutterCount, notes]
    );

    res.json(successResponse(null, '添加成功'));
  } catch (error) {
    console.error('添加器材失败:', error);
    res.status(500).json(errorResponse(50001, '添加器材失败'));
  }
};

/**
 * 获取用户器材库
 */
exports.getUserEquipments = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const { equipmentType } = req.query;

    let conditions = ['ue.user_id = ?'];
    let params = [userId];

    if (equipmentType) {
      conditions.push('ue.equipment_type = ?');
      params.push(equipmentType);
    }

    const whereClause = conditions.join(' AND ');

    const [equipments] = await db.query(
      `SELECT ue.*, 
              CASE 
                WHEN ue.equipment_type = 'camera' THEN c.brand
                WHEN ue.equipment_type = 'lens' THEN l.brand
                ELSE NULL
              END as brand,
              CASE 
                WHEN ue.equipment_type = 'camera' THEN c.model
                WHEN ue.equipment_type = 'lens' THEN l.model
                ELSE NULL
              END as model,
              CASE 
                WHEN ue.equipment_type = 'camera' THEN c.cover_image
                WHEN ue.equipment_type = 'lens' THEN l.cover_image
                ELSE NULL
              END as cover_image
       FROM user_equipments ue
       LEFT JOIN cameras c ON ue.equipment_type = 'camera' AND ue.equipment_id = c.id
       LEFT JOIN lenses l ON ue.equipment_type = 'lens' AND ue.equipment_id = l.id
       WHERE ${whereClause}
       ORDER BY ue.created_at DESC`,
      params
    );

    res.json(successResponse({ list: equipments }));
  } catch (error) {
    console.error('获取用户器材库失败:', error);
    res.status(500).json(errorResponse(50001, '获取用户器材库失败'));
  }
};

/**
 * 删除用户器材
 */
exports.deleteUserEquipment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM user_equipments WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '器材不存在'));
    }

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除器材失败:', error);
    res.status(500).json(errorResponse(50001, '删除器材失败'));
  }
};

/**
 * 获取二手市场列表
 */
exports.getMarketItems = async (req, res) => {
  try {
    const { equipmentType, minPrice, maxPrice, conditionLevel, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let conditions = ['em.status = 1'];
    let params = [];

    if (equipmentType) {
      conditions.push('em.equipment_type = ?');
      params.push(equipmentType);
    }
    if (minPrice) {
      conditions.push('em.price >= ?');
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      conditions.push('em.price <= ?');
      params.push(parseFloat(maxPrice));
    }
    if (conditionLevel) {
      conditions.push('em.condition_level = ?');
      params.push(conditionLevel);
    }

    const whereClause = conditions.join(' AND ');

    // 获取总数
    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM equipment_market em WHERE ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // 获取列表
    const [items] = await db.query(
      `SELECT em.*, u.nickname, u.avatar
       FROM equipment_market em
       JOIN users u ON em.seller_id = u.id
       WHERE ${whereClause}
       ORDER BY em.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json(paginationResponse(items, parseInt(page), parseInt(pageSize), total));
  } catch (error) {
    console.error('获取二手市场列表失败:', error);
    res.status(500).json(errorResponse(50001, '获取二手市场列表失败'));
  }
};

/**
 * 获取二手商品详情
 */
exports.getMarketItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await db.query(
      `SELECT em.*, u.nickname, u.avatar, u.phone
       FROM equipment_market em
       JOIN users u ON em.seller_id = u.id
       WHERE em.id = ?`,
      [id]
    );

    if (items.length === 0) {
      return res.status(404).json(errorResponse(40401, '商品不存在'));
    }

    // 更新浏览量
    await db.query(
      'UPDATE equipment_market SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    res.json(successResponse(items[0]));
  } catch (error) {
    console.error('获取商品详情失败:', error);
    res.status(500).json(errorResponse(50001, '获取商品详情失败'));
  }
};

/**
 * 发布二手商品
 */
exports.createMarketItem = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const {
      equipmentType, equipmentId, customName, title, description, images,
      conditionLevel, shutterCount, accessories, price, originalPrice,
      tradeMethod, location
    } = req.body;

    if (!title || !price) {
      return res.status(400).json(errorResponse(10001, '缺少必填字段'));
    }

    const [result] = await db.query(
      `INSERT INTO equipment_market (
        seller_id, equipment_type, equipment_id, custom_name, title, description,
        images, condition_level, shutter_count, accessories, price, original_price,
        trade_method, location
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sellerId, equipmentType, equipmentId, customName, title, description,
        JSON.stringify(images), conditionLevel, shutterCount, accessories, price,
        originalPrice, tradeMethod, location
      ]
    );

    res.status(201).json(successResponse({ id: result.insertId }, '发布成功'));
  } catch (error) {
    console.error('发布商品失败:', error);
    res.status(500).json(errorResponse(50001, '发布商品失败'));
  }
};

/**
 * 更新二手商品状态
 */
exports.updateMarketItemStatus = async (req, res) => {
  try {
    const sellerId = req.user.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined) {
      return res.status(400).json(errorResponse(10001, '缺少状态参数'));
    }

    const [result] = await db.query(
      'UPDATE equipment_market SET status = ? WHERE id = ? AND seller_id = ?',
      [status, id, sellerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json(errorResponse(40401, '商品不存在或无权限'));
    }

    res.json(successResponse(null, '更新成功'));
  } catch (error) {
    console.error('更新商品状态失败:', error);
    res.status(500).json(errorResponse(50001, '更新商品状态失败'));
  }
};
