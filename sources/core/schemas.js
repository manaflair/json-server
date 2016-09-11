import Ajv from 'ajv';

let typeSchema = {

    type: `string`,

    minLength: 1

};

let idSchema = {

    type: `string`,

    minLength: 1

};

let locatorSchema = {

    type: `object`,

    required: [
        `type`,
        `id`
    ],

    properties: {
        type: typeSchema,
        id: idSchema
    }

};

let locatorsSchema = {

    type: `array`,

    items: locatorSchema

};

let linksSchema = {

    type: `object`,

    additionalProperties: {
        type: `string`
    }

};

let attributesSchema = {

    type: `object`

};

let relationshipSchema = {

    type: `object`,

    required: [
        `data`,
    ],

    properties: {
        data: { oneOf: [ locatorSchema, locatorsSchema ] },
        links: linksSchema
    }

};

let relationshipsSchema = {

    type: `object`,

    additionalProperties: relationshipSchema

};

let resourceCreateSchema = {

    type: `object`,

    required: [

        `data`

    ],

    properties: {

        data: {

            type: `object`,

            required: [

                `type`,

            ],

            properties: {

                type: typeSchema,
                id: idSchema,

                attributes: Object.assign({}, attributesSchema, { default: {} }),
                relationships: Object.assign({}, relationshipsSchema, { default: {} })

            }

        }

    }

};

let resourceUpdateSchema = {

    type: `object`,

    required: [

        `data`

    ],

    properties: {

        data: {

            type: `object`,

            required: [

                `type`,
                `id`

            ],

            properties: {

                type: typeSchema,
                id: idSchema,

                attributes: Object.assign({}, attributesSchema, { default: {} }),
                relationships: Object.assign({}, relationshipsSchema, { default: {} })

            }

        }

    }

};

let relationshipReplaceSchema = {

    type: `object`,

    properties: {

        data: {

            oneOf: [
                locatorSchema,
                locatorsSchema
            ]

        }

    }

};

let relationshipAddSchema = {

    type: `object`,

    properties: {

        data: {

            oneOf: [
                locatorSchema,
                locatorsSchema
            ]

        }

    }

};

let relationshipRemoveSchema = {

    type: `object`,

    properties: {

        data: {

            oneOf: [
                locatorSchema,
                locatorsSchema
            ]

        }

    }

};

let ajv = new Ajv({ removeAdditional: true, useDefaults: true, coerceTypes: true });

ajv.addSchema(resourceCreateSchema, `resourceCreate`);
ajv.addSchema(resourceUpdateSchema, `resourceUpdate`);

ajv.addSchema(relationshipReplaceSchema, `relationshipReplace`);
ajv.addSchema(relationshipAddSchema, `relationshipAdd`);
ajv.addSchema(relationshipRemoveSchema, `relationshipRemove`);

export function validateResourceCreate(data) {

    let isValid = ajv.validate(`resourceCreate`, data);

    if (!isValid) {
        return ajv.errorsText();
    } else {
        return null;
    }

}

export function validateResourceUpdate(data) {

    let isValid = ajv.validate(`resourceUpdate`, data);

    if (!isValid) {
        return ajv.errorsText();
    } else {
        return null;
    }

}

export function validateRelationshipReplace(data) {

    let isValid = ajv.validate(`relationshipReplace`, data);

    if (!isValid) {
        return ajv.errorsText();
    } else {
        return null;
    }

}

export function validateRelationshipAdd(data) {

    let isValid = ajv.validate(`relationshipAdd`, data);

    if (!isValid) {
        return ajv.errorsText();
    } else {
        return null;
    }

}

export function validateRelationshipRemove(data) {

    let isValid = ajv.validate(`relationshipRemove`, data);

    if (!isValid) {
        return ajv.errorsText();
    } else {
        return null;
    }

}
