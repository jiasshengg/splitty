const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.getAllUsers = async function getAllUsers() {
  return prisma.users.findMany();
};

module.exports.getUserById = async function getUserById(id) {
  return prisma.users.findUnique({
    where: { id: id },
  });
}

module.exports.createUser = async function createUser(userData) {
  const {
    username,
    email,
    password,
    first_name,
    last_name,
    role,
    } = userData;

  return prisma.$transaction(async (tx) => {
    const createdUser = await tx.users.create({
      data: {
        username,
        email,
        password,
        first_name,
        last_name,
        role
      },
    });

    return createdUser;
  });
};

module.exports.updateUser = async function updateUser(id, userData) {
    const {username, email, first_name, last_name} = userData;
  return prisma.users.update({
    where: { id: id },
    data: {
        username,
        email,
        first_name,
        last_name,
    },
  });
}

module.exports.deleteUser = async function deleteUser(id) {
  return prisma.users.delete({
    where: { id: id },
  });
}