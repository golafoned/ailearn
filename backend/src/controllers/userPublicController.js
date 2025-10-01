import { UserRepository } from "../repositories/userRepository.js";
import { TestRepository } from "../repositories/testRepository.js";

const userRepo = new UserRepository();
const testRepo = new TestRepository();

export async function getPublicUser(req, res, next) {
    try {
        const { id } = req.params;
        const user = await userRepo.findById(id);
        if (!user) return res.status(404).json({ error: "User not found" });
        const tests = await testRepo.listByOwnerPaged(id, {
            page: 1,
            pageSize: 1,
        });
        res.json({
            user: {
                id: user.id,
                displayName: user.display_name,
                createdAt: user.created_at,
                testsCount: tests.total,
            },
        });
    } catch (e) {
        next(e);
    }
}
