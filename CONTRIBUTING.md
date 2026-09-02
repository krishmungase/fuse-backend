# Contributing

Thanks for taking the time to contribute! This document explains how to
set up a dev environment, the conventions we follow, and what to expect
when opening a pull request.

By participating in this project you agree to abide by the
[Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to contribute

- **Report bugs** — open a GitHub issue with reproduction steps and the
  expected vs. actual behavior.
- **Request features** — open an issue describing the use case before
  writing code, so we can agree on scope.
- **Improve documentation** — typos, clarifications, and new examples
  are very welcome.
- **Submit code** — fix a bug, add a feature, or improve the developer
  experience.

## Development setup

```bash
git clone https://github.com/<your-fork>/express-ts-drizzle-starter.git
cd express-ts-drizzle-starter
npm install
cp .env.example .env   # fill in DB credentials and JWT secrets
npm run db:migrate
npm run dev
```

Prerequisites:

- Node.js (the version pinned by your local toolchain or the latest LTS)
- A running PostgreSQL instance reachable with the credentials in `.env`

## Branching

- `main` is the default integration branch and is expected to always be
  releasable.
- Use short, hyphenated branch names with a type prefix:
  - `feat/<short-summary>` — new functionality
  - `fix/<short-summary>` — bug fix
  - `chore/<short-summary>` — tooling, deps, refactors
  - `docs/<short-summary>` — documentation only

Example: `feat/refresh-token-rotation`, `fix/login-lockout-off-by-one`.

## Commit style

Keep commit messages short, lowercase, and present-tense, describing
*what* the commit does:

```
add user-service unit tests
fix invalid jwt error code
docs clarify env variable defaults
```

Group related changes into a single commit. If a change is large, split
it into reviewable steps with focused messages.

## Code style

- TypeScript strict mode is on — no `any` unless unavoidable, and
  explain it with a brief comment when it is.
- Names should describe intent; let the names carry the meaning instead
  of adding comments that explain *what* the code does.
- Reserve comments for the **why** — invariants, gotchas, links to
  issues, or workarounds that future readers couldn't infer from the
  code.
- Follow the existing folder structure (`app/<feature>/<layer>`) when
  adding new domains.

ESLint and Prettier are wired up — run them before pushing:

```bash
npm run lint
npm run format
npm run type-check
```

Husky runs `lint-staged` on every commit, so staged TypeScript files in
`src/` are auto-fixed and formatted. If the hook fails, fix the
reported issue and create a new commit (do not pass `--no-verify`).

## Database changes

1. Edit the schema files under `src/app/<feature>/schema/`.
2. Generate a migration: `npm run db:generate`.
3. Review the generated SQL in `drizzle/`.
4. Apply locally: `npm run db:migrate`.
5. Commit both the schema change and the migration files together.

## Pull request checklist

Before opening a PR, please make sure:

- [ ] The branch is up to date with `main`.
- [ ] `npm run lint`, `npm run format:check`, and `npm run type-check`
      all pass.
- [ ] New or changed behavior is covered by a test (when tests apply).
- [ ] Documentation (README, code comments, or examples) is updated
      where relevant.
- [ ] Commits are focused and have clear messages.
- [ ] The PR description explains *what* changed and *why*, and links
      any related issue.

## Reporting security issues

Please **do not** open public GitHub issues for security vulnerabilities.
Instead, contact the maintainers privately so we can investigate and
release a fix before disclosure.

## License

By contributing, you agree that your contributions will be licensed
under the [MIT License](./LICENSE).
