import { getDb } from "../db/index.js";

function rowFromResult(res) {
    if (!res || !res.length) return undefined;
    const cols = res[0].columns;
    const values = res[0].values[0];
    if (!values) return undefined;
    const obj = {};
    cols.forEach((c, i) => {
        obj[c] = values[i];
    });
    return obj;
}

export class UserRepository {
    async create(user) {
        const db = await getDb();
        const { id, email, password_hash, display_name } = user;
        db.exec(
            `INSERT INTO users (id, email, password_hash, display_name) VALUES ('${id}', '${email.replace(
                /'/g,
                "''"
            )}', '${password_hash}', ${
                display_name ? `'${display_name.replace(/'/g, "''")}'` : "NULL"
            });`
        );
        return this.findById(id);
    }

    async findByEmail(email) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM users WHERE email='${email.replace(/'/g, "''")}';`
        );
        return rowFromResult(res);
    }

    async findById(id) {
        const db = await getDb();
        const res = db.exec(`SELECT * FROM users WHERE id='${id}';`);
        return rowFromResult(res);
    }

    async updateDisplayName(id, displayName){
        const db = await getDb();
        db.exec(`UPDATE users SET display_name='${displayName.replace(/'/g,"''")}' WHERE id='${id}';`);
        return this.findById(id);
    }
}
