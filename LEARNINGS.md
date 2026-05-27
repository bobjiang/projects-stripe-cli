# LEARNINGS

Project learnings, root causes, and prevention notes. Newest first.

---

## 2026-05-24 — Turso credentials via Stripe Projects: broker trust model & safety

**Context:** Asked whether it's safe for the Turso database credentials to be
handled by Stripe (the Stripe Projects CLI broker model).

**Key insight — control plane vs. data plane:**
Stripe is *not* a proxy for database traffic. The two paths are separate:

- **Control plane → through Stripe:** provisioning, issuing/revealing the auth
  token, billing. Stripe *can* mint and re-reveal the credential (this is how
  `stripe projects env --pull` rebuilds `.env` without re-provisioning).
- **Data plane → direct to Turso:** `@tursodatabase/serverless` opens HTTPS
  straight from this machine to the `libsql://…aws-ap-south-1` endpoint. SQL
  queries/rows **never touch Stripe**.

**Is it safe? — trust + blast radius:**
The broker model inherently means Stripe can access a credential that can
access the DB — you can't have "Stripe provisions & bills it" without "Stripe
can issue keys to it." The useful question is *who can touch it* and *what's
the blast radius if it leaks*:

| Location | Exposure | Mitigation |
|---|---|---|
| At Stripe (server-side) | trust dependency | PCI-DSS L1 / SOC-audited payments provider; credential custody is core competency |
| In transit | provisioning + queries | both TLS/HTTPS |
| On this machine (`.env`, `.projects/vault/`) | **weakest link in practice** | both gitignored ✓; any local process can read `.env` |
| The token itself | scoped to `primary-db` only | not an account key — can't reach other DBs or billing; Free tier = tiny financial blast radius |

**Kill switch:** if the token leaks, `stripe projects rotate primary-db`
invalidates the old token (within ~1h) and `stripe projects env --sync` issues
a fresh one. Destructive to anything using the old token — requires explicit
user consent and a redeploy afterward.

**Prevention / action items:**
- Protect the **local `.env`** — it is the real-world leak point, not Stripe.
  Never `cat .env`, never paste it into chats/issues/PRs, don't let other tools
  dump it. (`.env` and `.projects/vault/` are already gitignored — verified.)
- If "no third party may ever issue a key to my DB" is a hard requirement, the
  broker model is the wrong fit. For a Free-tier learning/demo DB, the trade-off
  is reasonable.
- Use `stripe projects env --json` (names only, values redacted) to inspect
  credential keys — never read the raw file.
