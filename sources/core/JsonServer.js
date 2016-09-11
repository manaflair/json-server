import { autobind }                                                   from 'core-decorators';
import express                                                        from 'express';
import { camelCase, flatten, isFunction, isNil, isNull, isUndefined } from 'lodash';
import pluralize                                                      from 'pluralize';
import { resolve }                                                    from 'url';

import { jsonServerMiddleware }                                       from './jsonServerMiddleware';

export class JsonServer {

    constructor({ baseUrl = `/` } = {}) {

        this.baseUrl = baseUrl;

        this.backends = new Map();
        this.middleware = express();

    }

    add(backend) {

        let middleware = jsonServerMiddleware({ jsonServer: this, backend });

        let resourceType = backend.resourceType;
        let resourcePath = pluralize(camelCase(resourceType));

        this.backends.set(resourceType, backend);
        this.middleware.use(`/${resourcePath}`, middleware);

        return middleware;

    }

    @autobind getBackend(resourceType) {

        let backend = this.backends.get(resourceType);

        return !isNil(backend) ? backend : null;

    }

    @autobind fetchResources(req, locators) {

        let resourceIds = new Map();
        let resources = [];

        for (let { type, id } of locators) {

            if (!resourceIds.has(type))
                resourceIds.set(type, []);

            let ids = resourceIds.get(type);
            ids.push(id);

        }

        return Promise.all(Array.from(resourceIds.entries()).map(([ resourceType, ids ]) => {

            let backend = this.backends.get(resourceType);

            if (isNil(backend))
                return Promise.reject(new Error(`Invalid resource name, got "${resourceType}"`));

            return backend.getMany(req, ids);

        })).then(resourceArrays => {

            return flatten(resourceArrays);

        });

    }

    @autobind normalizeResource(req, resources, resourceType) {

        if (resources == null)
            resources = [];

        let data = [];
        let included = [];

        let resourceRefmap = new Map();

        let pushInto = (target, resources, resourceType) => {

            if (isNil(resources))
                return Promise.resolve({ data: null });

            if (isFunction(resources[Symbol.iterator])) {
                return pushResourcesInto(target, resources, resourceType).then(data => ({ data }));
            } else {
                return pushResourceInto(target, resources, resourceType).then(data => ({ data }));;
            }

        };

        let pushResourcesInto = (target, resources, resourceType) => {

            return Array.from(resources).reduce((promise, resource) => {

                return promise.then(result => pushResourceInto(target, resource, resourceType).then(locator => {
                    return result.concat([ locator ]);
                }));

            }, Promise.resolve([]));

        };

        let pushResourceInto = (target, resource, resourceType) => {

            let backend = this.backends.get(resourceType);

            if (isNil(backend))
                return Promise.reject(new Error(`Invalid resource name, got "${resourceType}"`));

            let resourcePath = pluralize(camelCase(resourceType));

            let type = resourceType;
            let id = backend.id(req, resource);
            let self = resolve(this.baseUrl, `${resourcePath}/${id}`);

            let resolveObject = input => Reflect.ownKeys(input).reduce((promise, key) => promise.then(output => {
                return Promise.resolve(input[key]).then(value => Object.assign(output, { [key]: value }));
            }), Promise.resolve({}));

            let processAttributes = data => Promise.resolve().then(() => {
                return backend.attributes(req, resource);
            }).then(attributes => {
                return resolveObject(attributes);
            }).then(attributes => {
                return Object.assign(data, { attributes });
            });

            let processRelationships = data => Promise.resolve().then(() => {
                return backend.relationships(req, resource, (resources, resourceType) => pushInto(included, resources, resourceType), (relationshipName) => resolve(`${self}/`, relationshipName));
            }).then(relationships => {
                return resolveObject(relationships);
            }).then(relationships => {
                return Object.assign(data, { relationships });
            });

            let processResource = () => Promise.resolve({ type, id, links: { self } }).then(data => {
                resourceRefmap.set(self, data);
                return target.push(data), data;
            }).then(data => {
                return processAttributes(data);
            }).then(data => {
                return processRelationships(data);
            });

            let resourceProcessing = !resourceRefmap.has(self)
                ? processResource()
                : Promise.resolve();

            return resourceProcessing.then(() => {
                return { type, id };
            });

        };

        return pushInto(data, resources, resourceType).then(() => {
            return { data, included };
        });

    }

}
