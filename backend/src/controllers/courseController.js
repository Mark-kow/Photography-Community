const db = require('../config/database');

// 获取课程列表
exports.getCourses = async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20,
      category,
      difficulty,
      is_free,
      sortBy = 'student_count' // student_count, rating, created_at
    } = req.query;

    const offset = (page - 1) * pageSize;
    let whereConditions = ['c.status = 1'];
    let params = [];

    if (category) {
      whereConditions.push('c.category = ?');
      params.push(category);
    }

    if (difficulty) {
      whereConditions.push('c.difficulty = ?');
      params.push(difficulty);
    }

    if (is_free !== undefined) {
      whereConditions.push('c.is_free = ?');
      params.push(is_free);
    }

    const whereClause = whereConditions.join(' AND ');

    let orderBy = 'c.student_count DESC';
    if (sortBy === 'rating') {
      orderBy = 'c.rating DESC, c.student_count DESC';
    } else if (sortBy === 'created_at') {
      orderBy = 'c.created_at DESC';
    }

    const sql = `
      SELECT c.*, u.nickname as instructor_name, u.avatar as instructor_avatar
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(pageSize), offset);

    const [courses] = await db.query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM courses c WHERE ${whereClause}`;
    const [countResult] = await db.query(countSql, params.slice(0, -2));

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: courses,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('获取课程列表失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取课程列表失败',
      error: error.message
    });
  }
};

// 获取课程详情
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const [courses] = await db.query(`
      SELECT c.*, u.nickname as instructor_name, u.avatar as instructor_avatar
      FROM courses c
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE c.id = ? AND c.status = 1
    `, [id]);

    if (courses.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '课程不存在'
      });
    }

    const course = courses[0];

    // 获取章节列表
    const [chapters] = await db.query(`
      SELECT id, title, description, duration, order_num, is_free
      FROM course_chapters
      WHERE course_id = ? AND status = 1
      ORDER BY order_num ASC
    `, [id]);

    // 如果用户已登录，获取学习进度
    let progress = null;
    if (userId) {
      const [progressResult] = await db.query(`
        SELECT * FROM course_progress
        WHERE user_id = ? AND course_id = ?
      `, [userId, id]);
      
      if (progressResult.length > 0) {
        progress = progressResult[0];
      }
    }

    // 增加浏览量
    await db.query('UPDATE courses SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...course,
        chapters,
        user_progress: progress
      }
    });
  } catch (error) {
    console.error('获取课程详情失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取课程详情失败',
      error: error.message
    });
  }
};

// 获取章节内容
exports.getChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const [chapters] = await db.query(`
      SELECT cc.*, c.id as course_id, c.title as course_title, c.is_free as course_is_free
      FROM course_chapters cc
      LEFT JOIN courses c ON cc.course_id = c.id
      WHERE cc.id = ? AND cc.status = 1
    `, [chapterId]);

    if (chapters.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '章节不存在'
      });
    }

    const chapter = chapters[0];

    // 检查用户是否有权限观看（免费章节或课程免费或已购买）
    if (!chapter.is_free && !chapter.course_is_free) {
      // TODO: 检查用户是否购买了课程
      // 暂时允许所有登录用户观看
    }

    // 更新学习进度
    const [progressResult] = await db.query(`
      SELECT * FROM course_progress
      WHERE user_id = ? AND course_id = ?
    `, [userId, chapter.course_id]);

    if (progressResult.length === 0) {
      // 创建学习记录
      await db.query(`
        INSERT INTO course_progress (user_id, course_id, chapter_id, last_learn_time)
        VALUES (?, ?, ?, NOW())
      `, [userId, chapter.course_id, chapterId]);

      // 增加课程学习人数
      await db.query(`
        UPDATE courses SET student_count = student_count + 1 WHERE id = ?
      `, [chapter.course_id]);
    } else {
      // 更新学习进度
      await db.query(`
        UPDATE course_progress
        SET chapter_id = ?, last_learn_time = NOW()
        WHERE user_id = ? AND course_id = ?
      `, [chapterId, userId, chapter.course_id]);
    }

    res.json({
      code: 200,
      message: 'success',
      data: chapter
    });
  } catch (error) {
    console.error('获取章节内容失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取章节内容失败',
      error: error.message
    });
  }
};

// 完成章节
exports.completeChapter = async (req, res) => {
  try {
    const { chapterId } = req.params;
    const userId = req.user.id;

    const [chapters] = await db.query(
      'SELECT course_id FROM course_chapters WHERE id = ?',
      [chapterId]
    );

    if (chapters.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '章节不存在'
      });
    }

    const courseId = chapters[0].course_id;

    // 获取或创建学习进度
    const [progressResult] = await db.query(`
      SELECT * FROM course_progress WHERE user_id = ? AND course_id = ?
    `, [userId, courseId]);

    let completedChapters = [];
    if (progressResult.length > 0) {
      completedChapters = progressResult[0].completed_chapters 
        ? JSON.parse(progressResult[0].completed_chapters) 
        : [];
    }

    if (!completedChapters.includes(parseInt(chapterId))) {
      completedChapters.push(parseInt(chapterId));
    }

    // 计算进度百分比
    const [totalChapters] = await db.query(
      'SELECT COUNT(*) as total FROM course_chapters WHERE course_id = ? AND status = 1',
      [courseId]
    );
    const progress = Math.round((completedChapters.length / totalChapters[0].total) * 100);
    const isCompleted = progress === 100 ? 1 : 0;

    if (progressResult.length === 0) {
      await db.query(`
        INSERT INTO course_progress 
        (user_id, course_id, progress, completed_chapters, is_completed, last_learn_time)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [userId, courseId, progress, JSON.stringify(completedChapters), isCompleted]);
    } else {
      await db.query(`
        UPDATE course_progress
        SET progress = ?, completed_chapters = ?, is_completed = ?, last_learn_time = NOW()
        WHERE user_id = ? AND course_id = ?
      `, [progress, JSON.stringify(completedChapters), isCompleted, userId, courseId]);
    }

    res.json({
      code: 200,
      message: '学习进度已更新',
      data: {
        progress,
        is_completed: isCompleted
      }
    });
  } catch (error) {
    console.error('更新学习进度失败:', error);
    res.status(500).json({
      code: 50000,
      message: '更新学习进度失败',
      error: error.message
    });
  }
};

// 获取技巧库列表
exports.getTips = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      category,
      technique_type,
      difficulty,
      sortBy = 'like_count'
    } = req.query;

    const offset = (page - 1) * pageSize;
    let whereConditions = ['t.status = 1'];
    let params = [];

    if (category) {
      whereConditions.push('t.category = ?');
      params.push(category);
    }

    if (technique_type) {
      whereConditions.push('t.technique_type = ?');
      params.push(technique_type);
    }

    if (difficulty) {
      whereConditions.push('t.difficulty = ?');
      params.push(difficulty);
    }

    const whereClause = whereConditions.join(' AND ');

    let orderBy = 't.like_count DESC';
    if (sortBy === 'view_count') {
      orderBy = 't.view_count DESC';
    } else if (sortBy === 'created_at') {
      orderBy = 't.created_at DESC';
    }

    const sql = `
      SELECT t.*, u.nickname as author_name, u.avatar as author_avatar
      FROM tips t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(pageSize), offset);

    const [tips] = await db.query(sql, params);

    const countSql = `SELECT COUNT(*) as total FROM tips t WHERE ${whereClause}`;
    const [countResult] = await db.query(countSql, params.slice(0, -2));

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: tips,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('获取技巧列表失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取技巧列表失败',
      error: error.message
    });
  }
};

// 获取技巧详情
exports.getTipById = async (req, res) => {
  try {
    const { id } = req.params;

    const [tips] = await db.query(`
      SELECT t.*, u.nickname as author_name, u.avatar as author_avatar
      FROM tips t
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.id = ? AND t.status = 1
    `, [id]);

    if (tips.length === 0) {
      return res.status(404).json({
        code: 40400,
        message: '技巧不存在'
      });
    }

    // 增加浏览量
    await db.query('UPDATE tips SET view_count = view_count + 1 WHERE id = ?', [id]);

    res.json({
      code: 200,
      message: 'success',
      data: tips[0]
    });
  } catch (error) {
    console.error('获取技巧详情失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取技巧详情失败',
      error: error.message
    });
  }
};

// 获取我的学习记录
exports.getMyLearning = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const [records] = await db.query(`
      SELECT cp.*, c.title, c.cover_image, c.duration, c.chapter_count,
             u.nickname as instructor_name
      FROM course_progress cp
      LEFT JOIN courses c ON cp.course_id = c.id
      LEFT JOIN users u ON c.instructor_id = u.id
      WHERE cp.user_id = ?
      ORDER BY cp.last_learn_time DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(pageSize), offset]);

    const [countResult] = await db.query(
      'SELECT COUNT(*) as total FROM course_progress WHERE user_id = ?',
      [userId]
    );

    res.json({
      code: 200,
      message: 'success',
      data: {
        list: records,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total: countResult[0].total
        }
      }
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取学习记录失败',
      error: error.message
    });
  }
};
