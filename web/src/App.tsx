import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { Chat } from "./components/Chat";
import { ContextPage } from "./components/ContextPage";
import { Login } from "./components/Login";
import { Usage } from "./components/Usage";

type Route = "chat" | "usage" | "context";

function routeFromPath(): Route {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path.endsWith("/usage")) return "usage";
  if (path.endsWith("/context")) return "context";
  return "chat";
}

const ROUTE_PATHS: Record<Route, string> = {
  chat: "/gpt",
  usage: "/gpt/usage",
  context: "/gpt/context",
};

export function App() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [route, setRoute] = useState<Route>(routeFromPath());

  useEffect(() => {
    api
      .authCheck()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    const onPop = () => setRoute(routeFromPath());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((to: Route) => {
    window.history.pushState(null, "", ROUTE_PATHS[to]);
    setRoute(to);
  }, []);

  if (authed === null) {
    return <div className="app" />;
  }

  const navLink = (to: Route, label: string) => (
    <a
      href={ROUTE_PATHS[to]}
      className={route === to ? "active" : ""}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {label}
    </a>
  );

  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="/">
          <img src="/assets/coop-logo.png" alt="" width="24" height="24" />
          Coop <span className="tag">GPT</span>
        </a>
        {authed && (
          <nav>
            {navLink("chat", "Chat")}
            {navLink("context", "Context")}
            {navLink("usage", "Usage")}
            <a
              href="#logout"
              onClick={(e) => {
                e.preventDefault();
                api.logout().then(() => setAuthed(false));
              }}
            >
              Log out
            </a>
          </nav>
        )}
      </header>
      {!authed ? (
        <Login onSuccess={() => setAuthed(true)} />
      ) : route === "usage" ? (
        <Usage />
      ) : route === "context" ? (
        <ContextPage />
      ) : (
        <Chat />
      )}
    </div>
  );
}
