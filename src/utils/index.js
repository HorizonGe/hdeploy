import fs from 'fs';
import path from 'path';
import url from 'url';
import ora from 'ora';
import chalk from 'chalk';

// 读取并解析 package.json  (外部)
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJsonString = fs.readFileSync(packageJsonPath, 'utf8');
export const packageJson = JSON.parse(packageJsonString);

// // 读取内部 package.json数据
// 定义一个指向项目根目录的变量（这里需要手动设置）
const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const projectRoot = path.resolve(dirname, '../../');
// 使用 projectRoot 来找到 package.json
const packageInfoPath = path.join(projectRoot, 'package.json');
const packageInfoString = fs.readFileSync(packageInfoPath, 'utf8');
export const packageInfo = JSON.parse(packageInfoString);

// 获取部署文件名
export function getDeployConfigFileName() {
  const fileName = `deploy.config.${packageJson.type === 'module' ? 'cjs' : 'js'}`;
  return fileName;
}

// 检查部署配置文件是否存在
export function checkDeployConfigExists(cPath) {
  return fs.existsSync(cPath);
}

// 日志信息
export function log(message) {
  console.log(chalk.blue.bold(message));
}

// 成功信息
export function succeed(...message) {
  ora().succeed(chalk.greenBright.bold(message));
}

// 提示信息
export function info(...message) {
  ora().info(chalk.blueBright.bold(message));
}

// 错误信息
export function error(...message) {
  ora().fail(chalk.redBright.bold(message));
}

// 下划线重点信息
export function underline(message) {
  chalk.blue.underline.bold(message);
}
