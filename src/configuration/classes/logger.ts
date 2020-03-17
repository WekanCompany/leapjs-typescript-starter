// import bunyan from 'bunyan';
import { ILogger } from '@leapjs/common';

class Log {
  public consoleLevel!: number;
  public consoleTo!: NodeJS.WriteStream;
  public fileLevel!: number;
  public fileTo!: string;
  public instance!: ILogger;
}

export default Log;
