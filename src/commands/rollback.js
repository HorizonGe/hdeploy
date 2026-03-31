import { Client } from 'ssh2';
import inquirer from 'inquirer';
import {
  checkDeployConfigExists, error, succeed, log, getDeployConfigFileName,
} from '../utils/index.js';
import { deployConfigPath } from '../config/index.js';
import { pathToFileURL } from 'url';
import { connectSSH, disconnectSSH, checkPassword, openPreview } from '../utils/deploy.js';

const conn = new Client();

// 获取远程备份目录列表
function listBackupDirs(conn, bakDir) {
  return new Promise((resolve, reject) => {
    conn.exec(`ls -1 ${bakDir} 2>/dev/null`, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }
      let output = '';
      stream.on('close', () => {
        const dirs = output.trim().split('\n').filter((d) => d.trim());
        resolve(dirs);
      }).on('data', (data) => {
        output += data.toString();
      }).stderr.on('data', () => {});
    });
  });
}

// 执行回滚：清空 webDir 并复制备份文件
function restoreBackup(conn, webDir, bakDir, version) {
  return new Promise((resolve, reject) => {
    const cmd = `rm -rf ${webDir} && mkdir -p ${webDir} && cp -r ${bakDir}/${version}/. ${webDir}/`;
    log(`正在回滚至版本：${version}`);
    conn.exec(cmd, (err, stream) => {
      if (err) {
        reject(err);
        return;
      }
      stream.on('close', () => {
        resolve();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
      });
    });
  });
}

export default {
  description: '回滚项目到指定备份版本',
  apply: async () => {
    // 检查配置文件是否存在
    if (!checkDeployConfigExists(deployConfigPath)) {
      error(`${getDeployConfigFileName()} 文件不存在，请先创建并配置`);
      process.exit(1);
    }

    const config = (await import(pathToFileURL(deployConfigPath))).default;

    // 获取所有可用环境
    const excludeKeys = ['projectName', 'readyTimeout', 'cluster'];
    const envList = Object.keys(config).filter((k) => !excludeKeys.includes(k) && typeof config[k] === 'object');

    if (envList.length === 0) {
      error('配置文件中未找到可用的环境配置');
      process.exit(1);
    }

    // 选择要回滚的环境
    const { env } = await inquirer.prompt([
      {
        type: 'list',
        name: 'env',
        message: '请选择要回滚的环境',
        choices: envList.map((key) => ({
          name: config[key].name ? `${config[key].name} (${key})` : key,
          value: key,
        })),
      },
    ]);

    const envConfig = Object.assign({}, config[env], {
      readyTimeout: config.readyTimeout,
      projectName: config.projectName,
    });

    // 检查是否开启了备份功能
    if (!envConfig.isBak) {
      error(`${envConfig.name || env} 环境未开启备份功能（isBak），无法执行回滚`);
      process.exit(1);
    }

    const { bakDir, webDir } = envConfig;

    if (!bakDir) {
      error(`${envConfig.name || env} 环境未配置备份目录（bakDir）`);
      process.exit(1);
    }

    // 检查密码
    await checkPassword(envConfig);

    // 连接 SSH
    await connectSSH(conn, envConfig);

    // 获取备份版本列表
    log(`正在读取备份目录：${bakDir}`);
    const backupDirs = await listBackupDirs(conn, bakDir);

    if (backupDirs.length === 0) {
      error('备份目录为空，没有可回滚的版本');
      disconnectSSH(conn);
      process.exit(1);
    }

    // 按时间倒序排列（最新的在最前）
    const sortedDirs = [...backupDirs].sort().reverse();

    // 选择回滚版本
    const { version } = await inquirer.prompt([
      {
        type: 'list',
        name: 'version',
        message: '请选择要回滚的版本（↑↓ 键选择，Enter 确认）',
        choices: sortedDirs,
      },
    ]);

    // 执行回滚
    await restoreBackup(conn, webDir, bakDir, version);

    disconnectSSH(conn);

    succeed(`恭喜您，${config.projectName} 项目已成功回滚至版本 ${version}`);

    if (envConfig.isOpenPreview && envConfig.previewUrl) {
      await openPreview(envConfig.previewUrl);
    }

    process.exit(0);
  },
};
