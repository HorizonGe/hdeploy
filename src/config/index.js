import fs from 'fs';
import path from 'path';
import { getDeployConfigFileName, packageJson, packageInfo } from '../utils/index.js';

function handleSetConfig(env) {
  const envNameMap = {
    dev: '开发环境',
    test: '测试环境',
    prod: '生产环境'
  };
  
  const buildScriptMap = {
    dev: 'npm run build:dev',
    test: 'npm run build:test',
    prod: 'npm run build:prod'
  };
  
  return [
    {
      type: 'input',
      name: `${env}Name`,
      message: '环境名称',
      default: envNameMap[env],
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}Script`,
      message: '打包命令',
      default: buildScriptMap[env],
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}Host`,
      message: '服务器地址',
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'number',
      name: `${env}Port`,
      message: '服务器端口号',
      default: 22,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}Username`,
      message: '用户名',
      default: 'root',
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'password',
      name: `${env}Password`,
      message: '密码',
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}DistPath`,
      message: '本地打包目录',
      default: 'dist',
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}WebDir`,
      message: '部署路径',
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'confirm',
      name: `${env}IsBak`,
      message: '是否备份',
      default: false,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'select',
      name: `${env}MaxBakNum`,
      message: '最大备份版本数量',
      choices: [
        {
          name: '5',
          value: 5,
          description: '5',
        },
        {
          name: '10',
          value: 10,
          description: '10',
        },
        {
          name: '15',
          value: 15,
          description: '15',
        },
        {
          name: '20',
          value: 20,
          description: '20',
        },
      ],
      when: (answers) => answers.deployEnvList.includes(env) && answers[`${env}IsBak`] === true,
    },
    {
      type: 'confirm',
      name: `${env}isDeleteRemoteFile`,
      message: '是否删除远程文件',
      default: true,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'confirm',
      name: `${env}showConfirmMsg`,
      message: '是否显示确认信息提示',
      default: true,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'confirm',
      name: `${env}IsRemoveLocalFile`,
      message: '是否删除本地打包文件',
      default: true,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'confirm',
      name: `${env}IsOpenDingMsg`,
      message: '是否开启钉钉通知',
      default: false,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}DingToken`,
      message: '钉钉通知token地址',
      when: (answers) => answers.deployEnvList.includes(env) && answers[`${env}IsOpenDingMsg`] === true,
    },
    {
      type: 'input',
      name: `${env}DingStartMsg`,
      message: '开始部署钉钉通知内容',
      when: (answers) => answers.deployEnvList.includes(env) && answers[`${env}IsOpenDingMsg`] === true,
    },
    {
      type: 'input',
      name: `${env}DingEndMsg`,
      message: '部署完成钉钉通知内容',
      when: (answers) => answers.deployEnvList.includes(env) && answers[`${env}IsOpenDingMsg`] === true,
    },
    {
      type: 'confirm',
      name: `${env}IsOpenPreview`,
      message: '部署完成后是否自动打开预览',
      default: false,
      when: (answers) => answers.deployEnvList.includes(env),
    },
    {
      type: 'input',
      name: `${env}PreviewUrl`,
      message: '预览地址',
      when: (answers) => answers.deployEnvList.includes(env) && answers[`${env}IsOpenPreview`] === true,
    },
  ];
}

const devConfig = handleSetConfig('dev');

const testConfig = handleSetConfig('test');

const prodConfig = handleSetConfig('prod');

const deployConfigPath = `${path.join(process.cwd())}/${getDeployConfigFileName()}`;

const inquirerConfig = [
  {
    type: 'input',
    name: 'projectName',
    message: '请输入项目名称',
    default: fs.existsSync(`${path.join(process.cwd())}/package.json`)
      ? packageJson.name
      : '',
  },
  {
    type: 'checkbox',
    name: 'deployEnvList',
    message: '请选择需要部署的环境',
    choices: [
      {
        name: 'dev',
        checked: true,
      },
      {
        name: 'test',
      },
      {
        name: 'prod',
      },
    ],
  },
  ...devConfig,
  ...testConfig,
  ...prodConfig,
];

export { packageInfo, deployConfigPath, inquirerConfig };
