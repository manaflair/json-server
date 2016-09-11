import { User, Post, Comment, db, disableSqlLogging } from './db';

export async function setupTestEnvironment() {

    await disableSqlLogging(async () => {

        await db.sync({ force: true });

        let userA = await User.create({ id: `userA`, username: `User A` });
        let userB = await User.create({ id: `userB`, username: `User B` });
        let userC = await User.create({ id: `userC`, username: `User C` });

        let postA = await Post.create({ id: `postA`, name: `Post A` });
        let postB = await Post.create({ id: `postB`, name: `Post B` });
        let postC = await Post.create({ id: `postC`, name: `Post C` });

        let commentA = await Comment.create({ id: `commentA`, text: `Comment A` });
        let commentB = await Comment.create({ id: `commentB`, text: `Comment B` });
        let commentC = await Comment.create({ id: `commentC`, text: `Comment C` });
        let commentD = await Comment.create({ id: `commentD`, text: `Comment D` });
        let commentE = await Comment.create({ id: `commentE`, text: `Comment E` });

        await postA.setUser(userA);
        await postB.setUser(userB);

        await commentA.setUser(userA);
        await commentB.setUser(userA);
        await commentC.setUser(userB);
        await commentD.setUser(userA);

        await commentA.setPost(postA);
        await commentB.setPost(postA);
        await commentC.setPost(postA);
        await commentD.setPost(postB);

    });

}
