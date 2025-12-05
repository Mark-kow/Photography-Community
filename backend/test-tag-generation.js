/**
 * 智能标签生成功能测试脚本
 * 用于验证API是否正常工作
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// 测试用的token（需要替换为实际的token）
const TEST_TOKEN = 'your-test-token';

// 测试用例
const testCases = [
  {
    name: '测试1: 基础标签生成',
    data: {
      title: '夕阳下的城市',
      description: '傍晚时分拍摄的城市风光',
      location: '上海外滩'
    }
  },
  {
    name: '测试2: 带EXIF参数',
    data: {
      title: '星空银河',
      description: '深夜拍摄的璀璨银河',
      exifData: {
        camera: 'Sony A7M4',
        lens: 'FE 24mm f/1.4 GM',
        aperture: '1.4',
        shutterSpeed: '30s',
        iso: '3200',
        focalLength: '24'
      },
      location: '青海湖'
    }
  },
  {
    name: '测试3: 已有标签',
    data: {
      title: '街头人像',
      description: '自然光下的街头抓拍',
      existingTags: ['人像', '街拍']
    }
  }
];

// 测试热门标签
async function testPopularTags() {
  console.log('\n========== 测试热门标签接口 ==========');
  try {
    const response = await axios.get(`${BASE_URL}/ai/popular-tags?limit=10`, {
      timeout: 5000
    });
    
    console.log('✅ 热门标签接口正常');
    console.log('返回数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 热门标签接口失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

// 测试标签搜索
async function testSearchTags() {
  console.log('\n========== 测试标签搜索接口 ==========');
  try {
    const response = await axios.get(`${BASE_URL}/ai/search-tags?keyword=风&limit=5`, {
      timeout: 5000
    });
    
    console.log('✅ 标签搜索接口正常');
    console.log('返回数据:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ 标签搜索接口失败');
    console.error('错误:', error.response?.data || error.message);
    return false;
  }
}

// 测试AI标签生成
async function testGenerateTags(testCase) {
  console.log(`\n========== ${testCase.name} ==========`);
  try {
    const response = await axios.post(`${BASE_URL}/ai/generate-tags`, testCase.data, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60秒超时
    });
    
    console.log('✅ AI标签生成成功');
    console.log('推荐标签:', response.data.data.suggestedTags);
    console.log('热门标签:', response.data.data.topTags?.slice(0, 5));
    console.log('从缓存:', response.data.data.fromCache);
    return true;
  } catch (error) {
    console.error('❌ AI标签生成失败');
    console.error('错误信息:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('提示: 后端服务未启动，请先运行 npm run dev');
    } else if (error.response?.status === 401) {
      console.error('提示: Token无效，请使用有效的登录token');
    } else if (error.response?.data?.message?.includes('AI服务')) {
      console.error('提示: AI服务调用失败，请检查:');
      console.error('  1. QWEN_API_KEY是否配置');
      console.error('  2. 网络是否正常');
      console.error('  3. 千问API是否可用');
    }
    
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   智能标签生成功能测试                 ║');
  console.log('╚════════════════════════════════════════╝');
  
  let passCount = 0;
  let failCount = 0;
  
  // 测试热门标签（不需要登录）
  const popularTagsResult = await testPopularTags();
  if (popularTagsResult) passCount++; else failCount++;
  
  // 测试标签搜索（不需要登录）
  const searchTagsResult = await testSearchTags();
  if (searchTagsResult) passCount++; else failCount++;
  
  // 测试AI生成（需要登录）
  console.log('\n========== AI标签生成测试 ==========');
  console.log('提示: 以下测试需要有效的登录token');
  console.log('如果没有token，这些测试会失败，这是正常的\n');
  
  for (const testCase of testCases) {
    const result = await testGenerateTags(testCase);
    if (result) passCount++; else failCount++;
    
    // 等待1秒，避免频繁调用
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 测试总结
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║          测试结果总结                  ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`✅ 通过: ${passCount}`);
  console.log(`❌ 失败: ${failCount}`);
  console.log(`📊 总计: ${passCount + failCount}`);
  
  if (failCount === 0) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查错误信息');
  }
}

// 运行测试
runTests().catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
