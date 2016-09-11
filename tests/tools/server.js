import bodyParser               from 'body-parser';
import express                  from 'express';
import { isArray, isNil }       from 'lodash';
import fetch                    from 'node-fetch';

import { makeSequelizeBackend } from '../../sources/sequelize';
import { JsonServer }           from '../../sources/core';

import { User, Post, Comment }  from './db';

function makeApiRequester(baseUrl, method, shouldError = false) {

    return async (path, data = null) => {

        let body = !isNil(data) ? JSON.stringify({ data }) : null;
        let res = await fetch(`${baseUrl}${path}`, { method, body, headers: { [`Content-Type`]: `application/json` } });

        let text = await res.text();
        let json = null;

        try {

            if (res.status === 204) {
                json = null;
            } else {
                json = JSON.parse(text);
            }

        } catch (err) {

            let summary = text.trim();

            if (summary.length > 40)
                summary = `${summary.substr(0, 90).trim()}...`;

            throw new Error(`Invalid JSON: ${JSON.stringify(summary)}`);

        }

        if (shouldError) {

            if (!isNil(json.errors) && !isArray(json.errors))
                throw new Error(`Invalid errors`);

            if (!isArray(json.errors) || json.errors.length === 0)
                throw new Error(`The server hasn't returned any error`);

            return json.errors;

        } else {

            if (isNil(json))
                return json;

            if (!isNil(json.errors) && (!isArray(json.errors) || json.errors.length > 0))
                throw new Error(`The server errored: ${JSON.stringify(json.errors)}`);

            return json.data;

        }

    };

}

export function listen(port = 9090) {

    let server = express(), http;
    let baseUrl = `http://localhost:${port}`;

    let jsonServer = new JsonServer({ baseUrl });

    server.use(bodyParser.json());
    server.use(jsonServer.middleware);

    jsonServer.add(makeSequelizeBackend(User));
    jsonServer.add(makeSequelizeBackend(Post));
    jsonServer.add(makeSequelizeBackend(Comment));

    let api = { errors: {} };

    api.get = makeApiRequester(baseUrl, `GET`, false);
    api.post = makeApiRequester(baseUrl, `POST`, false);
    api.patch = makeApiRequester(baseUrl, `PATCH`, false);
    api.delete = makeApiRequester(baseUrl, `DELETE`, false);

    api.errors.get = makeApiRequester(baseUrl, `GET`, true);
    api.errors.post = makeApiRequester(baseUrl, `POST`, true);
    api.errors.patch = makeApiRequester(baseUrl, `PATCH`, true);
    api.errors.delete = makeApiRequester(baseUrl, `DELETE`, true);

    api.kill = () => http.close();

    return new Promise((resolve, reject) => {
        http = server.listen(port, err => {
            if (err) reject(err);
            else resolve(api);
        });
    });

}
