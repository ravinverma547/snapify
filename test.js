"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log("🔗 Connecting to MongoDB...");
            // Test connection
            const user = yield prisma.user.findFirst();
            console.log("✅ MongoDB Connection Successful!");
            // Test 1: Create a User
            console.log("\n📝 Test 1: Creating a User...");
            const newUser = yield prisma.user.create({
                data: {
                    email: `testuser_${Date.now()}@test.com`,
                    username: `testuser_${Date.now()}`,
                    displayName: "Test User",
                    password: "hashed_password_123",
                    role: "USER",
                },
            });
            console.log("✅ User Created:", newUser.id);
            // Test 2: Read User
            console.log("\n📖 Test 2: Reading User...");
            const foundUser = yield prisma.user.findUnique({
                where: { id: newUser.id },
                include: {
                    sentSnaps: true,
                    receivedSnaps: true,
                    stories: true,
                },
            });
            console.log("✅ User Found:", foundUser === null || foundUser === void 0 ? void 0 : foundUser.email);
            // Test 3: Update User
            console.log("\n✏️ Test 3: Updating User...");
            const updatedUser = yield prisma.user.update({
                where: { id: newUser.id },
                data: { displayName: "Updated Test User", score: 100 },
            });
            console.log("✅ User Updated:", updatedUser.displayName);
            // Test 4: Create another user for friendship test
            console.log("\n📝 Test 4: Creating Another User for Friendship...");
            const anotherUser = yield prisma.user.create({
                data: {
                    email: `frienduser_${Date.now()}@test.com`,
                    username: `frienduser_${Date.now()}`,
                    displayName: "Friend User",
                    password: "hashed_password_456",
                    role: "USER",
                },
            });
            console.log("✅ Friend User Created:", anotherUser.id);
            // Test 5: Create Friendship
            console.log("\n🤝 Test 5: Creating Friendship...");
            const friendship = yield prisma.friendship.create({
                data: {
                    requesterId: newUser.id,
                    addresseeId: anotherUser.id,
                    status: "PENDING",
                },
            });
            console.log("✅ Friendship Created:", friendship.id);
            // Test 6: Query with relations
            console.log("\n🔍 Test 6: Querying User with Relations...");
            const userWithFriends = yield prisma.user.findUnique({
                where: { id: newUser.id },
                include: {
                    friends: true,
                    friendOf: true,
                },
            });
            console.log("✅ User with Friends:", userWithFriends === null || userWithFriends === void 0 ? void 0 : userWithFriends.friends.length);
            // Test 7: Delete User (Cleanup)
            console.log("\n🗑️ Test 7: Deleting Test Data...");
            yield prisma.friendship.delete({
                where: { id: friendship.id },
            });
            yield prisma.user.delete({
                where: { id: newUser.id },
            });
            yield prisma.user.delete({
                where: { id: anotherUser.id },
            });
            console.log("✅ Test Data Deleted");
            console.log("\n✨ All Tests Passed Successfully! ✨");
        }
        catch (error) {
            console.error("❌ Error:", error);
            process.exit(1);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
main();
