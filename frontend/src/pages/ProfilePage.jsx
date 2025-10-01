import React, { useState } from "react";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiFetch, ApiError } from "../utils/apiClient";

export function ProfilePage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [displayName, setDisplayName] = useState(user?.displayName || "");
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);

    const onSubmit = async (e) => {
        e.preventDefault();
        setStatus("saving");
        setError(null);
        try {
            await apiFetch("/api/v1/auth/me", {
                method: "PATCH",
                body: { displayName },
            });
            await refreshUser();
            setStatus("saved");
            setTimeout(() => setStatus("idle"), 1800);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Update failed");
            setStatus("idle");
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 py-24 sm:py-32">
            <h1 className="text-3xl font-bold mb-8">Profile & Settings</h1>
            <form
                onSubmit={onSubmit}
                className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6"
            >
                {error && <div className="text-sm text-red-600">{error}</div>}
                <div>
                    <label
                        htmlFor="displayName"
                        className="block mb-2 text-sm font-medium text-gray-700"
                    >
                        Display Name
                    </label>
                    <input
                        id="displayName"
                        type="text"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                    />
                </div>
                <div className="pt-4 flex gap-3">
                    <Button
                        type="submit"
                        disabled={status === "saving"}
                        className="flex-1"
                    >
                        {status === "saving"
                            ? "Saving..."
                            : status === "saved"
                            ? "Saved"
                            : "Save Changes"}
                    </Button>
                    <Button
                        variant="secondary"
                        type="button"
                        className="flex-1"
                        onClick={() => navigate("/dashboard")}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
