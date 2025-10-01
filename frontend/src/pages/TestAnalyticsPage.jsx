import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTestData } from "../contexts/TestDataContext";

export function TestAnalyticsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getTestById } = useTestData();
    const test = getTestById(id);
    if (!test)
        return <div className="pt-24 max-w-4xl mx-auto">Test not found.</div>;
    return (
        <div className="max-w-5xl mx-auto px-4 py-24 sm:py-32">
            <button
                onClick={() => navigate("/dashboard")}
                className="text-blue-600 hover:underline mb-6"
            >
                &larr; Back to Dashboard
            </button>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                {test.title}
            </h1>
            <p className="text-gray-500 mb-8">
                Showing results for {test.takers.length} participants.
            </p>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 font-medium text-gray-900">
                                Participant
                            </th>
                            <th className="px-6 py-3 font-medium text-gray-900">
                                Date Completed
                            </th>
                            <th className="px-6 py-3 font-medium text-gray-900 text-right">
                                Score
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {test.takers.map((taker) => (
                            <tr key={taker.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {taker.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500">
                                    {taker.date}
                                </td>
                                <td
                                    className={`px-6 py-4 font-semibold text-right ${
                                        taker.score > 70
                                            ? "text-green-600"
                                            : "text-orange-500"
                                    }`}
                                >
                                    {taker.score}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
