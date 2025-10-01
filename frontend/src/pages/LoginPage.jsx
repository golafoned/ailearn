import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/Button";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
    const { login, loading, error, clearError } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [formError, setFormError] = useState(null);
    const navigate = useNavigate();

    const onSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        clearError();
        if (!email || !password) {
            setFormError("Email and password required");
            return;
        }
        try {
            await login({ email, password });
            navigate("/dashboard");
        } catch {
            // handled in context
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-24 sm:py-32">
            <h1 className="text-3xl font-bold mb-6">Sign In</h1>
            <form
                onSubmit={onSubmit}
                className="space-y-6 bg-white p-8 rounded-xl border border-gray-200 shadow-sm"
            >
                {(formError || error) && (
                    <div className="text-sm text-red-600">
                        {formError || error}
                    </div>
                )}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <input
                        type="email"
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <input
                        type="password"
                        className="w-full rounded-lg border border-gray-300 p-2.5 focus:ring-blue-500 focus:border-blue-500"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                    />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Signing in..." : "Sign In"}
                </Button>
                <p className="text-sm text-gray-600">
                    Need an account?{" "}
                    <Link
                        to="/register"
                        className="text-blue-600 hover:underline"
                    >
                        Register
                    </Link>
                </p>
            </form>
        </div>
    );
}
