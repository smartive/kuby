import { prompt } from 'inquirer';

export async function simpleConfirm(message: string, defaultValue: boolean): Promise<boolean> {
  const answer = await prompt([
    {
      message,
      type: 'confirm',
      name: 'confirm',
      default: defaultValue,
    },
  ]) as { confirm: boolean };

  return answer.confirm;
}
