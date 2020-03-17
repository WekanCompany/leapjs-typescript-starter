import { IsNotEmpty, IsDefined } from 'class-validator';

class Database {
  @IsDefined({ message: 'Please provide the database hostname ' })
  @IsNotEmpty({ message: 'Please provide a valid database hostname' })
  public host!: string;

  @IsDefined({ message: 'Please provide a database name' })
  @IsNotEmpty({ message: 'Please provide a database name' })
  public name!: string;
}

export default Database;
