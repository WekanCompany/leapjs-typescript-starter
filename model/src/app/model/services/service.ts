import { NotFoundError } from '@wekancompany/common';
import { <%= modelName %>, <%= modelName %>Model } from '../models/<%= modelNameLower %>';
import { messages } from 'resources/strings/app/<%= modelNameLower %>';

class <%= modelName %>Service {
  public static async create(<%= modelNameLower %>: <%= modelName %>): Promise<{}> {
    return new <%= modelName %>Model(<%= modelNameLower %>)
      .save()
      .then((result: any): {} => {
        if (!result) {
          throw new NotFoundError(messages.errors.create);
        } else {
          if (!<%= modelNameLower %>.status) {
          }
          return result;
        }
      })
      .catch(
        (error: any): Promise<any> => {
          return Promise.reject(error);
        },
      );
  }

  public static async updateOne(condition: {}, <%= modelNameLower %>: any): Promise<{}> {
    return <%= modelName %>Model.findOneAndUpdate(condition, <%= modelNameLower %>, {
      fields: {
        firstName: 1,
        lastName: 1,
        email: 1,
        profileImageUrl: 1,
        status: 1,
      },
      new: true,
    })
      .exec()
      .then((result: any): {} => {
        if (!result) {
          throw new NotFoundError(messages.errors.find);
        } else {
          return result;
        }
      })
      .catch((error: any): any => Promise.reject(error));
  }

  public static async getOne(query?: {}, fields?: string): Promise<{}> {
    const filter = query !== undefined ? query : {};
    return <%= modelName %>Model.findOne(filter)
      .select(
        fields !== undefined
          ? fields.replace(/,/g, ' ')
          : `firstName
						lastName
						email
						profileImageUrl
						status`,
      )
      .lean()
      .exec()
      .then((result: any): {} => {
        if (!result) {
          throw new NotFoundError(messages.errors.find);
        } else {
          return result;
        }
      })
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  // TODO change to aggregate query
  public static async getMany(
    query?: {},
    fields?: string,
    sort?: string,
    offset?: number,
    limit?: number,
  ): Promise<{}> {
    const filter = query !== undefined ? query : {};
    const res = sort !== undefined ? sort.split('|') : ['createdAt', 'desc'];

    let sortby: any = {};
    sortby[res[0]] = res[1];

    return <%= modelName %>Model.find(
      filter,
      fields !== undefined
        ? fields.replace(/,/g, ' ')
        : `firstName
					lastName
					email
					profileImageUrl
					status`,
      { skip: offset, limit, sort: sortby },
    )
      .lean()
      .exec()
      .then(
        async (result: any): Promise<{}> => {
          const count = await <%= modelName %>Model.countDocuments(filter).exec();
          return [result, count];
        },
      )
      .catch((error: any): Promise<any> => Promise.reject(error));
  }

  public static async deleteOne(id: string): Promise<{}> {
    return <%= modelName %>Model.deleteOne({ _id: id })
      .exec()
      .then((result: any): {} => {
        console.log(result);
        return result;
      })
      .catch((error: any): Promise<any> => Promise.reject(error));
  }
}

export default <%= modelName %>Service;
