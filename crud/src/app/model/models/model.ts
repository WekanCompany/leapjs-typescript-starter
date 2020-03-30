// import { IsDefined } from 'class-validator';
import { mongoErrorHandler } from '@leapjs/common';
import { prop, post, getModelForClass } from '@typegoose/typegoose';
// import { messages } from 'resources/strings/app/<%= modelNameLower %>';

@post('save', mongoErrorHandler('<%= modelName %>'))
@post('findOneAndUpdate', mongoErrorHandler('<%= modelName %>'))
class <%= modelName %> {
  @prop()
  public status?: string;
}

const <%= modelName %>Model = getModelForClass(<%= modelName %>, {
  schemaOptions: {
    id: false,
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
});

export { <%= modelName %>, <%= modelName %>Model };
