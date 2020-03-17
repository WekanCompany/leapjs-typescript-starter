import { IsNotEmpty, IsDefined } from 'class-validator';

class Queue {
  @IsDefined({ message: 'Please provide a connection url for the queue' })
  @IsNotEmpty({ message: 'Please provide a connection url for the queue' })
  public url!: string;
}

export default Queue;
