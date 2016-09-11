import { camelCase, capitalize, first, isArray, isNil, pick, sortBy } from 'lodash';
import pluralize                                                      from 'pluralize';

import { NotFound }                                                   from '../core';

export function makeSequelizeBackend(Model, {} = {}) {

    function getSequelizeInclude(req, include, { Backend, Model }) {

        let sequelizeInclude = [];
        let publicRelationships = Backend.publicRelationships;

        for (let [ relationshipName, nextInclude ] of include.entries()) {

            if (!publicRelationships.includes(relationshipName))
                continue;

            if (!Object.prototype.hasOwnProperty.call(Model.associations, relationshipName))
                continue;

            let sequelizeAssociation = Model.associations[relationshipName];

            let RelationModel = sequelizeAssociation.target;
            let relationResourceType = RelationModel.name;

            let RelationBackend = req.jsonServer.getBackend(relationResourceType);

            if (isNil(RelationBackend))
                throw new Error(`No backend found for resource type "${relationResourceType}"`);

            sequelizeInclude.push({
                model: RelationModel,
                include: getSequelizeInclude(req, nextInclude, {
                    Backend: RelationBackend,
                    Model: RelationModel
                })
            });

        }

        return sequelizeInclude;

    }

    function getSequelizeOptions(req, { include }, { Backend, Model }) {

        return { include: getSequelizeInclude(req, include, { Backend, Model }) };

    }

    return class SequelizeBackend {

        static get resourceType() {

            return Model.name;

        }

        static publicAttributes = Reflect.ownKeys(Model.attributes).filter(attributeName => {

            let definition = Model.attributes[attributeName];

            let isPrimaryKey = definition.primaryKey;
            let isReference = !isNil(definition.references);

            return !isPrimaryKey && !isReference;

        });

        static publicRelationships = Reflect.ownKeys(Model.associations).filter(relationshipName => {

            let sequelizeAssociation = Model.associations[relationshipName];

            let isBelongsToMany = sequelizeAssociation.associationType === `BelongsToMany`;

            return !isBelongsToMany;

        });

        // -------------------------------------------------------------

        static id(req, resource) {

            return String(resource[Model.primaryKeyAttribute]);

        }

        static attributes(req, resource) {

            return this.publicAttributes.reduce((attributes, attributeName) => {

                return Object.assign(attributes, {
                    [attributeName]: resource[attributeName]
                });

            }, {});

        }

        static relationships(req, resource, addResource, getRelationshipLink) {

            return this.publicRelationships.reduce((relationships, relationshipName) => {

                if (!Object.prototype.hasOwnProperty.call(Model.associations, relationshipName))
                    return relationships;

                if (!Object.prototype.hasOwnProperty.call(resource, relationshipName))
                    return relationships;

                let relationshipData = resource[relationshipName];

                if (isArray(relationshipData))
                    relationshipData = sortBy(relationshipData, Model.primaryKeyAttribute);

                return Object.assign(relationships, {
                    [relationshipName]: addResource(relationshipData, Model.associations[relationshipName].target.name).then(relationship => {
                        return Object.assign(relationship, { links: { self: getRelationshipLink(relationshipName) } });
                    })
                });

            }, {});

        }

        // -------------------------------------------------------------

        static index(req, { include = new Map() } = {}) {

            let sequelizeOptions = getSequelizeOptions(req, { include }, { Backend: this, Model });

            return Model.findAll(sequelizeOptions);

        }

        static getOne(req, key, { include = new Map() } = {}) {

            let sequelizeOptions = getSequelizeOptions(req, { include }, { Backend: this, Model });

            return Model.findById(key, sequelizeOptions).then(resource => {

                if (isNil(resource))
                    throw new NotFound({ title: `Resource not found`, details: `Resource not found: <${this.resourceType}#${key}>` });

                return resource;

            });

        }

        static getMany(req, keys, { include = new Map() } = {}) {

            if (keys.length === 0)
                return Promise.resolve([]);

            let promise = keys.length === 1
                ? Model.findById(first(keys)).then(resource => [ resource ])
                : Model.findAll({ where: { [Model.primaryKeyAttribute]: { $in: keys } } });

            return promise.then(resources => {

                let missing = keys.filter(key => !resources.find(resource => this.id(req, resource) === key));

                if (missing.length > 0)
                    throw new NotFound({ title: `Resources not found`, details: `Resources not found: ${missing.map(key => `<${this.resourceType}#${key}>`).join(`, `)}` });

                return resources;

            });

        }

        static create(req, input, relationships) {

            let attributes = pick(input.attributes, this.publicAttributes);

            if (input.id)
                attributes[Model.primaryKeyAttribute] = input.id;

            return Model.create(attributes).then(resource => {

                return this.publicRelationships.reduce((promise, relationshipName) => {

                    if (!Object.prototype.hasOwnProperty.call(Model.associations, relationshipName))
                        return promise;

                    if (!Object.prototype.hasOwnProperty.call(input.relationships, relationshipName))
                        return promise;

                    let related = relationships[relationshipName];

                    let sequelizeAssociation = Model.associations[relationshipName];
                    let associationType = sequelizeAssociation.associationType;

                    if ((associationType === `BelongsTo` || associationType === `HasOne`) && related.length > 1)
                        throw new Error(`Invalid amount of resources passed into the specified relationship (${relationshipName}), expected at most 1, got ${related.length}`);

                    if (related.some(resource => resource.Model !== sequelizeAssociation.target))
                        throw new Error(`Invalid resource types for the specified relationship (${relationshipName})`);

                    return promise.then(() => {

                        switch (sequelizeAssociation.associationType) {

                            case `BelongsTo`: case `HasOne`: {
                                return resource[sequelizeAssociation.accessors.set](related.length > 0 ? first(related) : null);
                            } break;

                            case `BelongsToMany`: case `HasMany`: {
                                return resource[sequelizeAssociation.accessors.set](related);
                            } break;

                            default: {
                                throw new Error(`Insupported relationship type, got "${sequelizeAssociation.associationType}"`);
                            }

                        }

                    });

                }, Promise.resolve()).then(() => {

                    return resource;

                });

            });

        }

        static update(req, resource, input) {

            let data = pick(input.attributes, this.publicAttributes);

            return resource.set(data).save();

        }

        static delete(req, resource) {

            return resource.destroy();

        }

        // -------------------------------------------------------------

        static relationshipReplace(req, resource, relationshipName, related) {

            if (!this.publicRelationships.includes(relationshipName))
                throw new Error(`Unknown relationship`);

            let sequelizeAssociation = Model.associations[relationshipName];
            let associationType = sequelizeAssociation.associationType;

            if ((associationType === `BelongsTo` || associationType === `HasOne`) && related.length > 1)
                throw new Error(`Invalid amount of resources passed into the specified relationship (${relationshipName}), expected at most 1, got ${related.length}`);

            if (related.some(resource => resource.Model !== sequelizeAssociation.target))
                throw new Error(`Invalid resource types for the specified relationship (${relationshipName})`);

            switch (sequelizeAssociation.associationType) {

                case `BelongsTo`: case `HasOne`: {
                    return resource[sequelizeAssociation.accessors.set](related.length > 0 ? first(related) : null).then(() => resource);
                } break;

                case `BelongsToMany`: case `HasMany`: {
                    return resource[sequelizeAssociation.accessors.set](related).then(() => resource);
                } break;

                default: {
                    throw new Error(`Insupported relationship type, got "${sequelizeAssociation.associationType}"`);
                }

            }

        }

        static relationshipAdd(req, resource, relationshipName, related) {

            if (!this.publicRelationships.includes(relationshipName))
                throw new Error(`Unknown relationship`);

            let sequelizeAssociation = Model.associations[relationshipName];
            let associationType = sequelizeAssociation.associationType;

            if (related.some(resource => resource.Model !== sequelizeAssociation.target))
                throw new Error(`Invalid resource types for the specified relationship (${relationshipName})`);

            switch (sequelizeAssociation.associationType) {

                case `BelongsToMany`: case `HasMany`: {
                    return resource[sequelizeAssociation.accessors.addMultiple](related).then(() => resource);
                } break;

                default: {
                    throw new Error(`Insupported relationship type, got "${sequelizeAssociation.associationType}"`);
                }

            }

        }

        static relationshipRemove(req, resource, relationshipName, related) {

            if (!this.publicRelationships.includes(relationshipName))
                throw new Error(`Unknown relationship`);

            let sequelizeAssociation = Model.associations[relationshipName];
            let associationType = sequelizeAssociation.associationType;

            if (related.some(resource => resource.Model !== sequelizeAssociation.target))
                throw new Error(`Invalid resource types for the specified relationship (${relationshipName})`);

            switch (sequelizeAssociation.associationType) {

                case `BelongsToMany`: case `HasMany`: {
                    return resource[sequelizeAssociation.accessors.removeMultiple](related).then(() => resource);
                } break;

                default: {
                    throw new Error(`Insupported relationship type, got "${sequelizeAssociation.associationType}"`);
                }

            }

        }

    };

}
