export const mockTests = [
    {
        id: 1,
        title: "Foundations of Quantum Physics",
        source: "Quantum_Physics_101.pdf",
        timeLimit: 45,
        expires: "Oct 7, 2025",
        avgScore: 82,
        takers: [
            { id: 1, name: "Alice Johnson", date: "Sep 29, 2025", score: 95 },
            { id: 2, name: "Bob Williams", date: "Sep 29, 2025", score: 70 },
            { id: 3, name: "Charlie Brown", date: "Sep 30, 2025", score: 81 },
        ],
    },
    {
        id: 2,
        title: "Project Management Principles",
        source: "PMBOK_Guide_Ch1-3.pdf",
        timeLimit: 60,
        expires: "Oct 5, 2025",
        avgScore: 76,
        takers: [
            { id: 4, name: "Diana Prince", date: "Sep 28, 2025", score: 88 },
            { id: 5, name: "Eve Adams", date: "Sep 30, 2025", score: 64 },
        ],
    },
];

export const mockUserResults = [
    {
        id: 1,
        title: "Advanced Calculus Midterm",
        completedDate: "Sep 15, 2025",
        score: 88,
    },
    {
        id: 2,
        title: "Corporate Compliance Training",
        completedDate: "Sep 22, 2025",
        score: 95,
    },
    {
        id: 3,
        title: "General Relativity Pop Quiz",
        completedDate: "Sep 28, 2025",
        score: 65,
    },
];

export const mockTestForTaking = {
    title: "Foundations of Quantum Physics (Preview)",
    questions: [
        {
            id: 1,
            text: "What phenomenon demonstrates the particle nature of light?",
            options: [
                "Diffraction",
                "The Photoelectric Effect",
                "Refraction",
                "Interference",
            ],
        },
        {
            id: 2,
            text: "Heisenberg's Uncertainty Principle states that you cannot simultaneously know the exact position and what other property of a particle?",
            options: ["Mass", "Charge", "Spin", "Momentum"],
        },
    ],
};
