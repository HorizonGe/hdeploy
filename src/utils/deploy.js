import {
  error, log, succeed, info,
} from './index.js';
import ora from 'ora';
import childProcess from 'child_process';
import archiver from 'archiver';
import fs from 'fs';
import fetch from 'node-fetch';
import scpClient from 'scp2';
import figlet from 'figlet';
import open from 'open';
import inquirer from 'inquirer';

const maxBuffer = 5000 * 1024;

export function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(time);
    }, time);
  });
}

// 检查环境是否正确
export const checkEnvCorrect = (config, env) => {
  const keys = ['name', 'host', 'port', 'username', 'distPath', 'webDir'];

  if (config) {
    keys.forEach((key) => {
      if (!config[env][key] || config[env][key] === '/') {
        error(
          `配置错误: ${env}环境 ${key}属性 配置不正确`,
        );
        process.exit(1);
      }
    });
  } else {
    error('配置错误: 未指定部署环境或指定部署环境不存在');
    process.exit(1);
  }
};

export function checkPassword(config) {
  return new Promise((resolve, reject) => {
    const { password } = config;
    if (password) {
      resolve();
    } else {
      const inquirerConfig = [
        {
          type: 'input',
          name: 'password',
          message: '请输入服务器密码',

        },
      ];
      inquirer.prompt(inquirerConfig).then((inputInfo) => {
        if (inputInfo.password) {
          config.password = inputInfo.password;
          resolve();
        } else {
          error('密码不能为空');
          reject(new Error('密码不能为空'));
          process.exit(1);
        }
      });
    }
  });
}

// 打印部署信息
export function deployInfo(config) {
  return new Promise((resolve) => {
    figlet('HDEPLOY', (err, data) => {
      if (err) {
        console.log('Something went wrong...');
        console.dir(err);
      }
      console.log(data);
      const logInfo = `
        > 部署项目：${config.projectName}
        > 部署环境：${config.name}
        > 部署服务器：${config.host}
        > 待发布文件路径：${config.distPath}
        > 服务器部署路径： ${config.webDir}
        ${config.extraMsg ? `> 发布人：${config.extraMsg}` : ''}
        `;
      log(logInfo);
      resolve();
    });
  });
}

// 执行打包脚本
export function execBuild(config) {
  return new Promise((resolve, reject) => {
    const { script } = config;
    if (!script) {
      info('未设置打包命令，执行下一步');
      resolve();
      return;
    }
    log(`执行：${script}`);
    const spinner = ora('正在打包中\n');

    spinner.start();
    try {
      childProcess.exec(
        script,
        { cwd: process.cwd(), maxBuffer },
        (e) => {
          spinner.stop();
          if (e === null) {
            succeed('打包成功');
            resolve();
          } else {
            error('打包失败');
            error(e);
            reject(e.message);
          }
        },
      );
    } catch (e) {
      error('打包失败');
      error(e);
      reject(e);
      process.exit(1);
    }
  });
}

function getFileName(location) {
  return location.split('/').pop();
}

// 压缩打包文件
export function compress(distPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(`${distPath}.tar.gz`);
    const archive = archiver('tar', { gzip: true, gzipOptions: { level: 9 } });
    output.on('close', (e) => {
      if (e) {
        error(`打包tar.gz出错：${e}`);
        reject(e);
        process.exit(1);
      } else {
        succeed(`${getFileName(distPath)}.tar.gz 压缩成功`);
        resolve();
      }
    });
    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn(err);
      } else {
        reject(err);
      }
    });

    archive.on('error', (err) => {
      reject(err);
    });
    archive.pipe(output);
    archive.directory(distPath, false);
    archive.finalize();
  });
}

// SSH服务器连接
export function connectSSH(conn, config) {
  return new Promise((resolve, reject) => {
    const {
      host, port, username, password,
    } = config;
    log(`(SSH 连接 ${host})`);

    conn.on('ready', () => {
      succeed('SSH 连接成功');
      resolve();
    }).connect({
      host,
      port,
      username,
      password,
    });

    conn.on('error', (err) => {
      error(err);
      reject(err);
    });
  });
}

// 发送消息通知
export function dingMsg(token, msg, config) {
  if (!msg) {
    return;
  }
  if (msg.includes('%extraMsg%')) {
    if (config.extraMsg) {
      msg = msg.replace('%extraMsg%', config.extraMsg);
    }
  }
  const url = `https://oapi.dingtalk.com/robot/send?access_token=${token}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      msgtype: 'text',
      text: { content: msg },
    }),
  };

  return fetch(url, options);
}

// 获取当前时间
function formatTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

// 备份原始文件
export function backup(conn, config) {
  return new Promise((resolve, reject) => {
    const { bakDir, maxBakNum, webDir } = config;
    const pathArr = webDir.split('/');
    const rootFolder = pathArr.pop();
    const rootPath = pathArr.join('/');
    const currentDate = new Date();
    const currentTime = formatTime(currentDate);
    // const cmd = `
    // mkdir -p ${bakDir}/${currentTime}\n
    // if [ $(ls -l ${bakDir} | grep -c ^d) -ge ${maxBakNum} ]; then
    //   oldestBackup=$(ls -lt ${bakDir} | grep ^d | awk '{print $NF}' | tail -n 1)
    //   rm -rf ${bakDir}/$oldestBackup
    // fi
    // cp -r ${webDir} ${bakDir}/${currentTime}/\n
    // rm -rf ${webDir}`;
    const cmd = `cd ${rootPath}\n
    mkdir -p _backUp/${rootFolder}_${currentTime}\n 
    if [ $(ls -l _backUp | grep -c ^d) -ge ${maxBakNum} ]; then
      oldestBackup=$(ls -lt _backUp | grep ^d | awk '{print $NF}' | tail -n 1)
      rm -rf _backUp/$oldestBackup
    fi
    cp -r ${webDir} ${rootPath}/_backUp/${rootFolder}_${currentTime}/\n`;
    log('执行备份命令');
    conn.exec(cmd, (err, stream) => {
      if (err) {
        error(err);
        reject(err);
        process.exit(1);
      }
      stream.on('close', () => {
        succeed('已完成备份');
        resolve();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
      });
    });
  });
}

export function deleteRemoteFile(conn, config) {
  return new Promise((resolve, reject) => {
    const { webDir } = config;
    log('删除远程文件...');
    conn.exec(`rm -rf ${webDir}`, (err, stream) => {
      if (err) {
        error(err);
        reject(err);
      }
      stream.on('close', () => {
        succeed('已删除远程文件');
        resolve();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
      });
    });
  });
}

// 创建远程文件夹
export function createRemoteFolder(conn, config) {
  return new Promise((resolve, reject) => {
    const { webDir } = config;
    log('创建远程文件夹...');
    conn.exec(`mkdir -p ${webDir}`, (err, stream) => {
      if (err) {
        error(err);
        reject(err);
      }
      stream.on('close', () => {
        succeed('已创建远程文件夹');
        resolve();
      }).on('data', (data) => {
        console.log(`STDOUT: ${data}`);
      }).stderr.on('data', (data) => {
        console.log(`STDERR: ${data}`);
      });
    });
  });
}
// 上传服务器
export function uploadServer(conn, config) {
  return new Promise((resolve, reject) => {
    log('上传服务器中...');
    const {
      webDir, distPath, host, port, username, password,
    } = config;
    scpClient.scp(
      `${distPath}.tar.gz`,
      {
        host,
        port,
        username,
        password,
        path: webDir,
      },
      (err) => {
        if (err) {
          error('上传失败');
          reject(err);
        } else {
          succeed('上传成功');
          resolve();
        }
      },
    );
  });
}

// 解压文件
export function unzip(conn, config) {
  return new Promise((resolve, reject) => {
    log('正在解压');
    const { webDir, distPath } = config;
    // 这里还没有校验非根目录情况
    const cmd = `cd ${webDir} && tar -zxvf ${getFileName(distPath)}.tar.gz && rm -f ${getFileName(distPath)}.tar.gz`;
    conn.exec(cmd, (err, stream) => {
      if (err) {
        error('解压失败:', err);
        reject(err);
      } else {
        succeed('解压缩完成');
        stream.on('close', () => {
          resolve();
        }).on('data', () => {
        }).stderr.on('data', () => {
        });
      }
    });
  });
}

// 关闭SSH连接
export function disconnectSSH(conn) {
  conn.end();
}

// 打开预览地址
export async function openPreview(url) {
  await open(url, { wait: true });
}
