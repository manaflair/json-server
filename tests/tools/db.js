import Sequelize from 'sequelize';
import yargs     from 'yargs';

let opts = yargs.boolean(`log-sql`).argv;
let logFlag = true;

export let db = new Sequelize({
    dialect: `sqlite`,
    logging: (... args) => { if (logFlag && opts[`log-sql`]) console.log(... args); }
});

export let User = db.define(`User`, {
    id: { type: Sequelize.STRING, primaryKey: true },
    username: { type: Sequelize.STRING }
});

export let Post = db.define(`Post`, {
    id: { type: Sequelize.STRING, primaryKey: true },
    name: { type: Sequelize.STRING },
    text: { type: Sequelize.TEXT }
});

export let Comment = db.define(`Comment`, {
    id: { type: Sequelize.STRING, primaryKey: true },
    text: { type: Sequelize.TEXT }
});

User.hasMany(Post);
User.hasMany(Comment);

Post.belongsTo(User);
Post.hasMany(Comment);

Comment.belongsTo(User);
Comment.belongsTo(Post);

export function disableSqlLogging(fn) {

    return Promise.resolve().then(() => {

        logFlag = false;
        return fn();

    }).then(result => {

        logFlag = true;
        return result;

    }, error => {

        logFlag = true;
        throw error;

    });

}
