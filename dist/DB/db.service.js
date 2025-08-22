"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = exports.findById = exports.findOne = void 0;
const findOne = async (params) => {
    const { model, filter = {}, select = "", populate = [] } = params;
    return await model.findOne(filter).select(select).populate(populate);
};
exports.findOne = findOne;
const findById = async (params) => {
    const { model, id, select = "", populate = [] } = params;
    return await model.findById(id).select(select).populate(populate);
};
exports.findById = findById;
const create = async (params) => {
    const { model, data = [{}], options = { validateBeforeSave: true } } = params;
    return await model.create(data, options);
};
exports.create = create;
