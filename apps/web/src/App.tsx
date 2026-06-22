import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "./auth-client";
import { getStock, getWeather, type GetStockResponse, type GetWeatherResponse } from "./api";
import "./App.css";

export default function App() {
  const { data: session, isPending } = authClient.useSession();
  const [weather, setWeather] = useState<GetWeatherResponse>();
  const [stock, setStock] = useState<GetStockResponse>();
  const [stockStatus, setStockStatus] = useState<string>();

  // Public-endepunkt: hent alltid.
  useEffect(() => {
    getWeather().then((r) => setWeather(r.data));
  }, []);

  // Private-endepunkt: hent når vi har en session, nullstill når vi logger ut.
  useEffect(() => {
    if (!session) {
      setStock(undefined);
      setStockStatus(undefined);
      return;
    }
    getStock().then((r) => {
      if (r.data) setStock(r.data);
      else setStockStatus(`Avvist (${r.response?.status ?? 401})`);
    });
  }, [session]);

  return (
    <main className="page">
      <header>
        <h1>daloy + better-auth</h1>
        <p className="sub">
          Vite + React · Bun-backend (daloy API + better-auth) · typet SDK fra OpenAPI
        </p>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>🌤️ Vær</h2>
          <span className="badge open">public</span>
        </div>
        {weather ? (
          <p className="data">
            {weather.city}: <strong>{weather.tempC}°C</strong>, {weather.condition}
          </p>
        ) : (
          <p className="muted">Laster…</p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>📈 Aksjer</h2>
          <span className="badge locked">private</span>
        </div>

        {isPending ? (
          <p className="muted">Sjekker session…</p>
        ) : session ? (
          <>
            <div className="row">
              <span className="muted">Logget inn som {session.user.email}</span>
              <button onClick={() => authClient.signOut()}>Logg ut</button>
            </div>
            {stock ? (
              <table>
                <thead>
                  <tr><th>Symbol</th><th>Antall</th><th>Kurs</th></tr>
                </thead>
                <tbody>
                  {stock.positions.map((p) => (
                    <tr key={p.symbol}>
                      <td>{p.symbol}</td><td>{p.shares}</td><td>{p.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted">{stockStatus ?? "Laster…"}</p>
            )}
          </>
        ) : (
          <LoginForm />
        )}
      </section>

      <footer className="muted">
        Backend-docs: <a href="/docs" target="_blank" rel="noreferrer">/docs</a> (OpenAPI)
      </footer>
    </main>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("test1234");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    const { error } = await authClient.signIn.email({ email, password });
    if (error) setError(error.message ?? "Innlogging feilet");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="login">
      <p className="muted">Logg inn for å se aksjeporteføljen (seeded testbruker er forhåndsfylt).</p>
      <label>
        E-post
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      </label>
      <label>
        Passord
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Logger inn…" : "Logg inn"}</button>
    </form>
  );
}
