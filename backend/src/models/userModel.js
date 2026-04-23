const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

module.exports.getAllUsers = async function getAllUsers() {
  return prisma.users.findMany();
};

module.exports.getUserById = async function getUserById(id) {
  return prisma.users.findUnique({
    where: { id: id },
    select: {
      id: true,
      username: true,
      email: true,
      created_at: true,
    }
  });
}

module.exports.createUser = async function createUser(userData) {
  const {
    username,
    email,
    password,
    role = 1,
  } = userData;

  return prisma.$transaction(async function (tx) {
    const createdUser = await tx.users.create({
      data: {
        username,
        email,
        password,
        role,
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    return createdUser;
  });
};

module.exports.updateUser = async function updateUser(id, userData) {
  const { username, email } = userData;

  return prisma.users.update({
    where: { id: id },
    data: {
      username,
      email,
      updated_at: new Date()
    },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });
};

module.exports.deleteUser = async function deleteUser(id) {
  return prisma.users.delete({
    where: { id: id },
  });
};

module.exports.loginUser = async function loginUser(username) {
  return prisma.users.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      password: true,
      role: true,
    },
  });
};
