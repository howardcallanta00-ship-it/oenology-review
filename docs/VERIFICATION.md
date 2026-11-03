# Design and verification record

Checked November 3, 2026, on the generated production assets served over localhost in Chromium through Playwright.

## Design brief and comparison

Audience: a student reviewing Lesson 4 before an examination. Primary task: configure a practice session, answer questions, understand explanations and retry misses. Secondary task: consult the complete source guide.

The first viewport contains an identifiable wine-study masthead, lesson context, topic index and session configuration. A cream paper surface, Georgia serif headings and burgundy ink establish an original wine field-notebook direction; body copy and controls use system sans-serif. The small glass mark and circular lesson stamp are local SVG/CSS assets, requiring no downloads or licensed stock imagery. Questions and tables remain quiet and readable.

Two lightweight studies rendered the same real tannin question at 1440 pixels: (A) a light notebook with a persistent topic index and wide question area, and (B) a dark green split composition with a large title opposite the question. A was selected because navigation and long answer choices fit better and the question remained the dominant work surface. The dark split placed too much weight on introductory copy. This comparison was performed before the full interface was expanded.

Quizlet's product/help references were consulted for study-mode separation. Its main Learn page returned a 403 when fetched; the help page was accessible. No visual reference claims are made about the blocked page. This site uses an original notebook composition and does not copy Quizlet branding. UI/UX skill results informed contrast, keyboard focus, touch targets and reduced motion; unsuitable marketing-layout recommendations were not applied to the study tool.

## Three observable weaknesses corrected

1. **Main workspace:** programmatic route focus drew a large outline around the whole workspace. Removed that noninteractive container outline while retaining prominent focus rings on controls.
2. **Mobile quiz:** the opening heading and horizontal topic index pushed questions too far down. Reduced the session heading and hid the redundant index during phone quizzes; the topic remains in the question heading and source link.
3. **Configuration after results:** a saved completed session could override navigation to a new configuration. Added an explicit `#practice/setup` route and tested new-session and per-topic entry after results.

## Functional verification

- Eight dependency-free automated tests cover source-topic coverage, schema and answer-key bounds, exact-match scoring, combined filters, balanced topic sampling, shuffling, progress updates, saved-session validation and asset budgets.
- Completed all **109 questions through the browser UI** using their keys: 109/109 scored correctly and all unique attempts persisted. This proves key-to-display/scoring consistency, not independent scholarly validation of every handout claim.
- Completed a 20-question mixed session with deliberate wrong answers; checked immediate feedback, results and fresh missed-answer retries.
- Completed a 10-question exam: explanations and correct labels were held until results; correct answers yielded 10/10.
- Verified empty-answer validation and empty filtered-pool recovery.
- Reloaded an unchecked selection and verified it remained selected.
- Verified search, no-results recovery, all 12 guide sections, read-marker persistence and bottle-topic deep links and practice filters.
- Verified reset prompt, cancellation and deletion.
- Tested blocked localStorage in a separate page: answering still worked; the footer disclosed visit-only progress.
- No application console errors observed in the tested build.

## Responsive and accessible behavior

- Inspected rendered desktop and 390px phone practice layouts, then corrected the phone question placement.
- Checked guide widths 375, 390, 768, 1024 and 1440px: no document-level horizontal overflow; wide tables scroll within their own regions.
- Native radios/checkboxes, labeled selects and search, semantic fieldsets, current navigation state, visible keyboard focus, answer validation and status messages are implemented.
- Reduced-motion emulation verified. Keyboard Tab navigation verified. Print styles are included.
- A root font-size resize diagnostic passed without horizontal overflow, but pixel-based typography means this is not a comprehensive browser-zoom test. Screen-reader testing and real-device touch testing were not performed.

## Performance evidence and budgets

All route assets combined are approximately **79 KB uncompressed**. JavaScript is approximately 63 KB raw and 22 KB gzipped. There are no external fonts, scripts, image CDNs or network APIs.

Automated budgets: initial public assets <150 KiB, raw JS <100 KiB, gzipped JS <30 KiB, CSS <20 KiB. All passed. Browser HTTP transfer compression depends on the host; gzip figures are local diagnostics.

Single cold-cache local diagnostics for `/#practice/setup`, Chromium, 4× CPU slowdown, simulated 150ms latency / 200,000 bytes per second download / 93,750 bytes per second upload:

| Viewport | FCP | LCP | CLS |
|---|---:|---:|---:|
| 390 × 844 | 528 ms | 996 ms | 0.042 |
| 1440 × 1000 | 560 ms | 1000 ms | 0.015 |

The phone run used a fresh query URL to force a complete navigation. These are local lab observations, not Render/CDN field results or 75th-percentile Web Vitals. The session, filtering, search and repeated-use flows were exercised for functional responsiveness; INP was not measured. Deployment targets remain LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 in real-user measurements. Recheck after deployment.

## Limits

Render deployment has not been performed. No cross-device sync or account. The guide clearly attributes historical/taxonomic claims and unsupported health assertions; there is no independent fact-checking bibliography. The original quiz has no official answer key. The code standard is guidance, not evidence of a score or independent accessibility certification.
