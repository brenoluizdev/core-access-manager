"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_KEY = "core-access-token";

type Role = "ADMIN" | "USER";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  items: User[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body?.error?.message ?? "Não foi possível concluir a operação.");
  }

  return body as T;
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      <input
        {...props}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-900"
      />
    </label>
  );
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (token: string, user: User) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload =
        mode === "login" ? { email, password } : { name, email, password };

      const result = await api<{ token: string; user: User }>(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onAuthenticated(result.token, result.user);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold">Core Access Manager</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {mode === "login" ? "Entre para gerenciar os usuários." : "O primeiro cadastro vira ADMIN."}
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          {mode === "register" && (
            <Field
              label="Nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              autoComplete="name"
            />
          )}

          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />

          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Enviando..." : mode === "login" ? "Entrar" : "Criar conta"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          {mode === "login" ? "Criar uma conta" : "Já tenho conta"}
        </button>
      </div>
    </main>
  );
}

function Dashboard({ token, user, onSignOut }: { token: string; user: User; onSignOut: () => void }) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [meta, setMeta] = useState<ListResponse["meta"] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");

  const isAdmin = user.role === "ADMIN";
  const loading = users === null;

  const fetchUsers = useCallback(
    (page: number) => {
      const query = new URLSearchParams({ page: String(page), perPage: "10" });

      if (search.trim()) query.set("search", search.trim());

      return api<ListResponse>(`/users?${query.toString()}`, {}, token);
    },
    [search, token],
  );

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;

    void fetchUsers(1)
      .then((result) => {
        if (!active) return;

        setUsers(result.items);
        setMeta(result.meta);
        setError(null);
      })
      .catch((requestError: unknown) => {
        if (!active) return;

        setUsers([]);
        setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
      });

    return () => {
      active = false;
    };
  }, [fetchUsers, isAdmin]);

  const loadUsers = useCallback(
    async (page = 1) => {
      try {
        const result = await fetchUsers(page);

        setUsers(result.items);
        setMeta(result.meta);
        setError(null);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
      }
    },
    [fetchUsers],
  );

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      await api(
        "/users",
        {
          method: "POST",
          body: JSON.stringify({
            name: newName,
            email: newEmail,
            password: newPassword,
            role: newRole,
          }),
        },
        token,
      );

      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("USER");
      await loadUsers(1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
    }
  }

  async function handleDelete(target: User) {
    if (!window.confirm(`Excluir ${target.name}?`)) return;

    try {
      await api(`/users/${target.id}`, { method: "DELETE" }, token);
      await loadUsers(meta?.page ?? 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
    }
  }

  async function handleToggleActive(target: User) {
    try {
      await api(
        `/users/${target.id}`,
        { method: "PATCH", body: JSON.stringify({ isActive: !target.isActive }) },
        token,
      );
      await loadUsers(meta?.page ?? 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erro inesperado.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="text-sm text-zinc-500">
            {user.name} · <span className="font-mono text-xs">{user.role}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Sair
        </button>
      </header>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {!isAdmin ? (
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Sua conta tem perfil <strong>USER</strong>. A listagem e a gestão de usuários são
          restritas a administradores.
        </section>
      ) : (
        <>
          <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Novo usuário
            </h2>

            <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={handleCreate}>
              <Field label="Nome" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <Field
                label="E-mail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
              <Field
                label="Senha"
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">Perfil</span>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <button
                type="submit"
                className="self-end rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Cadastrar
              </button>
            </form>
          </section>

          <section className="mt-6 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nome ou e-mail"
                className="w-full max-w-xs rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="text-xs text-zinc-500">
                {loading ? "Carregando..." : `${meta?.total ?? 0} usuário(s)`}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Perfil</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-zinc-500">{item.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs dark:bg-zinc-800">
                          {item.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            item.isActive
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {item.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(item)}
                            className="rounded-md border border-zinc-300 px-2 py-1 text-xs transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                          >
                            {item.isActive ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(item)}
                            disabled={item.id === user.id}
                            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-40 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {users?.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-200 p-4 text-sm dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => void loadUsers(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
                >
                  Anterior
                </button>
                <span className="text-zinc-500">
                  Página {meta.page} de {meta.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => void loadUsers(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="rounded-md border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
                >
                  Próxima
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

async function restoreSession(): Promise<{ token: string; user: User } | null> {
  const stored = window.localStorage.getItem(TOKEN_KEY);

  if (!stored) return null;

  try {
    const { user } = await api<{ user: User }>("/auth/me", {}, stored);

    return { token: stored, user };
  } catch {
    window.localStorage.removeItem(TOKEN_KEY);

    return null;
  }
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let active = true;

    void restoreSession().then((session) => {
      if (!active) return;

      if (session) {
        setToken(session.token);
        setUser(session.user);
      }

      setBootstrapping(false);
    });

    return () => {
      active = false;
    };
  }, []);

  function handleAuthenticated(nextToken: string, nextUser: User) {
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  function handleSignOut() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  if (bootstrapping) {
    return (
      <main className="flex flex-1 items-center justify-center text-sm text-zinc-500">
        Carregando...
      </main>
    );
  }

  if (!token || !user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return <Dashboard token={token} user={user} onSignOut={handleSignOut} />;
}
