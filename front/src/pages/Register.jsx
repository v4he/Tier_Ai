import React, { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Feather, Mail, Lock } from "lucide-react";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erreur d'inscription");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      window.postMessage({
        type: 'LOGIN_FROM_PAGE',
        token: data.token
      }, '*');
      console.log('LOGIN_FROM_PAGE signal sent');

      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2b2b2b] flex items-center justify-center px-4">
      <div className="bg-[#3d3d3d] rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-white/5">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Feather className="text-white" size={36} />
          <span className="text-3xl font-bold text-white">TierAI</span>
        </div>
        <h1 className="text-2xl font-semibold text-white text-center mb-2">Inscription</h1>
        <p className="text-gray-400 text-center mb-6 text-sm">Créez votre compte gratuitement</p>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#2d2d2d] text-white px-4 py-3 pl-12 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="vous@exemple.com"
                required
                aria-label="Adresse email"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#2d2d2d] text-white px-4 py-3 pl-12 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="Minimum 6 caractères"
                required
                aria-label="Mot de passe"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} aria-hidden="true" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#2d2d2d] text-white px-4 py-3 pl-12 rounded-2xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
                placeholder="Confirmez votre mot de passe"
                required
                aria-label="Confirmer le mot de passe"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-black py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Inscription..." : "S'inscrire"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          Déjà un compte ? <Link to="/login" className="text-white font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;