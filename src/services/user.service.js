/**
 * Get all users
 */
async function getAllUsers(prisma) {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
      createdAt: true
    }
  });
}

/**
 * Get a user by ID
 */
async function getUserById(prisma, userId) {
  return await prisma.user.findUnique({
    where: { id: parseInt(userId) },
    select: {
      id: true,
      username: true,
      displayName: true,
      createdAt: true
    }
  });
}

/**
 * Create a new user
 */
async function createUser(prisma, userData) {
  const { username, displayName } = userData;
  
  return await prisma.user.create({
    data: {
      username,
      displayName
    }
  });
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser
};