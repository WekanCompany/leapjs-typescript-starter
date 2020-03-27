// import { IsDefined } from 'class-validator';
import { prop, post, Typegoose, index } from 'typegoose';
// import { messages } from 'resources/strings/app/<%= modelNameLower %>';
import ErrorHandler from 'middleware/error-handler';

@post('save', ErrorHandler.mongo('<%= modelName %>'))
@post('findOneAndUpdate', ErrorHandler.mongo('<%= modelName %>'))
class <%= modelName %> extends Typegoose {
  @prop()
  public status?: string;
}

const <%= modelName %>Model = new <%= modelName %>().getModelForClass(<%= modelName %>, {
  schemaOptions: {
    id: false,
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
});

export { <%= modelName %>, <%= modelName %>Model };
