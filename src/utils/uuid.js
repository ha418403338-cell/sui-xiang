/**
 * 生成 UUID 的简单实现
 * @returns {string} 唯一标识符
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}