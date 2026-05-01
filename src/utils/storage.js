/**
 * localStorage 统一读写封装
 * 提供 getItem 和 setItem 方法，自动处理 JSON 序列化
 */

/**
 * 从 localStorage 读取数据
 * @param {string} key - 存储键名
 * @param {*} defaultValue - 默认值（读取失败或不存在时返回）
 * @returns {*} 解析后的数据
 */
export function getItem(key, defaultValue = null) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`读取 ${key} 失败:`, error);
    return defaultValue;
  }
}

/**
 * 将数据写入 localStorage
 * @param {string} key - 存储键名
 * @param {*} value - 要存储的数据（会被 JSON 序列化）
 */
export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`写入 ${key} 失败:`, error);
  }
}