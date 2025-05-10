// Create some sample users
const users = [
    {
        name: "John Doe",
        email: "john.doe@example.com",
        age: 30,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        age: 28,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        age: 35,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert users and get their IDs
const insertedUsers = db.users.insertMany(users);
const userIds = Object.values(insertedUsers.insertedIds);

// Create folder structure
const folders = [
    {
        name: "Projects",
        ownerId: userIds[0],
        parentId: null,
        path: "/Projects",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Personal",
        ownerId: userIds[1],
        parentId: null,
        path: "/Personal",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Shared",
        ownerId: userIds[2],
        parentId: null,
        path: "/Shared",
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// Insert folders and get their IDs
const insertedFolders = db.folders.insertMany(folders);
const folderIds = Object.values(insertedFolders.insertedIds);

// Store IDs in a global variable for use in other migrations
db.migration_data.insertOne({
    _id: "seed_data",
    userIds: userIds,
    folderIds: folderIds,
    createdAt: new Date()
});

print('Inserted sample users and folders'); 