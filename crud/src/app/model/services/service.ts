import { injectable } from '@leapjs/common';
import { CrudService } from '@leapjs/crud';
import { <%= modelName %>, <%= modelName %>Model } from '../models/<%= modelNameLower %>';

@injectable()
class <%= modelName %>Service extends CrudService<<%= modelName %>> {
  public constructor() {
    super(<%= modelName %>Model, 'status', {
      status: 1,
    });
  }
}

export default <%= modelName %>Service;
