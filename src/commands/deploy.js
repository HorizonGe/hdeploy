import { Client } from 'ssh2';
import {
  checkDeployConfigExists, underline, succeed, error, getDeployConfigFileName,
} from '../utils/index.js';
import { deployConfigPath } from '../config/index.js';
import { pathToFileURL } from 'url';
import {
  checkEnvCorrect, execBuild, compress, connectSSH,
  dingMsg, backup, uploadServer, unzip, disconnectSSH,
  deployInfo, openPreview, checkPassword,
  deleteRemoteFile, createRemoteFolder,
} from '../utils/deploy.js';
import { confirmMsg } from '../utils/prompt.js';

// ssh连接
const conn = new Client();

// 任务列表
let taskList;

// 创建任务列表
const createTaskList = (config) => {
  const {
    distPath,
    isOpenDingMsg,
    dingToken,
    dingStartMsg,
    dingEndMsg,
    isBak,
    isDeleteRemoteFile = true,
    isOpenPreview,
    previewUrl,
  } = config;

  taskList = [];
  // 检查密码输入
  taskList.push(() => checkPassword(config));
  // 打印部署信息
  taskList.push(() => deployInfo(config));
  // 打包
  taskList.push(() => execBuild(config));
  // 压缩
  taskList.push(() => compress(distPath));
  // 连接ssh
  taskList.push(() => connectSSH(conn, config));
  // 备份原始文件
  if (isBak) {
    taskList.push(() => backup(conn, config));
  }
  // 删除远程文件
  if (isDeleteRemoteFile) {
    taskList.push(() => deleteRemoteFile(conn, config));
  }

  // 开始部署钉钉通知
  if (isOpenDingMsg) {
    taskList.push(() => dingMsg(dingToken, dingStartMsg, config));
  }

  // 创建远程文件夹
  if (isDeleteRemoteFile) {
    taskList.push(() => createRemoteFolder(conn, config));
  }
  // 上传服务器
  taskList.push(() => uploadServer(conn, config));
  // 解压
  taskList.push(() => unzip(conn, config));
  // 关闭SSH连接
  taskList.push(() => disconnectSSH(conn, config));
  // 部署完成钉钉通知
  if (isOpenDingMsg) {
    taskList.push(() => dingMsg(dingToken, dingEndMsg));
  }
  // 打开预览
  if (isOpenPreview) {
    taskList.push(() => openPreview(previewUrl));
  }
};

// 执行任务列表
const executeTaskList = async (finish = true) => {
  try {
    for (let i = 0; i < taskList.length; i += 1) {
      await taskList[i]();
    }
    succeed('部署完成');
    if (finish) {
      process.exit(0);
    }
  } catch (error) {
    console.error('在执行任务时出错：', error);
  }
};

export default {
  description: '部署项目',
  apply: async (env) => {
    if (!checkDeployConfigExists(deployConfigPath)) {
      error(
        `${getDeployConfigFileName()} 文件不存在，请先创建并配置`,
      );
      process.exit(1);
    }
    const config = (await import(pathToFileURL(deployConfigPath))).default;
    const cluster = config.cluster;
    const projectName = config.projectName;
    const currentTime = new Date().getTime();

    const createdEnvConfig = (cenv) => {
      checkEnvCorrect(config, cenv);
      return Object.assign(config[cenv], {
        readyTimeout: config.readyTimeout,
        projectName: config.projectName,
      });
    };
    if (env) {
      if (env === 'cluster') {
        // 集群部署
        if (Array.isArray(cluster) && cluster.length > 0) {
          const answers = await confirmMsg(
            `${projectName} 项目是否部署到 ${cluster.join('、')}集群环境?`,
          );
          if (answers.confirm) {
            for (let i = 0; i < cluster.length; i += 1) {
              const envConfig = createdEnvConfig(cluster[i]);
              createTaskList(envConfig);
              let finish = false;
              if (i === cluster.length - 1) {
                finish = true;
              }
              await executeTaskList(finish);
              succeed(`恭喜您，${projectName}项目已在${envConfig.name}部署成功`);
            }
            succeed(`集群部署已完成 耗时${(new Date().getTime() - currentTime) / 1000}s\n`);
          } else {
            process.exit(1);
          }
        } else {
          error(
            '请使用 -mode 指定部署环境或在配置文件中指定 cluster（集群）地址',
          );
          process.exit(1);
        }
      } else {
        // 单个部署
        const envConfig = createdEnvConfig(env);
        let confirm = true;
        if (envConfig.showConfirmMsg) {
          const answers = await confirmMsg(
            `${projectName} 项目是否部署到 ${envConfig.name}?`,
          );
          confirm = answers.confirm;
        }

        if (confirm) {
          createTaskList(envConfig);

          await executeTaskList(true);

          succeed(
            `恭喜您，${projectName}项目已在${underline(
              envConfig.name,
            )}部署成功 耗时${(new Date().getTime() - currentTime) / 1000}s\n`,
          );
          process.exit(0);
        } else {
          process.exit(1);
        }
      }
    }
  },
};
