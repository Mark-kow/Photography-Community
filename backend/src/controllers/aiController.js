const axios = require('axios');
const db = require('../config/database');

// 千问API配置（需要在.env中配置QWEN_API_KEY）
const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';

// 简单的内存缓存（生产环境建议使用Redis）
const aiCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24小时
const MAX_CACHE_SIZE = 1000; // 最大缓存数量

// 生成缓存key
function generateCacheKey(type, params) {
  const paramsStr = JSON.stringify(params);
  return `ai:${type}:${Buffer.from(paramsStr).toString('base64').substring(0, 50)}`;
}

// 获取缓存
function getCache(key) {
  const cached = aiCache.get(key);
  if (!cached) return null;
  
  // 检查是否过期
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    aiCache.delete(key);
    return null;
  }
  
  return cached.data;
}

// 设置缓存
function setCache(key, data) {
  // 如果缓存满了，删除最旧的
  if (aiCache.size >= MAX_CACHE_SIZE) {
    const firstKey = aiCache.keys().next().value;
    aiCache.delete(firstKey);
  }
  
  aiCache.set(key, {
    data,
    timestamp: Date.now()
  });
}

// AI调用统计
const aiStats = {
  totalCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  totalTokens: 0,
  avgResponseTime: 0,
  callsByType: {}
};

// 记录AI调用
function recordAICall(type, hit, responseTime, error = false) {
  aiStats.totalCalls++;
  if (hit) {
    aiStats.cacheHits++;
  } else {
    aiStats.cacheMisses++;
  }
  if (error) {
    aiStats.errors++;
  }
  
  if (!aiStats.callsByType[type]) {
    aiStats.callsByType[type] = { count: 0, hits: 0, misses: 0, errors: 0 };
  }
  aiStats.callsByType[type].count++;
  if (hit) aiStats.callsByType[type].hits++;
  else aiStats.callsByType[type].misses++;
  if (error) aiStats.callsByType[type].errors++;
  
  // 更新平均响应时间
  if (responseTime) {
    const totalTime = aiStats.avgResponseTime * (aiStats.totalCalls - 1);
    aiStats.avgResponseTime = (totalTime + responseTime) / aiStats.totalCalls;
  }
}

// 摄影知识库提示词（增强版）
const PHOTOGRAPHY_SYSTEM_PROMPT = `你是一位资深摄影导师，拥有20年摄影经验，精通各类摄影题材、器材知识、后期技巧和艺术创作。

**核心职责**：
- 为摄影爱好者提供专业、实用、易懂的指导
- 根据用户水平（新手/进阶/专业）调整建议深度
- 结合实际场景给出可操作的具体建议

**回答原则**：
1. **专业准确**：基于摄影理论和实践经验，确保技术建议的正确性
2. **通俗易懂**：避免过多专业术语，用生动的比喻帮助理解
3. **具体实用**：
   - 给出具体参数范围（如光圈f/2.8-f/5.6而非"大光圈"）
   - 说明参数选择的原因和适用场景
   - 提供多个方案供用户根据条件选择
4. **结构清晰**：用分点、分段的方式组织内容，方便阅读
5. **激发创作**：鼓励用户尝试和创新，培养摄影眼光
6. **安全提醒**：涉及特殊环境拍摄时，提醒安全注意事项

**回答模板**：
- 简要总结问题要点
- 分点给出具体建议
- 提供参数参考（如适用）
- 给出实用技巧或注意事项
- 鼓励性总结`;

// 器材选购助手提示词（增强版）
const EQUIPMENT_SYSTEM_PROMPT = `你是一位资深摄影器材顾问，在相机行业工作15年，熟悉各品牌产品线、性能特点、市场价格和用户口碑。

**核心职责**：
- 根据用户需求、预算、经验水平推荐最合适的器材方案
- 帮助用户避免盲目消费，建立合理的器材体系

**推荐原则**：
1. **需求导向**：
   - 深入分析用户的主要拍摄题材和使用场景
   - 考虑用户的经验水平和成长空间
   - 评估预算合理性，必要时建议调整

2. **方案设计**：
   - 提供2-3个不同预算档位的方案
   - 每个方案包含：机身+镜头+必要配件
   - 标注总价和各项目价格区间

3. **深度对比**：
   - 优点：具体说明该方案的核心优势
   - 缺点：客观指出不足和限制
   - 适合人群：明确推荐给谁使用
   - 升级路径：说明未来可扩展方向

4. **性价比分析**：
   - 对比新机 vs 二手机
   - 评估是否值得多花钱买高端型号
   - 提醒哪些功能是噱头，哪些是刚需

5. **购买建议**：
   - 给出优先级排序（先买机身还是镜头）
   - 提醒促销时间（如双11、618）
   - 建议可延后购买的配件

**回答结构**：
【需求分析】简要总结用户需求
【方案推荐】
  方案一（入门/进阶/专业）：xxx
  方案二：xxx
  方案三：xxx
【购买建议】优先级和注意事项
【温馨提示】器材不是最重要的，技术和眼光才是`;

/**
 * 调用千问API
 */
async function callQwenAPI(messages, systemPrompt) {
  if (!QWEN_API_KEY) {
    throw new Error('千问API密钥未配置，请在.env中设置QWEN_API_KEY');
  }

  try {
    const response = await axios.post(
      QWEN_API_URL,
      {
        model: 'qwen-turbo',
        input: {
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            ...messages
          ]
        },
        parameters: {
          result_format: 'message',
          max_tokens: 1500,
          temperature: 0.7,
          top_p: 0.8
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${QWEN_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 50000 // 增加到50秒，确保AI有足够时间响应
      }
    );

    if (response.data.output && response.data.output.choices && response.data.output.choices[0]) {
      return response.data.output.choices[0].message.content;
    } else {
      throw new Error('API返回格式异常');
    }
  } catch (error) {
    console.error('调用千问API失败:', error.response?.data || error.message);
    throw new Error('AI服务暂时不可用，请稍后重试');
  }
}

/**
 * 摄影问答助手
 */
exports.photographyQA = async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({
        code: 40000,
        message: '问题不能为空'
      });
    }

    // 构建对话历史
    const messages = [
      ...history.map(item => [
        { role: 'user', content: item.question },
        { role: 'assistant', content: item.answer }
      ]).flat(),
      { role: 'user', content: question }
    ];

    // 调用AI
    const answer = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);

    res.json({
      code: 200,
      message: 'success',
      data: {
        question,
        answer,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('摄影问答失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '问答服务异常',
      error: error.message
    });
  }
};

/**
 * 器材选购助手（增强版 - 连接真实数据库）
 */
exports.equipmentAdvice = async (req, res) => {
  try {
    const { 
      budget,        // 预算
      scene,         // 使用场景
      experience,    // 经验水平
      currentGear,   // 现有器材
      question       // 具体问题
    } = req.body;

    // 1. 从数据库查询符合预算的器材
    let recommendedCameras = [];
    let recommendedLenses = [];
    
    if (budget) {
      // 查询相机（预算的60%-80%用于机身）
      const cameraMaxPrice = budget * 0.8;
      const cameraMinPrice = budget * 0.3;
      
      const [cameras] = await db.query(
        `SELECT id, brand, model, sensor_type, megapixels, price, description, 
                continuous_shooting, focus_points, video_spec, weight
         FROM cameras 
         WHERE status = 1 AND price >= ? AND price <= ?
         ORDER BY price ASC
         LIMIT 5`,
        [cameraMinPrice, cameraMaxPrice]
      );
      recommendedCameras = cameras;

      // 查询镜头（预算的20%-40%用于镜头）
      const lensMaxPrice = budget * 0.4;
      const lensMinPrice = budget * 0.1;
      
      const [lenses] = await db.query(
        `SELECT id, brand, model, focal_length, max_aperture, price, description,
                lens_type, mount, weight
         FROM lenses 
         WHERE status = 1 AND price >= ? AND price <= ?
         ORDER BY price ASC
         LIMIT 5`,
        [lensMinPrice, lensMaxPrice]
      );
      recommendedLenses = lenses;
    }

    // 2. 构建用户需求描述
    let userRequirement = '我想购买摄影器材，具体需求如下：\n';
    if (budget) userRequirement += `预算：${budget}元\n`;
    if (scene) {
      const sceneText = Array.isArray(scene) ? scene.join('、') : scene;
      userRequirement += `主要拍摄场景：${sceneText}\n`;
    }
    if (experience) userRequirement += `摄影经验：${experience}\n`;
    if (currentGear) userRequirement += `现有器材：${currentGear}\n`;
    if (question) userRequirement += `其他要求：${question}\n`;

    // 3. 构建器材库信息（提供给AI参考）
    let equipmentContext = '';
    
    if (recommendedCameras.length > 0) {
      equipmentContext += '\n**当前数据库中符合预算的相机选项：**\n';
      recommendedCameras.forEach((cam, index) => {
        equipmentContext += `\n${index + 1}. ${cam.brand} ${cam.model}\n`;
        equipmentContext += `   - ID: ${cam.id}\n`;
        equipmentContext += `   - 价格: ¥${cam.price}\n`;
        if (cam.sensor_type) equipmentContext += `   - 传感器: ${cam.sensor_type}\n`;
        if (cam.megapixels) equipmentContext += `   - 像素: ${cam.megapixels}MP\n`;
        if (cam.continuous_shooting) equipmentContext += `   - 连拍: ${cam.continuous_shooting}fps\n`;
        if (cam.focus_points) equipmentContext += `   - 对焦点: ${cam.focus_points}点\n`;
        if (cam.video_spec) equipmentContext += `   - 视频: ${cam.video_spec}\n`;
        if (cam.description) equipmentContext += `   - 简介: ${cam.description}\n`;
      });
    }
    
    if (recommendedLenses.length > 0) {
      equipmentContext += '\n**当前数据库中符合预算的镜头选项：**\n';
      recommendedLenses.forEach((lens, index) => {
        equipmentContext += `\n${index + 1}. ${lens.brand} ${lens.model}\n`;
        equipmentContext += `   - ID: ${lens.id}\n`;
        equipmentContext += `   - 价格: ¥${lens.price}\n`;
        if (lens.focal_length) equipmentContext += `   - 焦距: ${lens.focal_length}\n`;
        if (lens.max_aperture) equipmentContext += `   - 光圈: f/${lens.max_aperture}\n`;
        if (lens.lens_type) equipmentContext += `   - 类型: ${lens.lens_type}\n`;
        if (lens.mount) equipmentContext += `   - 卡口: ${lens.mount}\n`;
        if (lens.description) equipmentContext += `   - 简介: ${lens.description}\n`;
      });
    }

    // 4. 构建完整的AI提示
    const aiPrompt = userRequirement + equipmentContext + `

请基于以上真实器材数据，为用户推荐2-3个不同档次的器材方案。
每个方案必须包含：
1. 方案名称（入门/进阶/专业）
2. 推荐的相机和镜头（请使用上面列表中的器材ID和名称）
3. 总价计算
4. 优缺点分析
5. 适合人群
6. 购买建议

**重要**：请在推荐中明确标注器材ID（例如：相机ID:1，镜头ID:2），方便用户查看详情。`;

    const messages = [
      { role: 'user', content: aiPrompt }
    ];

    // 5. 调用AI生成建议
    const answer = await callQwenAPI(messages, EQUIPMENT_SYSTEM_PROMPT);

    // 6. 解析AI回复中的器材ID
    const cameraIds = [];
    const lensIds = [];
    const idPattern = /(相机|镜头)\s*ID\s*[:：]?\s*(\d+)/g;
    let match;
    while ((match = idPattern.exec(answer)) !== null) {
      const type = match[1];
      const id = parseInt(match[2]);
      if (type === '相机') {
        cameraIds.push(id);
      } else if (type === '镜头') {
        lensIds.push(id);
      }
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        requirement: userRequirement,
        advice: answer,
        recommendedEquipments: {
          cameras: recommendedCameras,
          lenses: recommendedLenses
        },
        parsedIds: {
          cameraIds: [...new Set(cameraIds)],
          lensIds: [...new Set(lensIds)]
        },
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('器材推荐失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '推荐服务异常',
      error: error.message
    });
  }
};

/**
 * 作品分析（增强版）
 */
exports.analyzeWork = async (req, res) => {
  try {
    const { workId, description, exifData } = req.body;

    if (!description) {
      return res.status(400).json({
        code: 40000,
        message: '请提供作品描述'
      });
    }

    // 构建详细的作品分析提示词
    let prompt = `作为一位专业摄影导师，请对以下作品进行全面分析：

**作品信息**：
${description}
`;

    // 如果有EXIF数据，添加到提示词中
    if (exifData) {
      prompt += `\n**拍摄参数**：
`;
      if (exifData.camera) prompt += `相机：${exifData.camera}\n`;
      if (exifData.lens) prompt += `镜头：${exifData.lens}\n`;
      if (exifData.focalLength) prompt += `焦距：${exifData.focalLength}mm\n`;
      if (exifData.aperture) prompt += `光圈：f/${exifData.aperture}\n`;
      if (exifData.shutterSpeed) prompt += `快门：${exifData.shutterSpeed}s\n`;
      if (exifData.iso) prompt += `ISO：${exifData.iso}\n`;
    }

    prompt += `
请从以下维度进行专业分析：

**1. 构图分析**
- 构图方式（三分法/对称/引导线等）
- 主体位置是否合理
- 画面平衡感
- 留白和裁剪建议
- 优点和可改进之处

**2. 曝光分析**
- 整体曝光是否准确
- 高光和阴影细节
- 对比度控制
- 参数设置是否合理
- 曝光补偿建议

**3. 色彩评价**
- 色调风格（清新/浓郁/复古等）
- 色彩搭配和谐性
- 白平衡准确性
- 氛围营造
- 后期调色建议

**4. 用光分析**
- 光线方向和质感
- 光影对比
- 高光位置
- 用光技巧评价
- 改进建议

**5. 技术要点**
- 对焦准确性
- 景深控制
- 快门速度选择
- 清晰度和锐度
- 噪点控制

**6. 艺术表现**
- 主题表达
- 情感传递
- 创意和亮点
- 故事性和感染力

**7. 改进建议**
- 最重要的3个改进点
- 具体可操作的优化方法
- 重新拍摄的参数建议

**8. 总体评分**
- 构图：★★★★☆ (x/5)
- 曝光：★★★★☆ (x/5)
- 色彩：★★★★☆ (x/5)
- 创意：★★★★☆ (x/5)
- 综合评分：★★★★☆ (x/5)

请给出建设性、专业且鼓励性的分析。`;

    const messages = [
      { role: 'user', content: prompt }
    ];

    const answer = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);

    res.json({
      code: 200,
      message: 'success',
      data: {
        workId,
        analysis: answer,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('作品分析失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '分析服务异常',
      error: error.message
    });
  }
};

/**
 * 拍摄地AI推荐
 */
exports.locationAdvice = async (req, res) => {
  try {
    const { 
      locationName,
      address,
      latitude,
      longitude,
      category,
      description 
    } = req.body;

    if (!locationName) {
      return res.status(400).json({
        code: 40000,
        message: '请提供地点名称'
      });
    }

    // 构建拍摄地信息
    let locationInfo = `拍摄地点：${locationName}\n`;
    if (address) locationInfo += `地址：${address}\n`;
    if (category) {
      const categoryMap = {
        natural: '自然风光',
        architecture: '古建筑',
        modern: '现代建筑',
        park: '公园'
      };
      locationInfo += `类型：${categoryMap[category] || category}\n`;
    }
    if (description) locationInfo += `简介：${description}\n`;

    // 构建AI提示词
    const prompt = `作为专业摄影顾问，请为以下拍摄地点提供详细的拍摄建议：

${locationInfo}

请从以下几个方面提供建议：

1. **最佳拍摄时间**
   - 推荐一天中的最佳拍摄时段（如日出、日落、蓝调时刻等）
   - 推荐最佳季节或月份
   - 天气条件建议

2. **机位推荐**
   - 推荐2-3个最佳拍摄机位
   - 每个机位的特点和适合拍摄的题材
   - 机位的具体位置描述

3. **推荐拍摄参数**
   - 光圈建议（如f/8用于风光，f/1.8用于虚化）
   - 快门速度建议（根据题材）
   - ISO设置建议
   - 焦距选择建议

4. **构图建议**
   - 适合的构图方法
   - 如何利用前景和背景
   - 拍摄角度建议

5. **注意事项**
   - 安全注意事项
   - 拍摄许可或门票信息
   - 其他实用建议

请用简洁专业的语言回答，方便摄影师快速掌握要点。`;

    const messages = [
      { role: 'user', content: prompt }
    ];

    // 调用AI
    const advice = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);

    res.json({
      code: 200,
      message: 'success',
      data: {
        locationName,
        advice,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('拍摄地推荐失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '推荐服务异常',
      error: error.message
    });
  }
};

/**
 * 获取快速提问模板
 */
exports.getQuickQuestions = async (req, res) => {
  try {
    const quickQuestions = [
      {
        category: '入门基础',
        questions: [
          '光圈、快门、ISO三者的关系是什么？',
          '如何选择对焦模式？',
          '什么是曝光三角？',
          '如何避免照片模糊？'
        ]
      },
      {
        category: '构图技巧',
        questions: [
          '三分法构图如何运用？',
          '如何拍出有纵深感的照片？',
          '前景和背景如何搭配？',
          '引导线构图有哪些技巧？'
        ]
      },
      {
        category: '人像摄影',
        questions: [
          '如何拍出好看的人像？',
          '人像用光有哪些技巧？',
          '如何拍出自然的表情？',
          '室内人像参数如何设置？'
        ]
      },
      {
        category: '风光摄影',
        questions: [
          '日出日落如何拍摄？',
          '星空摄影需要什么器材？',
          '如何拍出流水丝绸效果？',
          '城市夜景参数如何设置？'
        ]
      }
    ];

    res.json({
      code: 200,
      message: 'success',
      data: quickQuestions
    });
  } catch (error) {
    console.error('获取快速提问失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取快速提问失败'
    });
  }
};

/**
 * 课程推荐AI（新增）
 */
exports.recommendCourse = async (req, res) => {
  try {
    const { userLevel, interests, learningGoal, availableTime } = req.body;

    if (!userLevel) {
      return res.status(400).json({
        code: 40000,
        message: '请提供用户水平'
      });
    }

    // 构建用户学习画像
    let userProfile = `用户水平：${userLevel}\n`;
    if (interests && interests.length > 0) {
      userProfile += `兴趣方向：${interests.join('、')}\n`;
    }
    if (learningGoal) {
      userProfile += `学习目标：${learningGoal}\n`;
    }
    if (availableTime) {
      userProfile += `可用学习时间：${availableTime}\n`;
    }

    const prompt = `作为一位摄影教育专家，请根据以下用户信息，设计个性化的学习路径：

${userProfile}

请提供：

**1. 学习路径规划**
- 阶段1：基础入门（建议学习的课程主题）
- 阶段2：进阶提升（建议学习的课程主题）
- 阶段3：高级进阶（建议学习的课程主题）

**2. 课程推荐列表**（每个阶段3-5门课程）
例如：
- 《摄影基础：曝光三角》 - 入门级
- 《构图艺术与实践》 - 进阶级
- 《风光摄影大师班》 - 高级

**3. 学习计划建议**
- 每天/每周学习时间分配
- 学习顺序和节奏
- 实践练习建议

**4. 学习方法指导**
- 如何高效学习摄影课程
- 理论与实践的结合
- 如何检验学习成果

**5. 注意事项**
- 避免的学习误区
- 坚持学习的方法

请给出详细且实用的学习路径规划。`;

    const messages = [
      { role: 'user', content: prompt }
    ];

    const recommendation = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);

    res.json({
      code: 200,
      message: 'success',
      data: {
        userProfile,
        recommendation,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('课程推荐失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '推荐服务异常',
      error: error.message
    });
  }
};

/**
 * 挑战赛主题AI生成（新增）
 */
exports.generateChallengeTheme = async (req, res) => {
  try {
    const { difficulty, category, season, duration } = req.body;

    // 构建主题生成需求
    let requirements = '';
    if (difficulty) requirements += `难度级别：${difficulty}\n`;
    if (category) requirements += `拍摄类型：${category}\n`;
    if (season) requirements += `季节主题：${season}\n`;
    if (duration) requirements += `活动周期：${duration}天\n`;

    const prompt = `作为一位摄影活动策划专家，请设计一个有趣且有挑战性的摄影挑战赛。

**需求信息**：
${requirements || '无特殊要求，请自由创作'}

请提供以下内容：

**1. 挑战赛主题**
- 主题名称（吸引人且有创意）
- 主题描述（100-200字）
- 主题标签（3-5个）

**2. 参赛规则**
- 拍摄要求（内容、风格、技术）
- 参赛条件（器材、经验限制）
- 作品提交要求（数量、尺寸、格式）
- 禁止事项（后期程度、版权问题）

**3. 评分标准**
- 主题符合度（x%）
- 技术表现（x%）
- 创意度（x%）
- 视觉冲击力（x%）
- 故事性/情感（x%）

**4. 奖项设置建议**
- 一等奖（x名）：奖品建议
- 二等奖（x名）：奖品建议
- 三等奖（x名）：奖品建议
- 人气奖：投票机制

**5. 活动亮点**
- 为什么这个主题有趣
- 如何提高参与度
- 社交传播点

**6. 实施建议**
- 活动周期计划
- 宣传推广建议
- 注意事项

请给出详细、创意且具有可执行性的方案。`;

    const messages = [
      { role: 'user', content: prompt }
    ];

    const theme = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);

    res.json({
      code: 200,
      message: 'success',
      data: {
        requirements: requirements || '无特殊要求',
        theme,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('主题生成失败:', error);
    res.status(500).json({
      code: 50000,
      message: error.message || '生成服务异常',
      error: error.message
    });
  }
};

/**
 * 智能标签生成（新增）
 * 根据作品信息（标题、描述、EXIF数据）生成标签推荐
 */
exports.generateTags = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { title, description, exifData, location, existingTags } = req.body;
    
    // 生成缓存key
    const cacheKey = generateCacheKey('generate-tags', {
      title: title || '',
      description: description || '',
      exif: exifData || {},
      location: location || ''
    });
    
    // 检查缓存
    const cached = getCache(cacheKey);
    if (cached) {
      recordAICall('generate-tags', true, Date.now() - startTime);
      return res.json({
        code: 200,
        message: 'success',
        data: {
          ...cached,
          fromCache: true
        }
      });
    }
    
    // 查询热门标签（作为参考）
    // 注意：不能直接GROUP BY JSON字段，改为获取所有作品然后手动统计
    const [allWorks] = await db.query(`
      SELECT tags
      FROM works
      WHERE tags IS NOT NULL AND status = 1
      ORDER BY created_at DESC
      LIMIT 500
    `);
    
    // 解析热门标签
    const allTags = new Map();
    allWorks.forEach(work => {
      try {
        const tags = JSON.parse(work.tags);
        tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            allTags.set(tag, (allTags.get(tag) || 0) + 1);
          }
        });
      } catch (e) {
        // 忽略解析错误
      }
    });
    
    // 获取最常用的20个标签
    const topTags = Array.from(allTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag]) => tag);
    
    // 构建AI提示词
    let prompt = `作为一名专业的摄影标签分类专家，请根据以下作品信息，生成5-10个精准、专业、易于搜索的标签。

**作品信息**：
`;
    
    if (title) {
      prompt += `标题：${title}\n`;
    }
    
    if (description) {
      prompt += `描述：${description}\n`;
    }
    
    if (location) {
      prompt += `拍摄地点：${location}\n`;
    }
    
    if (exifData) {
      prompt += `\n**EXIF参数**：\n`;
      if (exifData.camera) prompt += `相机：${exifData.camera}\n`;
      if (exifData.lens) prompt += `镜头：${exifData.lens}\n`;
      if (exifData.aperture) prompt += `光圈：f/${exifData.aperture}\n`;
      if (exifData.shutterSpeed) prompt += `快门：${exifData.shutterSpeed}\n`;
      if (exifData.iso) prompt += `ISO：${exifData.iso}\n`;
      if (exifData.focalLength) prompt += `焦距：${exifData.focalLength}mm\n`;
    }
    
    if (topTags.length > 0) {
      prompt += `\n**热门标签参考**（可选用，但不限于）：\n${topTags.join('、')}\n`;
    }
    
    if (existingTags && existingTags.length > 0) {
      prompt += `\n**用户已输入标签**：${existingTags.join('、')}\n`;
    }
    
    prompt += `\n**标签要求**：
1. 标签要具体、准确，避免泛泛而谈
2. 优先考虑摄影风格、拍摄题材、拍摄技法、情感氛围
3. 可包含：风格类（如风光、人像、街拍）、主题类（如日落、云海、建筑）、技术类（如长曝光、大光圈）、情感类（如宁静、震撼）
4. 每个标签2-4个字，简洁易懂
5. 如果用户已输入标签，在此基础上补充，避免完全重复
6. 按重要性排序，最重要的放前面

**输出格式**：
请直接返回标签列表，用中文逗号分隔，不需要编号或其他说明。
例如：风光,日落,长曝光,城市,宁静,大气,暖色调`;
    
    const messages = [
      { role: 'user', content: prompt }
    ];
    
    const aiResponse = await callQwenAPI(messages, PHOTOGRAPHY_SYSTEM_PROMPT);
    
    // 解析AI返回的标签
    const suggestedTagsText = aiResponse.trim();
    const suggestedTags = suggestedTagsText
      .split(/[,、，]/) // 支持中英文逗号和顿号
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length <= 10) // 过滤无效标签
      .slice(0, 10); // 最多10个
    
    // 如果有用户已输入的标签，合并并去重
    let finalTags = [...suggestedTags];
    if (existingTags && existingTags.length > 0) {
      const existingSet = new Set(existingTags.map(t => t.trim()));
      finalTags = finalTags.filter(t => !existingSet.has(t));
    }
    
    const result = {
      suggestedTags: finalTags,
      existingTags: existingTags || [],
      allTags: existingTags ? [...existingTags, ...finalTags] : finalTags,
      topTags: topTags.slice(0, 10), // 返回10个热门标签供用户选择
      aiAnalysis: aiResponse,
      timestamp: Date.now()
    };
    
    // 缓存结果
    setCache(cacheKey, result);
    
    recordAICall('generate-tags', false, Date.now() - startTime);
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        ...result,
        fromCache: false
      }
    });
  } catch (error) {
    recordAICall('generate-tags', false, Date.now() - startTime, true);
    console.error('标签生成失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    // 返回更友好的错误信息
    let errorMessage = '标签生成失败';
    if (error.message.includes('AI服务暂时不可用')) {
      errorMessage = 'AI服务暂时不可用，请稍后重试';
    } else if (error.message.includes('千问API密钥未配置')) {
      errorMessage = 'AI服务未配置，请联系管理员';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'AI服务响应超时，请稍后重试';
    }
    
    res.status(500).json({
      code: 50000,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 获取热门标签
 */
exports.getPopularTags = async (req, res) => {
  try {
    const { limit = 30, category } = req.query;
    
    // 查询所有作品的标签
    const [works] = await db.query(`
      SELECT tags
      FROM works
      WHERE tags IS NOT NULL AND status = 1
      ORDER BY created_at DESC
      LIMIT 1000
    `);
    
    // 统计标签出现次数
    const tagStats = new Map();
    works.forEach(work => {
      try {
        const tags = JSON.parse(work.tags);
        tags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            tagStats.set(tag, (tagStats.get(tag) || 0) + 1);
          }
        });
      } catch (e) {}
    });
    
    // 排序并返回
    let popularTags = Array.from(tagStats.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit));
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        tags: popularTags,
        total: tagStats.size,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('获取热门标签失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取热门标签失败'
    });
  }
};

/**
 * 搜索标签（用于自动补全）
 */
exports.searchTags = async (req, res) => {
  try {
    const { keyword, limit = 10 } = req.query;
    
    if (!keyword || keyword.trim().length === 0) {
      return res.json({
        code: 200,
        message: 'success',
        data: { tags: [] }
      });
    }
    
    // 查询包含关键词的标签
    const [works] = await db.query(`
      SELECT tags
      FROM works
      WHERE tags IS NOT NULL 
        AND status = 1
        AND tags LIKE ?
      LIMIT 500
    `, [`%${keyword}%`]);
    
    // 统计匹配的标签
    const matchedTags = new Map();
    const searchKeyword = keyword.trim().toLowerCase();
    
    works.forEach(work => {
      try {
        const tags = JSON.parse(work.tags);
        tags.forEach(tag => {
          if (tag && typeof tag === 'string' && 
              tag.toLowerCase().includes(searchKeyword)) {
            matchedTags.set(tag, (matchedTags.get(tag) || 0) + 1);
          }
        });
      } catch (e) {}
    });
    
    // 排序返回
    const results = Array.from(matchedTags.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => {
        // 优先完全匹配
        const aExact = a.tag.toLowerCase() === searchKeyword ? 1 : 0;
        const bExact = b.tag.toLowerCase() === searchKeyword ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        // 然后按使用次数
        return b.count - a.count;
      })
      .slice(0, parseInt(limit));
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        tags: results,
        keyword,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('搜索标签失败:', error);
    res.status(500).json({
      code: 50000,
      message: '搜索标签失败'
    });
  }
};

/**
 * 获取AI统计数据（新增）
 */
exports.getAIStats = async (req, res) => {
  try {
    // 计算缓存命中率
    const cacheHitRate = aiStats.totalCalls > 0 
      ? ((aiStats.cacheHits / aiStats.totalCalls) * 100).toFixed(2) + '%'
      : '0%';
    
    res.json({
      code: 200,
      message: 'success',
      data: {
        overview: {
          totalCalls: aiStats.totalCalls,
          cacheHits: aiStats.cacheHits,
          cacheMisses: aiStats.cacheMisses,
          cacheHitRate,
          errors: aiStats.errors,
          errorRate: aiStats.totalCalls > 0 
            ? ((aiStats.errors / aiStats.totalCalls) * 100).toFixed(2) + '%'
            : '0%',
          avgResponseTime: Math.round(aiStats.avgResponseTime) + 'ms',
          cacheSize: aiCache.size,
          maxCacheSize: MAX_CACHE_SIZE
        },
        byType: aiStats.callsByType,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('获取AI统计失败:', error);
    res.status(500).json({
      code: 50000,
      message: '获取统计失败'
    });
  }
};
