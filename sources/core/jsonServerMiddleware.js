import express                         from 'express';
import { castArray }                   from 'lodash';

import { catchApiErrors }              from './catchApiErrors';
import { BadRequest }                  from './errors';
import { parseQueryString }            from './parseQueryString';
import { validateResourceCreate }      from './schemas';
import { validateResourceUpdate }      from './schemas';
import { validateRelationshipReplace } from './schemas';
import { validateRelationshipAdd }     from './schemas';
import { validateRelationshipRemove }  from './schemas';

function fetchRelationships(req, relationships) {

    return req.backend.publicRelationships.reduce((promise, relationshipName) => {

        return promise.then(relationships => {

            if (!Object.prototype.hasOwnProperty.call(req.body.data.relationships, relationshipName))
                return relationships;

            return req.jsonServer.fetchResources(req, castArray(req.body.data.relationships[relationshipName].data)).then(related => {
                return Object.assign(relationships, { [relationshipName]: related });
            });

        });

    }, Promise.resolve({}));

}

function handleIndex(req, res) {

    let options = parseQueryString(req.query);

    return Promise.resolve().then(() => {
        return req.backend.index(req, options);
    }).then(resources => {
        return req.jsonServer.normalizeResource(req, resources, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

function handleGet(req, res) {

    let options = parseQueryString(req.query);

    return Promise.resolve().then(() => {
        return req.backend.getOne(req, req.params.identifier, options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

function handleCreate(req, res) {

    let options = parseQueryString(req.query);
    let errors = validateResourceCreate(req.body);

    if (errors)
        throw new BadRequest({ title: `Invalid input data`, details: errors });

    if (req.body.data.type !== req.backend.resourceType)
        throw new Error(`Mismatching resource type`);

    return Promise.resolve().then(() => {
        return fetchRelationships(req, req.body.data.relationships);
    }).then(related => {
        return req.backend.create(req, req.body.data, related);
    }).then(resource => {
        return req.backend.getOne(req, req.backend.id(req, resource), options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(201).json(data);
    });

}

function handleUpdate(req, res) {

    let options = parseQueryString(req.query);
    let errors = validateResourceUpdate(req.body);

    if (errors)
        throw new BadRequest({ title: `Invalid input data`, details: errors });

    if (req.body.data.type !== req.backend.resourceType)
        throw new Error(`Mismatching resource type`);

    if (req.body.data.id !== req.params.identifier)
        throw new Error(`Mismatching resource id`);

    return Promise.resolve().then(() => {
        return req.backend.getOne(req, req.params.identifier);
    }).then(resource => {
        return req.backend.update(req, resource, req.body.data);
    }).then(resource => {
        return req.backend.getOne(req, req.backend.id(req, resource), options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

function handleDelete(req, res) {

    return Promise.resolve().then(() => {
        return req.backend.getOne(req, req.params.identifier);
    }).then(resource => {
        return req.backend.delete(req, resource);
    }).then(() => {
        return res.status(204).json({});
    });

}

function handleRelationshipReplace(req, res) {

    let options = parseQueryString(req.query);
    let errors = validateRelationshipReplace(req.body);

    if (errors)
        throw new BadRequest({ title: `Invalid input data`, details: errors });

    if (!options.include.has(req.params.relationshipName))
        options.include.set(req.params.relationshipName, new Map());

    return Promise.all([
        req.backend.getOne(req, req.params.identifier),
        req.jsonServer.fetchResources(req, castArray(req.body.data))
    ]).then(([ resource, related ]) => {
        return req.backend.relationshipReplace(req, resource, req.params.relationshipName, related);
    }).then(() => {
        return req.backend.getOne(req, req.params.identifier, options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

function handleRelationshipAdd(req, res) {

    let options = parseQueryString(req.query);
    let errors = validateRelationshipAdd(req.body);

    if (errors)
        throw new BadRequest({ title: `Invalid input data`, details: errors });

    if (!options.include.has(req.params.relationshipName))
        options.include.set(req.params.relationshipName, new Map());

    return Promise.all([
        req.backend.getOne(req, req.params.identifier),
        req.jsonServer.fetchResources(req, castArray(req.body.data))
    ]).then(([ resource, related ]) => {
        return req.backend.relationshipAdd(req, resource, req.params.relationshipName, related);
    }).then(() => {
        return req.backend.getOne(req, req.params.identifier, options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

function handleRelationshipRemove(req, res) {

    let options = parseQueryString(req.query);
    let errors = validateRelationshipRemove(req.body);

    if (errors)
        throw new BadRequest({ title: `Invalid input data`, details: errors });

    if (!options.include.has(req.params.relationshipName))
        options.include.set(req.params.relationshipName, new Map());

    return Promise.all([
        req.backend.getOne(req, req.params.identifier),
        req.jsonServer.fetchResources(req, castArray(req.body.data))
    ]).then(([ resource, related ]) => {
        return req.backend.relationshipRemove(req, resource, req.params.relationshipName, related);
    }).then(() => {
        return req.backend.getOne(req, req.params.identifier, options);
    }).then(resource => {
        return req.jsonServer.normalizeResource(req, resource, req.backend.resourceType);
    }).then(data => {
        return res.status(200).json(data);
    });

}

export function jsonServerMiddleware({ jsonServer, backend }) {

    let server = express().use((req, res, next) => {
        Object.assign(req, { jsonServer, backend });
        return next();
    });

    server.custom = express();
    server.use(server.custom);

    if (backend.index)
        server.get(`/`, catchApiErrors(handleIndex));

    if (backend.create)
        server.post(`/`, catchApiErrors(handleCreate));

    if (backend.getOne)
        server.get(`/:identifier`, catchApiErrors(handleGet));

    if (backend.update)
        server.patch(`/:identifier`, catchApiErrors(handleUpdate));

    if (backend.delete)
        server.delete(`/:identifier`, catchApiErrors(handleDelete));

    if (backend.relationshipReplace)
        server.patch(`/:identifier/relationships/:relationshipName`, catchApiErrors(handleRelationshipReplace));

    if (backend.relationshipAdd)
        server.post(`/:identifier/relationships/:relationshipName`, catchApiErrors(handleRelationshipAdd));

    if (backend.relationshipRemove)
        server.delete(`/:identifier/relationships/:relationshipName`, catchApiErrors(handleRelationshipRemove));

    return server;

}
