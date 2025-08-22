import { Model, Document, PopulateOptions, FilterQuery } from "mongoose";


export const findOne = async <T extends Document>(params: {
  model: Model<T>;
  filter?: FilterQuery<T>;
  select?: string;
  populate?: PopulateOptions[] | string[];
}): Promise<T | null> => {
  const { model, filter = {}, select = "", populate = [] } = params;
  return await model.findOne(filter).select(select).populate(populate);
};

export const findById = async <T extends Document>(params: {
  model: Model<T>;
  id: string;
  select?: string;
  populate?: PopulateOptions[] | string[];
}): Promise<T | null> => {
  const { model, id, select = "", populate = [] } = params;
  return await model.findById(id).select(select).populate(populate);
};

export const create = async <T extends Document>(params: {
  model: Model<T>;
  data?: any[];
  options?: any;
}): Promise<T | T[]> => {
  const { model, data = [{}], options = { validateBeforeSave: true } } = params;
  return await model.create(data, options);
};