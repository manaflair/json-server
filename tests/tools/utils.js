import { Assertion }                                   from 'chai';
import { isArray, isNull, isPlainObject, isUndefined } from 'lodash';
import { inspect }                                     from 'util';

global.getResource = function getResource(dataset, locator) {

    if (isPlainObject(dataset))
        if (dataset.type === locator.type && dataset.id === locator.id)
            return dataset;

    if (isArray(dataset))
        for (let resource of dataset)
            if (resource.type === locator.type && resource.id === locator.id)
                return resource;

    return null;

};

global.getRelationshipResources = function getRelationshipResources(relationship) {

    if (isUndefined(relationship))
        return undefined;

    let data = relationship.data;

    if (isPlainObject(data))
        return [ data ];

    if (isArray(data))
        return data;

    return [];

};

global.log = function logResource(data) {

    console.log(inspect(data, { depth: 10 }));

};

Assertion.addMethod(`resource`, function (locator) {

    let label = `<${locator.type}#${locator.id}>`;

    this.assert(!isNull(getResource(this._obj, locator)), `expected dataset to include ${label}`, `expected dataset to not include ${label}`);

});
