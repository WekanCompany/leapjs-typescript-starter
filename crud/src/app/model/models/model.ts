// import { IsDefined } from 'class-validator';
import { mongoErrorHandler } from '@leapjs/common';
import { prop, post, Typegoose } from '@typegoose/typegoose';
// import { messages } from 'resources/strings/app/<%= modelNameLower %>';

@post('save', mongoErrorHandler('<%= modelName %>'))
@post('findOneAndUpdate', mongoErrorHandler('<%= modelName %>'))
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
