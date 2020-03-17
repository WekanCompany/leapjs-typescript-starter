import {
  IsDefined,
  IsNotEmpty,
  IsString,
  ValidateNested,
  IsEnum,
  IsArray,
} from 'class-validator';
import { prop, post, getModelForClass, index } from '@typegoose/typegoose';
import { mongoErrorHandler } from '@leapjs/common';
import {
  EMPTY_NAME,
  INVALID_NAME,
  EMPTY_PERMISSIONS,
  INVALID_STATUS,
  INVALID_PERMISSIONS,
} from 'resources/strings/app/role';
import { Type } from 'class-transformer';
import { RoleStatus } from 'common/constants';
import Permission from './permission';

@index({ name: 1 }, { unique: true })
@post('save', mongoErrorHandler('Role'))
@post('findOneAndUpdate', mongoErrorHandler('Role'))
class Role {
  @prop({ required: true, unique: true })
  @IsDefined({ groups: ['create'], message: EMPTY_NAME })
  @IsNotEmpty({ groups: ['create', 'update'], message: INVALID_NAME })
  @IsString({ groups: ['create', 'update'], message: INVALID_NAME })
  public name!: string;

  @prop({ required: true })
  @IsDefined({ groups: ['create'], message: EMPTY_PERMISSIONS })
  @IsArray({ groups: ['create'], message: INVALID_PERMISSIONS })
  @ValidateNested({ groups: ['create', 'update'], each: true })
  @Type(() => Permission)
  public permissions!: Permission[];

  @prop({ default: RoleStatus.ACTIVE })
  @IsEnum(RoleStatus, { groups: ['create', 'update'], message: INVALID_STATUS })
  public status?: number;
}

const RoleModel = getModelForClass(Role, {
  schemaOptions: {
    id: false,
    versionKey: false,
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  },
});

export { Role, RoleModel, Permission };
