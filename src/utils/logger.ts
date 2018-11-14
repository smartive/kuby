import chalk from 'chalk';

export enum LogLevel {
  debug,
  info,
  warn,
  error,
  output,
}

export class Logger {
  public static level: LogLevel = LogLevel.info;

  constructor(private prefix: string = '') {}

  public log(level: LogLevel, message: string): void {
    if (level < Logger.level) {
      return;
    }
    this.getLogFunction(level)(`${this.getLevelPrefix(level)}${message}`);
  }

  public debug(message: string): void {
    this.log(LogLevel.debug, message);
  }

  public info(message: string): void {
    this.log(LogLevel.info, message);
  }

  public output(message: string): void {
    this.log(LogLevel.output, message);
  }

  public success(message: string): void {
    this.log(LogLevel.info, chalk.green(message));
  }

  public warn(message: string): void {
    this.log(LogLevel.warn, chalk.yellow(message));
  }

  public error(message: string): void {
    this.log(LogLevel.error, chalk.red(message));
  }

  private getLevelPrefix(level: LogLevel): string {
    if (!this.prefix) {
      return '';
    }
    switch (level) {
      case LogLevel.debug:
        return chalk.grey(`[${this.prefix}]: `);
      case LogLevel.warn:
        return chalk.yellow(`[${this.prefix}]: `);
      case LogLevel.error:
        return chalk.red(`[${this.prefix}]: `);
      default:
        return chalk.blue(`[${this.prefix}]: `);
    }
  }

  private getLogFunction(level: LogLevel): (message: string) => void {
    switch (level) {
      case LogLevel.debug:
        return console.debug;
      case LogLevel.warn:
        return console.warn;
      case LogLevel.error:
        return console.error;
      default:
        return console.info;
    }
  }
}
