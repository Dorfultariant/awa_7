const users = [];

function getUserById(id) {
    return users.find((usr) => usr.id === id);
}


function getUserByUsername(username) {
    return users.find((usr) => usr.username === username);
}

module.exports = { users, getUserById, getUserByUsername };
