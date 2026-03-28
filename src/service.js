import fs from 'fs';

import { Command } from 'commander';
import { packageInfo } from './config/index.js';

import path from 'path';
import url, { pathToFileURL } from 'url';

const program = new Command();
const filename = url.fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// 设置默认命令
const setupDefaultCommands = () => {
  program.version(packageInfo.version, '-v, --version', '输出当前版本号');
  program.helpOption('-h, --help', '获取帮助');
  program.addHelpCommand(false);
};

async function loadCommand(id, commandsPath) {
  try {
    const fileURL = pathToFileURL(`${commandsPath}/${id}`).href;
    const commandModule = await import(fileURL);
    // 现在你可以使用 commandModule 中的内容了
    // 例如：如果导出的函数名为 default，你可以这样使用它
    const command = commandModule.default;
    return command;
    // 调用 command 函数或其他操作
  } catch (error) {
    console.error(`Failed to load command: ${id}`, error);
  }
}

// 注册命令
const registerCommands = async () => {
  const commandsPath = path.resolve(dirname, './commands');
  const directoryPath = path.join(dirname, 'commands');
  const idToPlugin = async (id) => {
    const command = await loadCommand(id, commandsPath);
    const commandName = id.split('.')[0];
    const alias = id.charAt(0);
    if (commandName === 'deploy') {
      program
        .command(commandName)
        .description(command.description)
        .alias(alias)
        .option('-m, --mode <mode>', 'setup deploy mode')
        .action((options) => {
          command.apply(options.mode);
        });
    } else {
      program
        .command(commandName)
        .description(command.description)
        .alias(alias)
        .action(() => {
          command.apply();
        });
    }
  };
  const files = fs.readdirSync(directoryPath);
  files.forEach(idToPlugin);
};

class Service {
  constructor() {
    registerCommands();
    setupDefaultCommands();
  }

  run(_id, _args = {}, rawArgv = []) {
    setTimeout(() => {
      program.parse(rawArgv, { from: 'user' });
    }, 1000);
  }
}

export default Service;
