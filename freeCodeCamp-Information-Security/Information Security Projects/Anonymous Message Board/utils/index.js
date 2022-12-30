const { scrypt, randomBytes } = require("crypto");

exports.generateHashPassword = async (password) => {
    return new Promise((resolve, reject) => {
        const salt = randomBytes(16).toString("hex");
        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${derivedKey.toString("hex")}.${salt}`);
        });
    });
}

exports.compareHashPassword = async (password, hash) => {
    return new Promise((resolve, reject) => {
        const [key, salt] = hash.split(".");
        scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(key === derivedKey.toString("hex"));
        });
    });
}

