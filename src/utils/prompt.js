import inquirer from 'inquirer';

export const confirmMsg = (message) => inquirer.prompt([
  {
    type: 'confirm',
    name: 'confirm',
    message,
  },
]);
