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

export class RefreshTokenRepository {
    async add(token) {
        const db = await getDb();
        const { id, user_id, token: t, expires_at, revoked } = token;
        db.exec(
            `INSERT INTO refresh_tokens (id, user_id, token, expires_at, revoked) VALUES ('${id}', '${user_id}', '${t}', '${expires_at}', ${revoked});`
        );
        return token;
    }

    async find(token) {
        const db = await getDb();
        const res = db.exec(
            `SELECT * FROM refresh_tokens WHERE token='${token}';`
        );
        return rowFromResult(res);
    }

    async revoke(token) {
        const db = await getDb();
        db.exec(
            `UPDATE refresh_tokens SET revoked = 1 WHERE token='${token}';`
        );
    }

    async deleteByUser(userId) {
        const db = await getDb();
        db.exec(`DELETE FROM refresh_tokens WHERE user_id='${userId}';`);
    }
}
