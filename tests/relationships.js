import { expect }               from 'chai';

import { setupTestEnvironment } from './tools/env';
import { listen }               from './tools/server';

describe(`Relationships`, () => {

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

    describe(`To-One`, () => {

        describe(`PATCH`, () => {

            it(`should allow to clear related resources`, async () => {

                let data = await server.patch(`/posts/postA/relationships/User`, []);

                let postA = getResource(data, { type: `Post`, id: `postA` });

                let users = getRelationshipResources(postA.relationships.User);
                expect(users).to.have.length(0);

            });

            it(`should allow to replace related resources`, async () => {

                let data = await server.patch(`/posts/postA/relationships/User`, { type: `User`, id: `userB` });

                let postA = getResource(data, { type: `Post`, id: `postA` });

                let users = getRelationshipResources(postA.relationships.User);
                expect(users).to.have.resource({ type: `User`, id: `userB` });
                expect(users).to.have.length(1);

            });

            it(`should allow to set related resources`, async () => {

                let data = await server.patch(`/posts/postC/relationships/User`, { type: `User`, id: `userA` });

                let postC = getResource(data, { type: `Post`, id: `postC` });

                let users = getRelationshipResources(postC.relationships.User);
                expect(users).to.have.resource({ type: `User`, id: `userA` });
                expect(users).to.have.length(1);

            });

        });

    });

    describe(`To-Many`, () => {

        describe(`PATCH`, () => {

            it(`should allow to clear related resources`, async () => {

                let data = await server.patch(`/users/userA/relationships/Posts`, []);

                let userA = getResource(data, { type: `User`, id: `userA` });

                let posts = getRelationshipResources(userA.relationships.Posts);
                expect(posts).to.have.length(0);

            });

            it(`should allow to replace related resources`, async () => {

                let data = await server.patch(`/users/userA/relationships/Posts`, { type: `Post`, id: `postB` });

                let userA = getResource(data, { type: `User`, id: `userA` });

                let posts = getRelationshipResources(userA.relationships.Posts);
                expect(posts).to.have.resource({ type: `Post`, id: `postB` });
                expect(posts).to.have.length(1);

            });

            it(`should allow to set related resources`, async () => {

                let data = await server.patch(`/users/userC/relationships/Posts`, [ { type: `Post`, id: `postA` }, { type: `Post`, id: `postB` }, { type: `Post`, id: `postC` } ]);

                let userC = getResource(data, { type: `User`, id: `userC` });

                let posts = getRelationshipResources(userC.relationships.Posts);
                expect(posts).to.have.resource({ type: `Post`, id: `postA` });
                expect(posts).to.have.resource({ type: `Post`, id: `postB` });
                expect(posts).to.have.resource({ type: `Post`, id: `postC` });
                expect(posts).to.have.length(3);

            });

        });

        describe(`POST`, () => {

            it(`should allow to add related resources`, async () => {

                let data = await server.post(`/users/userC/relationships/Posts`, [ { type: `Post`, id: `postB` }, { type: `Post`, id: `postC` } ]);

                let userC = getResource(data, { type: `User`, id: `userC` });

                let posts = getRelationshipResources(userC.relationships.Posts);
                expect(posts).to.have.resource({ type: `Post`, id: `postB` });
                expect(posts).to.have.resource({ type: `Post`, id: `postC` });
                expect(posts).to.have.length(2);

            });

        });

        describe(`DELETE`, () => {

            it(`should allow to remove related resources`, async () => {

                let data = await server.delete(`/users/userA/relationships/Comments`, [ { type: `Comment`, id: `commentA` }, { type: `Comment`, id: `commentD` } ]);

                let userA = getResource(data, { type: `User`, id: `userA` });

                let comments = getRelationshipResources(userA.relationships.Comments);
                expect(comments).to.have.resource({ type: `Comment`, id: `commentB` });
                expect(comments).to.have.length(1);

            });

        });

    });

});
