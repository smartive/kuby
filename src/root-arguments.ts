import { LogLevel } from './utils/logger';

export interface RootArguments {
  ci: boolean;
  logLevel: LogLevel;
  context?: string;
  namespace?: string;
}
