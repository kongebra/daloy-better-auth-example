import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "./auth-client";
import { getStock, getWeather, type GetStockResponse, type GetWeatherResponse } from "./api";
import "./App.css";

export default function App() {
  const { data: session, isPending } = authClient.useSession();
  const [weather, setWeather] = useState<GetWeatherResponse>();
  const [weatherError, setWeatherError] = useState<string>();
  const [stock, setStock] = useState<GetStockResponse>();
  const [stockStatus, setStockStatus] = useState<string>();

  // Public endpoint: ask for the user's location; the backend falls back to
  // Tokyo if we can't provide lat/lon (denied or unavailable).
  useEffect(() => {
    const load = (query?: { lat: number; lon: number }) =>
      getWeather({ query })
        .then((r) =>
          r.data ? setWeather(r.data) : setWeatherError("Couldn't load weather right now."),
        )
        .catch(() => setWeatherError("Couldn't reach the weather service."));

    if (!navigator.geolocation) return void load();
    navigator.geolocation.getCurrentPosition(
      (pos) => load({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => load(), // denied/unavailable -> backend fallback (Shibuya)
      { timeout: 8000 }, // don't hang forever waiting for a permission decision
    );
  }, []);

  // Private endpoint: fetch when we have a session. When logged out the card
  // shows the login form instead, so stale stock state is never rendered.
  useEffect(() => {
    if (!session) return;
    getStock().then((r) => {
      if (r.data) setStock(r.data);
      else if (r.response?.status === 401)
        setStockStatus("Your session was rejected — try signing in again.");
      else setStockStatus("Market data is unavailable right now.");
    });
  }, [session]);

  return (
    <main className="page">
      <header>
        <h1>daloy + better-auth</h1>
        <p className="sub">
          Vite + React · Bun backend (daloy API + better-auth) · typed SDK from OpenAPI
        </p>
      </header>

      <section className="card">
        <div className="card-head">
          <h2>🌤️ Weather</h2>
          <span className="badge open">public</span>
        </div>
        {weather ? (
          <p className="data">
            {weather.place}: <strong>{weather.tempC}°C</strong>, {weather.condition}{" "}
            <span className="muted">· wind {weather.windKmh} km/h</span>
          </p>
        ) : weatherError ? (
          <p className="error">{weatherError}</p>
        ) : (
          <p className="muted">Loading…</p>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>📈 Most active</h2>
          <span className="badge locked">private</span>
        </div>

        {isPending ? (
          <p className="muted">Checking session…</p>
        ) : session ? (
          <>
            <div className="row">
              <span className="muted">Signed in as {session.user.email}</span>
              <button onClick={() => authClient.signOut()}>Sign out</button>
            </div>
            {stock ? (
              <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Symbol</th><th>Name</th><th>Price ($)</th><th>Change</th></tr>
                </thead>
                <tbody>
                  {stock.mostActive.map((p) => (
                    <tr key={p.symbol}>
                      <td>{p.symbol}</td>
                      <td>{p.name}</td>
                      <td>{p.price}</td>
                      <td className={p.changePercent >= 0 ? "up" : "down"}>
                        {p.changePercent >= 0 ? "+" : ""}{p.changePercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            ) : (
              <p className="muted">{stockStatus ?? "Loading…"}</p>
            )}
          </>
        ) : (
          <LoginForm />
        )}
      </section>

      <footer className="muted">
        Backend docs: <a href="/docs" target="_blank" rel="noreferrer">/docs</a> (OpenAPI)
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
    if (error) setError(error.message ?? "Sign in failed");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="login">
      <p className="muted">Sign in to see the most active stocks (the seeded test user is prefilled).</p>
      <label>
        Email
        <input name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
      </label>
      <label>
        Password
        <input name="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
