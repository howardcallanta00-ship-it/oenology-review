# Cellar Notes

A complete static oenology reviewer based on the nine-page **Oenology Notes.pdf**, Lesson 4. Built to the supplied **CODE STANDARD V5** with native HTML, CSS and JavaScript.

## Included

- **109 questions:** 63 multiple choice, 25 true/false, 21 select-all.
- All source topics, examples, bottle combinations, corkscrew diagram labels and original quiz distinctions in a searchable field guide.
- Learning mode with immediate explanations; exam mode with explanations at completion.
- Shuffled choices, mixed-format sessions, topic/format filters and 10/20/40/all question lengths.
- Short all-topic sessions sample across topics. Use **All available** for the complete bank.
- Exact-match select-all scoring, results by topic, per-question review and missed-question retries.
- Browser-local progress, read markers, saved selections and resumable sessions.
- Responsive layout, keyboard-accessible controls, reduced-motion support and print styles.
- Explicit source clarifications for unsupported claims, taxonomy issues and ambiguous quiz wording.

No runtime dependencies, paid libraries, accounts, API keys, analytics or backend. Nothing calls an AI service. Answers are public in the source files, as expected for a self-study tool.

## Preview locally

Install Node.js 20 or later, then open a terminal in this folder:

```sh
npm start
```

Open http://127.0.0.1:4173. Use a local server rather than double-clicking the HTML file; JavaScript modules need HTTP. No `npm install` is needed because there are no dependencies.

```sh
npm test
npm run build
```

The build produces `dist/`, containing only deployable assets. Tests and documentation are not published.

## Push to GitHub later

Create a repository and upload **the contents of this folder** at the repository root, including `public/`, `scripts/`, `tests/`, `package.json`, `render.yaml` and `.gitignore`. Do not upload the ZIP itself as the website. GitHub's upload interface or your usual Git client both work. The `dist/` folder is generated during deployment and is ignored by Git.

## Deploy on Render as a free static site

1. Use Render's free Hobby workspace. Choose **New → Static Site**, then connect your GitHub repository. Choose Static Site, rather than Web Service.
2. Use these settings:

| Setting | Value |
|---|---|
| Name | `cellar-notes` or another available name |
| Branch | The branch containing this project, usually `main` |
| Root Directory | Leave empty if this folder's contents are at the repository root |
| Build Command | `npm run build` |
| Publish Directory | `dist` |
| Environment variables | None required |

3. Create the static site. Use its free `onrender.com` address; no custom domain purchase is needed.
4. Verify a practice session, a topic deep link, and a reload of a saved answer on the deployed address.

If you place the project in a subfolder of an existing repository, set **Root Directory** to that subfolder instead. The included `render.yaml` also describes a static service for a Blueprint deployment when this project is at the repository root. Static services use `runtime: static`; no paid compute plan is specified or needed.

Render states that static sites are free and consume included bandwidth and build minutes. To keep this a no-payment project, stay on the free workspace, do not add paid services or upgrades, and monitor the included usage. If the dashboard asks for a paid upgrade, stop rather than accept it. This project itself has no billable service dependencies.

Official deployment references, checked November 3, 2026:
- [Static sites](https://render.com/docs/static-sites)
- [Free deployment and usage limits](https://render.com/docs/free)

GitHub repository: [howardcallanta00-ship-it/oenology-review](https://github.com/howardcallanta00-ship-it/oenology-review). Render deployment is a separate step using the settings above.

## Edit the content

`public/data.js` holds all topic notes and question definitions. The helpers `mc`, `tf` and `multi` create the three question types. Answer keys refer to original option indices, starting at zero; the app shuffles display order while retaining those indices.

Keep question order stable when updating an existing live site: question IDs are assigned sequentially. If you substantially reorder or replace the bank, change the storage key/version in `public/app.js` so old saved history cannot attach to different questions.

The full PDF is not bundled or exposed on the public site. Page references in each topic refer to the supplied document. The app reproduces the study content with source caveats rather than treating every handout claim as verified fact. The ambiguous roasted-chicken pairing is explained but not forced into an artificial scored answer.

## Project map

```text
public/          Static application and question bank
scripts/         Dependency-free build and local preview server
tests/           Content, scoring, persistence and asset-budget checks
docs/            Design/verification notes and preview images
render.yaml      Optional Render Blueprint configuration
```

See [verification notes](docs/VERIFICATION.md) for observed checks and limitations. Progress is local to a browser and does not sync across devices. Blocking or clearing browser storage affects persistence, but the quiz still works for the current visit.
