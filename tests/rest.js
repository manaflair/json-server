import { expect }               from 'chai';

import { setupTestEnvironment } from './tools/env';
import { listen }               from './tools/server';

describe(`Rest`, () => {

    let server;

    before(async () => {

        server = await listen();

    });

    beforeEach(async () => {

        await setupTestEnvironment();

    });

    after(async () => {

        server.kill();

    });

    describe(`GET one`, () => {

        it(`should fetch existing resources by ids`, async () => {

            let data = await server.get(`/users/userA`);

            let userA = getResource(data, { type: `User`, id: `userA` });

            expect(userA.attributes.username).to.equal(`User A`);

            let data2 = await server.get(`/users/userB`);

            let userB = getResource(data2, { type: `User`, id: `userB` });

            expect(userB.attributes.username).to.equal(`User B`);

        });

        it(`should include related data if requested`, async () => {

            let data = await server.get(`/users/userA?include=Posts`);

            let userA = getResource(data, { type: `User`, id: `userA` });

            let posts = getRelationshipResources(userA.relationships.Posts);
            expect(posts).to.have.resource({ type: `Post`, id: `postA` });
            expect(posts).to.have.length(1);

        });

    });

    describe(`GET all`, () => {

    });

    describe(`POST`, () => {

        it(`should create new resources and specify their ids`, async () => {

            await server.post(`/users`, { type: `User`, id: `userNew`, attributes: { username: `New User` } });

            let data = await server.get(`/users/userNew`);

            let userNew = getResource(data, { type: `User`, id: `userNew` });

            expect(userNew.attributes.username).to.equal(`New User`);

        });

        it(`should correctly link resources together`, async () => {

            await server.post(`/comments`, { type: `Comment`, id: `commentNew`, relationships: { Post: { data: { type: `Post`, id: `postC` } } } });

            let data = await server.get(`/comments/commentNew?include=Post`);

            let commentNew = getResource(data, { type: `Comment`, id: `commentNew` });

            let posts = getRelationshipResources(commentNew.relationships.Post);
            expect(posts).to.have.resource({ type: `Post`, id: `postC` });
            expect(posts).to.have.length(1);

        });

    });

    describe(`PATCH`, () => {

        it(`should update existing resources`, async () => {

            await server.patch(`/users/userA`, { type: `User`, id: `userA`, attributes: { username: `Modified User` } });

            let data = await server.get(`/users/userA`);

            let userNew = getResource(data, { type: `User`, id: `userA` });

            expect(userNew.attributes.username).to.equal(`Modified User`);

        });

    });

    describe(`DELETE`, () => {

        it(`should delete existing resources`, async () => {

            await server.delete(`/users/userA`);

            let errors = await server.errors.get(`/users/userA`);

            expect(errors).to.deep.equal([ { status: `404`, code: `Not Found`, title: `Resource not found`, details: `Resource not found: <User#userA>` } ]);

        });

    });

});
