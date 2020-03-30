import { Controller } from '@leapjs/router';
import { <%= modelName %> } from 'app/<%= modelNameLower %>/models/<%= modelNameLower %>';
import <%= modelName %>Service from 'app/<%= modelNameLower %>/services/<%= modelNameLower %>';

@Controller('/<%= modelNameLowerPlural %>')
class <%= modelName %>Controller {

}

export default <%= modelName %>Controller;
