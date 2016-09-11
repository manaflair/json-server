import { camelCase, first, isFunction, isNil, omit, pick, pull } from 'lodash';
import pluralize                                                 from 'pluralize';

import { NotFound }                                              from '../core';

export function makeLokiBackend(Collection, { primaryKey = `$loki` } = {}) {

    return class LokiBackend {

        static get resourceType() {

            return Collection.name;

        }

        static publicAttributes(req, resource) {

            return pull(Reflect.ownKeys(resource), `$loki`, `meta`);

        }

        // -------------------------------------------------------------

        static id(req, resource) {

            return resource[primaryKey];

        }

        static attributes(req, resource) {

            let publicAttributes = this.publicAttributes;

            if (isFunction(publicAttributes))
                publicAttributes = Reflect.apply(publicAttributes, this, [ req, resource ]);

            return pick(resource, publicAttributes);

        }

        static relationships(req, resource, addResource) {

            return {};

        }

        // -------------------------------------------------------------

        static index(req, {} = {}) {

            return Collection.find({});

        }

        static getOne(req, key, {} = {}) {

            let resource = Collection.by(primaryKey, key);

            if (isNil(resource))
                throw new NotFound();

            return resource;

        }

        static getMany(req, keys, {} = {}) {

            let resources = keys.map(key => Collection.by(key));

            if (resources.some(resource => isNil(resource)))
                throw new NotFound();

            return resources;

        }

    };

}
