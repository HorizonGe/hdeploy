import fs from 'fs';
import childProcess from 'child_process';
import inquirer from 'inquirer';
import {
  checkDeployConfigExists,
  getDeployConfigFileName,
  succeed,
  error,
} from '../utils/index.js';
import { inquirerConfig, deployConfigPath } from '../config/index.js';

// 获取用户输入信息
const getUserInputInfo = () => inquirer.prompt(inquirerConfig);

// 创建JSON对象
const createJsonObj = (userInputInfo) => {
  const jsonObj = {
    projectName: userInputInfo.projectName,
    readyTimeout: 20000,
    cluster: [],
  };
  const { deployEnvList } = userInputInfo;

  const createObj = (env) => ({
    name: userInputInfo[`${env}Name`],
    script: userInputInfo[`${env}Script`],
    host: userInputInfo[`${env}Host`],
    port: userInputInfo[`${env}Port`],
    username: userInputInfo[`${env}Username`],
    privateKeyPath: userInputInfo[`${env}PrivateKeyPath`] || '',
    privateKeyPassphrase: userInputInfo[`${env}PrivateKeyPassphrase`] || '',
    password: userInputInfo[`${env}Password`] || '',
    distPath: userInputInfo[`${env}DistPath`],
    webDir: userInputInfo[`${env}WebDir`],
    isBak: userInputInfo[`${env}IsBak`],
    bakDir: userInputInfo[`${env}BakDir`],
    maxBakNum: userInputInfo[`${env}MaxBakNum`],
    isDeleteRemoteFile: userInputInfo[`${env}isDeleteRemoteFile`],
    showConfirmMsg: userInputInfo[`${env}showConfirmMsg`],
    isRemoveLocalFile: userInputInfo[`${env}IsRemoveLocalFile`],
    isOpenDingMsg: userInputInfo[`${env}IsOpenDingMsg`],
    dingToken: userInputInfo[`${env}DingToken`],
    dingStartMsg: userInputInfo[`${env}DingStartMsg`],
    dingEndMsg: userInputInfo[`${env}DingEndMsg`],
    isOpenPreview: userInputInfo[`${env}IsOpenPreview`],
    previewUrl: userInputInfo[`${env}PreviewUrl`],
  });

  deployEnvList.forEach((item) => {
    jsonObj[item] = createObj(item);
  });

  return jsonObj;
};

// 创建配置文件
const createConfigFile = (jsonObj) => {
  const str = `module.exports = ${JSON.stringify(jsonObj, null, 2)}`;
  fs.writeFileSync(deployConfigPath, str);
};

// 格式化配置文件
const formatConfigFile = () => {
  childProcess.execSync(`npx prettier --write ${deployConfigPath}`);
};

export default {
  description: '初始化项目',
  apply: () => {
    if (checkDeployConfigExists(deployConfigPath)) {
      error(`${getDeployConfigFileName()} 配置文件已存在`);
      process.exit(1);
    } else {
      getUserInputInfo().then((userInputInfo) => {
        createConfigFile(createJsonObj(userInputInfo));
        formatConfigFile();
        succeed(
          `配置文件生成成功，请查看项目目录下的 ${getDeployConfigFileName()} 文件确认配置是否正确`,
        );
        process.exit(0);
      });
    }
  },
};
