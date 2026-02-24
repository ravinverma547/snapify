
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting verification...');

    try {
        // 1. Create two users
        console.log('Creating users...');
        const user1 = await prisma.user.create({
            data: {
                email: `user1_${Date.now()}@example.com`,
                username: `user1_${Date.now()}`,
                password: 'password123',
                displayName: 'User One',
            },
        });

        const user2 = await prisma.user.create({
            data: {
                email: `user2_${Date.now()}@example.com`,
                username: `user2_${Date.now()}`,
                password: 'password123',
                displayName: 'User Two',
            },
        });

        console.log(`Created users: ${user1.username}, ${user2.username}`);

        // 2. Create a friendship (User 1 requests User 2)
        console.log('Creating friendship...');
        const friendship = await prisma.friendship.create({
            data: {
                requesterId: user1.id,
                addresseeId: user2.id,
                status: 'PENDING',
            },
        });
        console.log(`Friendship created with status: ${friendship.status}`);

        // 3. Send a Snap (User 1 sends to User 2)
        console.log('Sending a snap...');
        const snap = await prisma.snap.create({
            data: {
                senderId: user1.id,
                receiverId: user2.id,
                url: 'https://example.com/snap.jpg',
                mediaType: 'IMAGE',
                viewDuration: 10,
                status: 'SENT',
            },
        });
        console.log(`Snap sent with ID: ${snap.id}`);

        // 4. Verify relations
        const user1WithSnaps = await prisma.user.findUnique({
            where: { id: user1.id },
            include: { sentSnaps: true },
        });

        if (user1WithSnaps?.sentSnaps.length === 1) {
            console.log('Verification SUCCESS: User 1 has 1 sent snap.');
        } else {
            console.error('Verification FAILED: User 1 sent snap count mismatch.');
        }

        // Cleanup (optional, but good for repetitive testing)
        // await prisma.snap.deleteMany();
        // await prisma.friendship.deleteMany();
        // await prisma.user.deleteMany();

    } catch (error) {
        console.error('Verification failed with error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
