// Get stored user and folder IDs
const seedData = db.migration_data.findOne({ _id: "seed_data" });
const userIds = seedData.userIds;
const folderIds = seedData.folderIds;

// Function to generate random text
function randomText(length) {
    const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
    let result = '';
    for (let i = 0; i < length; i++) {
        result += words[Math.floor(Math.random() * words.length)] + ' ';
    }
    return result.trim();
}

// Function to generate random tags
function randomTags() {
    const allTags = ['important', 'draft', 'final', 'review', 'urgent', 'confidential', 'project', 'meeting', 'report', 'analysis', 'research', 'development', 'testing', 'deployment'];
    const numTags = Math.floor(Math.random() * 4) + 1; // 1-4 tags
    const tags = [];
    for (let i = 0; i < numTags; i++) {
        const tag = allTags[Math.floor(Math.random() * allTags.length)];
        if (!tags.includes(tag)) {
            tags.push(tag);
        }
    }
    return tags;
}

// Function to generate random metadata
function randomMetadata() {
    return {
        fileSize: Math.floor(Math.random() * 1000000) + 1000, // 1KB to 1MB
        fileType: ['pdf', 'doc', 'txt', 'md'][Math.floor(Math.random() * 4)],
        lastModified: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000), // Last 30 days
        version: (Math.random() * 5).toFixed(1),
        status: ['draft', 'review', 'approved', 'archived'][Math.floor(Math.random() * 4)]
    };
}

// Generate 100 documents
const documents = [];
const now = new Date();

for (let i = 1; i <= 100; i++) {
    const createdAt = new Date(now - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000); // Last 90 days
    const updatedAt = new Date(createdAt.getTime() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // 0-30 days after creation
    
    documents.push({
        name: `Document ${i.toString().padStart(3, '0')}`,
        content: randomText(50 + Math.floor(Math.random() * 100)), // 50-150 words
        ownerId: userIds[Math.floor(Math.random() * userIds.length)], // Random user
        folderId: folderIds[Math.floor(Math.random() * folderIds.length)], // Random folder
        tags: randomTags(),
        metadata: randomMetadata(),
        createdAt: createdAt,
        updatedAt: updatedAt
    });
}

// Insert the documents
db.documents.insertMany(documents);

print('Inserted 100 sample documents'); 