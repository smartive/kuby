import inquirer = require('inquirer');

inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

String.prototype.isBase64 = function (this: string): boolean {
  return Buffer.from(this, 'base64').toString('base64') === this;
};

String.prototype.base64Encode = function (this: string): string {
  return Buffer.from(this).toString('base64');
};

String.prototype.base64Decode = function (this: string): string {
  return Buffer.from(this, 'base64').toString('utf8');
};
