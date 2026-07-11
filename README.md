# Benchmark: Fourteen-Model Comparison (Qwen + Sonnet + DeepSeek + Step + Ornith + A1)

A side-by-side comparison of fourteen AI model variants on non-trivial coding tasks designed to test **architectural judgment** and **ambiguity-handling** - not just raw correctness.

This benchmark is intentionally built around **underspecified, real-world prompts** run against existing small codebases. The point is to measure how models resolve ambiguity, choose scope, and preserve working systems under realistic constraints - not whether they can produce a syntactically correct patch.

Methodology highlights (from [BENCHMARK.md](./BENCHMARK.md)):
- Each model gets the same starter code and the same prompt text, with no extra "helpful" clarification.
- Agent runs are allowed to complete without guidance; if a model asks questions, responses are brief and non-leading.
- Scoring uses rubric dimensions beyond correctness: architectural judgment, ambiguity-handling, existing-code respect, failure-mode reasoning, and code quality.
- Results are best interpreted over multiple runs per (model, task) because agent-mode behavior introduces run-to-run variance.

## Tasks

| Task | Directory | Description | Core Challenge |
|------|-----------|-------------|----------------|
| **Resumable Sync** | `*/resumable-sync/` | Make a GitHub→SQLite sync script resumable after crashes | Picking the right checkpointing granularity |
| **Pluggable Widgets** | `*/pluggable-widgets/` | Make a React dashboard widget system pluggable | Deciding "pluggable for whom" (users vs developers) |

See [BENCHMARK.md](./BENCHMARK.md) for the full rubric and methodology.

## Results

### Total Scores (out of 80)

| Model | Task 1 (Sync) | Task 2 (Widgets) | **Total** | % |
|-------|---------------|------------------|-----------|---|
| **Qwen 3.6-27B-Q6K (unsloth)** | 35 / 40 | 34 / 40 | **69** | 86.25% |
| **Qwen 3.6-27B-8bit (Local)** | 31 / 40 | 35.5 / 40 | **66.5** | 83.1% |
| **Claude Sonnet 4.5** | 33 / 40 | 32 / 40 | **65** | 81.25% |
| **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** | 29 / 40 | 35 / 40 | **64** | 80% |
| **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** | 31 / 40 | 32 / 40 | **63** | 78.75% |
| **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** | 30 / 40 | 32 / 40 | **62** | 77.50% |
| **Qwen 3.6-27B-NVFP4 (unsloth)** | 30 / 40 | 31 / 40 | **61** | 76.25% |
| **Qwen 3.6-27B-4bit** | 26 / 40 | 33 / 40 | **59** | 73.75% |
| **Qwen 3.6-35B-A3B-4bit** | 31 / 40 | 28 / 40 | **59** | 73.75% |
| **Qwen 3.6-27B-AEON-NVFP4** | 27 / 40 | 30.5 / 40 | **57.5** | 71.88% |
| **Qwen 3.6-27B-4bit (OpenRouter)** | 26 / 40 | 28 / 40 | **54** | 67.50% |
| **[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** | 21 / 40 | 30 / 40 | **51** | 63.75% |
| **Agents A1 FP8** | 24 / 40 | 24 / 40 | **48** | 60.00% |
| **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** | 19 / 40 | 27 / 40 | **46** | 57.50% |

**Winner: Qwen 3.6-27B-Q6K (unsloth)** at 69/80 — highest sync score in the benchmark (35/40) combined with strong widget performance (34/40).  
Runner-up: **Qwen 3.6-27B-8bit (Local, unsloth)** at 66.5/80 — the previous leader, displaced by the Q6_K run.  
Third: **Claude Sonnet 4.5** at 65/80.  
Fourth: **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** at 64/80 — the same 35B-A3B architecture in FP8 quantization, run with agent-pair observer feedback.  
Fifth: **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** at 63/80 — NVIDIA's official FP4 quantization of Qwen 3.6-27B, run locally via vLLM.  
Sixth: **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** at 62/80 — a REAP-pruned 180B MoE running on a single DGX Spark.  
Seventh: **Qwen 3.6-27B-NVFP4 (unsloth)** at 61/80 — the same NVFP4 quantization of Qwen 3.6-27B run locally via unsloth rather than vLLM, scoring 2 points below the NVIDIA official build.  
Best cloud Qwen variants (tie): **Qwen 3.6-27B-4bit** and **Qwen 3.6-35B-A3B-4bit** at 59/80.  
**[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** at 51/80 — a 35B MoE model marketed for agentic coding, run locally via llama.cpp at Q8_0 quantization.  
**Agents A1 FP8** at 48/80 — per-issue checkpointing (not per-page) on the sync task and type/instance conflation on widgets place it 13th.  
Last: **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** at 46/80.

> **Note on Qwen 3.6-27B-Q6K (unsloth):** This is Qwen 3.6-27B in GGUF Q6_K quantization (~22 GB), run locally via the [unsloth](https://github.com/unslothai/unsloth) inference framework. It scores 69/80 — the highest total in the benchmark, driven by the top sync score across all fourteen models (35/40). Strengths: per-page checkpointing with a `max_commented_issue_id` high-water mark for efficient comment skip-on-resume (unique in the benchmark), perfect type/instance separation in widgets (`WidgetDefinition` vs `WidgetInstance` with a proper `instanceId`), and 4/4 frontend craft. Minor weaknesses: checkpoint written in a separate transaction from the page data commit (not atomic), silent ambiguity-handling on both tasks, no widget README documentation.

> **Note on why Q6K outscores the 8-bit unsloth run:** Q6_K quantization preserves slightly less precision than Q8_0/FP8, so a performance jump despite lower bit-depth is counterintuitive. The most likely explanation is a **chat template update**: the 8-bit run predates recent Unsloth updates to the Qwen3 chat template (thinking-mode delimiter handling, system prompt formatting, EOS token routing). A stale or mismatched chat template can silently degrade generation quality — corrupting how the model processes the system prompt, formats reasoning steps, and terminates responses — in ways that dwarf the ~2-bit quantization gap. A secondary possibility is run-to-run variance: agent-mode benchmarks have meaningful noise, and a single higher run at Q6K vs a single lower run at Q8_0 doesn't prove a systematic ranking. A controlled re-run of the 8-bit model with the current Unsloth template would resolve this.

> **Note on Qwen 3.6-35B-A3B-8bit (agent-pair):** This is the same Qwen 3.6-35B-A3B model in FP8 (8-bit) quantization, run locally with **agent-pair** mode — a pair-programming setup where an observer model reviews the coder's work in real-time and provides feedback. Both coder and observer are the same model (`Qwen3.6-35B-A3B-FP8`). The 8-bit quantization + observer feedback boosts the total from 59/80 (4-bit solo) to 64/80, primarily through a dramatically improved widget score (35 vs 28). The sync score drops slightly (29 vs 31) due to dead code and a commit ordering issue the observer flagged but was not fully addressed.

> **Note on the OpenRouter entry:** the run in `qwen3.6-27B-4bit-openrouter/` was originally mislabeled as "8-bit"; it is believed to be a 4-bit quantized model served via OpenRouter, based on scoring patterns and output style. The locally run unsloth 8-bit results are now tracked separately in `qwen3.6-27B-8bit/`.

> **Note on DeepSeek-V4-Flash-REAP-180B:** This is a [REAP-pruned](https://github.com/CerebrasResearch/reap) derivative of [DeepSeek-V4-Flash](https://huggingface.co/deepseek-ai/DeepSeek-V4-Flash), compressed from 641B to ~180B parameters via router-weighted expert activation pruning. It runs on a single NVIDIA DGX Spark. See the [model card](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B) for details.

> **Note on Qwen 3.6-27B-NVFP4:** This is [NVIDIA's official FP4 quantization](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4) of Qwen 3.6-27B, quantized with NVIDIA Model Optimizer and served via vLLM. It scores 63/80 — significantly above the community AEON-NVFP4 (57.5/80) and above the GGUF 4-bit quant (59/80), suggesting NVIDIA's NVFP4 format preserves more model quality than llama.cpp's Q4 quantization. Both tasks score 31-32/40 with correct architectural choices (per-page checkpointing, clean registry with type/instance separation) and full existing-code respect. Main weaknesses: transaction ordering bug on sync, CSS duplication on widgets, and silent ambiguity-handling throughout.

> **Note on Qwen 3.6-27B-NVFP4 (unsloth):** This is Qwen 3.6-27B in NVFP4 quantization run locally via the [unsloth](https://github.com/unslothai/unsloth) inference framework, as opposed to the NVIDIA official NVFP4 served via vLLM. It scores 61/80 — 2 points below the NVIDIA official build (63/80). Both use the same NVFP4 quantization format; the narrow gap (30 + 31 vs 31 + 32) is likely marginal per-run variance rather than a systematic inference-stack difference. Key weaknesses: transaction ordering bug on sync (checkpoint written after `conn.commit()`, not atomic), layout migration logic bug on widgets (always-false condition prevents new widget types from auto-appearing in existing layouts), and no documentation on either task.

> **Note on Qwen 3.6-27B-AEON-NVFP4:** This is "Qwen3.6-27B-AEON-Ultimate-Uncensored" — a community fine-tune of Qwen 3.6-27B — run locally in NVIDIA FP4 quantization. It scores 57.5/80, below the standard Qwen 3.6-27B-4bit (59/80), suggesting the uncensored fine-tune and aggressive FP4 quantization slightly degrade architectural reasoning compared to a vanilla 4-bit quant. Its widget implementation has a runtime-breaking typo and dead persistence code, but the core architecture (registry + type/instance split) is sound.

> **Note on Ornith-1.0-35B-8bit:** This is [DeepReinforce's Ornith-1.0-35B](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF), a 35B-parameter sparse MoE (architecture: `qwen35moe`) specifically post-trained for agentic coding via RL, run locally via llama.cpp at Q8_0 quantization (36.9 GB). Despite strong benchmark results on agentic coding benchmarks like Terminal-Bench 2.1 and SWE-Bench, it places 12th of 14 on this benchmark — a transaction ordering bug and comment-fetch scope regression on the sync task (21/40) and type/instance conflation on widgets (30/40) indicate that benchmark-optimized agentic coding skills don't automatically transfer to architectural judgment under ambiguity.

> **Note on Step-3.7-Flash IQ4_XS:** This is [StepFun's Step-3.7-Flash](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF), a 198B-parameter sparse MoE (activating ~11B per token) in IQ4_XS quantization (105 GB), run locally via llama.cpp. Despite being the largest model by total parameters in this benchmark, it scores last — the `since`-based conflation on the sync task (19/40) and shallow widget contract (27/40) suggest the small active parameter count (~11B) limits architectural reasoning depth.

> **Note on Agents A1 FP8:** Scores 48/80 (13th of 14), placing between Ornith (51/80) and Step (46/80). On the sync task (24/40), the model chose per-issue checkpointing — tracking `last_issue_id` and re-fetching all pages on resume rather than resuming at the right page — and included a vestigial `comments_fetched` field that is written but never read. On the widgets task (24/40), the registry pattern is clean but `WidgetInstance.id` conflates instance identity with widget type ID, meaning duplicate widget types cannot be placed on the dashboard and React key warnings would fire if attempted. Neither README was updated. Main weaknesses relative to the benchmark pack: wrong checkpoint granularity on sync, and the deepest type/instance conflation on widgets (alongside Qwen 3.6-35B-A3B-4bit).

---

## Task 1: Resumable Sync

### Score Breakdown

| Criterion | Max | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|-----------|-----|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|--------|
| Architectural judgment | 12 | 11 | 10 | 8 | 8 | 10 | 10 | 10 | 10 | 9 | 11 | 10 | 7 | 7 | 6 |
| Ambiguity-handling | 10 | 8 | 7 | 6 | 5 | 7 | 7 | 7 | 7 | 5 | 7 | 7 | 5 | 2 | 5 |
| Existing-code respect | 8 | 8 | 8 | 8 | 8 | 8 | 7 | 8 | 8 | 8 | 8 | 8 | 6 | 6 | 7.5 |
| Debugging / failure-mode | 6 | 4 | 3 | 2 | 3 | 3 | 3 | 3 | 3 | 3 | 4 | 3 | 2 | 3 | 3.5 |
| Code quality | 4 | 4 | 3 | 2 | 2 | 3 | 2 | 3 | 2 | 2 | 3 | 2 | 1 | 1 | 2 |
| **Total** | **40** | **35** | **31** | **26** | **26** | **31** | **29** | **31** | **30** | **27** | **33** | **30** | **21** | **19** | **24** |

### Architectural Approaches

| Aspect | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|--------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|--------|
| **State tables** | 1 table: `sync_checkpoints` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_progress` | 1 table: `sync_state` | 1 table: `sync_state` | 1 table: `checkpoints` | 1 table: `sync_state` | 2 tables: `sync_state` + `pending_comments` | 1 table: `sync_checkpoints` | 1 table: `sync_state` | 1 table: `sync_state` | 1 table: `sync_progress` |
| **Checkpoint granularity** | Per-page + `max_commented_issue_id` high-water mark | Per-page | Per-issue | Per-issue | Per-page | Per-page | Per-page | Per-page (with "back up one page" safety margin) | Per-page | Per-page (+ deferred comments checkpointing) | Per-page | Per-page | `since`-based (timestamp) | Per-issue (`last_issue_id`, re-fetches pages on resume) |
| **Comments handling** | High-water mark (`max_commented_issue_id`) — skips already-fetched comments on resume | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, dead `start_page` param (always 1) | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Inline fetch, no inner checkpoint | Deferred to separate pass with per-issue checkpoint | Inline fetch, no inner checkpoint (error-caught) | Inline fetch, no inner checkpoint (scope bug) | Inline fetch, try/except per issue | `comments_fetched` field written but never read; effectively no comment checkpoint |
| **Checkpoint/data transaction coupling** | Weak (separate commits) | Weak (separate commits) | Weak | Stronger (same commit path) | Weak (separate commits) | Weak (separate commits) | Weak (checkpoint after commit) | Weak (checkpoint written after commit, not atomic) | Weak (separate commits) | Medium (implicit/partially coupled) | Weak (separate commits) | Weak (progress saved after commit; last-repo never committed) | Weak (state lags one issue) | Weak (separate commits: page data first, progress second) |
| **CLI reset flag** | `--reset` | `--reset` | None | None | None | None | `--full` | None | `--fresh` | `--reset` | None | None | None | None |
| **README update** | Yes | Yes | No | No | Yes | No | No | No | No | Yes | No | No | No | No |

**Key differences**:
- **Q6K scores the highest on sync (35/40)** — correct per-page granularity, full marks on existing-code respect (8/8) and code quality (4/4), and a unique `max_commented_issue_id` high-water mark to efficiently skip already-fetched comments on resume. Updates the README. Minor deduction on transaction atomicity (checkpoint in separate commit from data) and not explicitly naming the per-page vs per-record tradeoff.
- Sonnet remains the only model that explicitly addresses nested-loop resumability in architecture, but Q6K's high-water mark is a practical middle ground that handles the same problem for most real-world repos.
- Local 8-bit and 35B-A3B-4bit both choose per-page granularity and both score 31/40 on this task.
- **35B-A3B-8bit (agent-pair)** also picks per-page granularity (29/40) — correct architecture but loses points on dead code (`total_pages` miscalculation, unused `start_page` parameter in `sync_comment_pages`) and no documentation. The observer feedback identified issues, but not all were addressed in the final version.
- **NVFP4** (NVIDIA's official Qwen 3.6-27B-NVFP4) picks per-page granularity (correct) and scores 31/40 — matching the local 8-bit. Full marks on existing-code respect (8/8), strong ambiguity-handling (7/10), and a `--full` flag for fresh starts. Loses points on transaction ordering (checkpoint written after commit) and no README update.
- **Unsloth-NVFP4** also picks per-page granularity (scoring 30/40) — 1 point below the NVIDIA official, with the same transaction ordering weakness. Adds a "back up one page" safety margin on resume (sensible) but no CLI reset flag and no README update. Code quality is 2/4 vs 3/4 for the NVIDIA build, accounting for the full gap.
- DeepSeek-V4-REAP-180B also picks per-page granularity (scoring 30/40), matching the right answer but losing points on documentation and transaction coupling.
- **AEON-NVFP4** picks per-page granularity (correct) and scores 27/40 — solid existing-code respect (8/8) but loses points on documentation (README unchanged) and silent ambiguity-handling.
- Both OpenRouter 27B variants converge on per-issue checkpointing, which is workable but heavier than needed.
- Local 8-bit adds a `--reset` flag and updates the README — matching Sonnet's operational completeness. AEON-NVFP4 adds `--fresh` but doesn't update docs.
- **Ornith-1.0-35B picks per-page granularity** (matching the stronger models) but undermines it with a transaction ordering bug — `save_progress` is called *after* `conn.commit()`, leaving the checkpoint in a separate implicit transaction. For the last repo, the progress is never durably stored. It also introduced a comment-fetch scope regression (comments fetched for PRs too, not just issues).
- **Step-3.7-Flash is the only model to conflate resumability with incremental sync** — using GitHub's `since` parameter rather than page-based checkpointing. The rubric explicitly flags this as a different feature ("incremental refresh, not crash recovery"). It also changed the sort order from `created` to `updated`, breaking the pagination stability the original code deliberately maintained.

### Strong/Weak Signals

| Signal | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
||--------|---------|-----------------|---------------|----------|----------------|---------------------|-------|------------|--------|-----------------|-----------------|----------------|--------|
|| State stored in `issues.db` (not JSON) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|| Per-repo cursors | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
|| State in same transaction as page commits | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
|| Notes per-page-vs-per-record tradeoff | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
|| Updates README | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Uses `since` (conflates with resumability) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ ⚠️ conflated | ❌ |

---

## Task 2: Pluggable Widgets

### Score Breakdown

| Criterion | Max | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|-----------|-----|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|--------|
| Architectural judgment | 14 | 13 | 13 | 11 | 11 | 10 | 13 | 12 | 11 | 13 | 13 | 10 | 9 | 9 | 10 |
| Ambiguity-handling | 10 | 7 | 8.5 | 5 | 8 | 5 | 7 | 7 | 7 | 7 | 6 | 8 | 8 | 6 | 7 |
| Existing-code respect | 8 | 7 | 7 | 7 | 7 | 8 | 8 | 8 | 8 | 5.5 | 7 | 7 | 7 | 7 | 5 |
| Frontend craft | 4 | 4 | 4 | 2 | 3 | 3 | 3.5 | 3 | 2 | 2 | 3 | 3 | 3 | 3 | 2 |
| Code quality | 4 | 3 | 3 | 3 | 4 | 2 | 3.5 | 2 | 3 | 3 | 3 | 4 | 3 | 2 | 3 |
| **Total** | **40** | **34** | **35.5** | **28** | **33** | **28** | **35** | **32** | **31** | **30.5** | **32** | **32** | **30** | **27** | **24** |

### Architectural Approaches

| Aspect | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|--------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|--------|
| **Widget contract** | `WidgetDefinition` interface + typed `GridSpan` (no generic settings) | `WidgetType` interface (no generic settings) | `WidgetDescriptor<TData>` generic | `WidgetDescriptor<T>` generic | `WidgetDef` (minimal, non-generic settings) | `WidgetPlugin<TData>` generic | `WidgetType` interface (no generic settings) | `WidgetMetadata` interface (no generic settings) | `WidgetType` interface (no generic settings) | `WidgetDefinition` (no generic) | `WidgetDefinition` (no generic settings) | `WidgetDef` (no generic settings) | `WidgetDefinition` (no generic, unused `pollInterval`) | `WidgetDefinition` (no generic settings, `render: () => React.ReactNode`) |
| **Registration pattern** | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Class + side-effect imports | Map registry + `registerWidget()` + side-effect imports | `WidgetRegistry` + `BUILTIN_WIDGETS` catalog | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Map registry + `registerWidget()` + side-effect imports | Class `WidgetRegistry` + side-effect imports | Plain object registry | Map registry + `defineWidget()` | Array registry (`widgetRegistry`) — no self-registration | Class `WidgetRegistry` + side-effect imports | `WidgetConfig` Map registry + `initBuiltIn()` call |
| **Type/instance split** | ✅ Perfect (`WidgetDefinition` vs `WidgetInstance` with `instanceId`) | ✅ Perfect | ✅ | ⚠️ Partial (type IDs used as instances) | ❌ Conflated | ✅ Perfect (`WidgetPlugin` vs `WidgetEntry`) | ✅ Perfect (`WidgetType` vs `PlacedWidget`) | ⚠️ Partial (instance `id` is type id; can't have duplicate widget types) | ✅ Perfect (`WidgetType` vs `LayoutEntry`) | ✅ | ⚠️ Partial (`activeIds` is `string[]` of type IDs) | ⚠️ Partial (no instance concept, no duplicates) | ⚠️ Partial (no duplicate widgets allowed) | ❌ Conflated (`WidgetInstance.id` is type ID; can't add duplicates; React key bug) |
| **Layout persistence** | localStorage (`dashboard-layout-v1`) | localStorage | In-memory only | localStorage (`dashboard-config`) | localStorage (`dashboard-layout`) | localStorage (`widget-layout-v1`) | localStorage (`dashboard-layout`) | localStorage (`dashboard-layout-v1`) | Dead code (exists but never wired up) | localStorage | localStorage (`dashboard-layout`) | localStorage (`ops-dashboard-layout`) | localStorage (`dashboard-config`) | localStorage (`dashboard_widget_config`, no versioning, starts empty) |
| **Widget refactoring strategy** | Consistent (body content only, subtitles removed, all 5) | Minimal (body content only, all 5 consistent) | Rewrote all 5 widgets | Rewrote all 5 widgets consistently | Kept existing widgets mostly unchanged | Consistent (pure render + registration, all 5) | Left widgets byte-for-byte identical | Minimal (added `registerWidget()` call only, all 5 consistent, otherwise unchanged) | Consistent (component + config + register, all 5) | Left widgets byte-for-byte identical | Consolidated all 5 into `widgets.tsx` | Minimal (CSS class suffix only, all 5 consistent) | Appended `widgetDefinition` export to each (minimal) | Consistent (outer wrapper div removed from all 5) |
| **Adding 6th widget** | 2-3 files (widget + App.tsx import) | 2 files | 2-3 files | 1-2 files | 1 file | 2 files | 2 files | 2 files | 2 files | 2 files | 1 file (`defineWidget()` call) | 2 files (widget + registry entry) | 2 files (widget + registry import) | 2 files (new widget file + register in `initBuiltIn()`) |
| **Documentation** | None (README unchanged) | None | None | Minimal (mostly code-level) | Minimal | None | None (README unchanged) | None (README unchanged) | None | `WIDGET_GUIDE.md` + `EXAMPLE_NEW_WIDGET.md` | Good README with architecture + guide | None (README unchanged) | None (README unchanged) | None (README unchanged) |

**Key differences**:
- **Qwen 3.6-27B-Q6K (unsloth)** scores 34/40 on widgets — second only to 27B-8bit (35.5) and 35B-A3B-8bit pair (35). Perfect `WidgetDefinition`/`WidgetInstance` type separation with a proper `instanceId`, full frontend craft marks (4/4), versioned localStorage key (`dashboard-layout-v1`), and consistent minimal widget refactoring (body content only). Held back by silent ambiguity-handling (7/10) and no widget README documentation. Lost widget subtitles from the original headers, replacing them with a drag-handle toolbar.
- **Qwen 3.6-27B-8bit (Local)** is the strongest on widgets overall (35.5/40): perfect type/instance separation, zero frontend bugs, full marks on frontend craft, and strong ambiguity-handling.
- **Qwen 3.6-35B-A3B-8bit (agent-pair)** is the runner-up on widgets (35/40) — near-identical architecture to the 27B-8bit with a generic `WidgetPlugin<TData>` contract, perfect type/instance split, and versioned localStorage key (`widget-layout-v1`). A massive improvement over its 4-bit solo run (28/40), suggesting observer feedback significantly improved architectural quality. Full marks on existing-code respect (8/8).
- **Qwen 3.6-27B-4bit** is the strongest cloud Qwen on widgets (33/40), with better ambiguity-handling and cleaner extensibility mechanics.
- **DeepSeek-V4-REAP-180B** ties with Sonnet on widgets (32/40), with the best code quality score (4/4) and strong ambiguity-handling (8/10), but partially conflates type/instance like some Qwen variants.
- **NVFP4** (NVIDIA official) scores 32/40 on widgets — tied with Sonnet and DeepSeek. Clean registry with perfect type/instance separation (`WidgetType` vs `PlacedWidget`), full existing-code respect (8/8, widgets unchanged), and working localStorage persistence. Loses points on no settings abstraction, CSS duplication, and silent ambiguity-handling.
- **Unsloth-NVFP4** scores 31/40 on widgets — 1 point below the NVIDIA official. Clean registry with `WidgetMetadata`, versioned localStorage key (`dashboard-layout-v1`), and minimal consistent widget refactoring (just a `registerWidget()` call added to each). Partial type/instance split (instance `id` stores type id, no duplicate widget types allowed). Main bug: layout migration condition is always false, preventing new widget types from appearing in existing saved layouts.
- **AEON-NVFP4** scores 30.5/40 on widgets — strong architectural judgment (13/14, matching the 8-bit) with perfect type/instance separation, but loses points on dead persistence code and a runtime-breaking typo (`setSets` instead of `setServices`).
- **Qwen 3.6-35B-A3B-4bit** preserves existing code best but under-specifies type-vs-instance modeling.
- Sonnet remains strongest in documentation quality, though DeepSeek's README is also notably good.
- **Ornith-1.0-35B** scores 30/40 on widgets — solid ambiguity-handling (8/10, tied for second-best) and clean code quality (3/4), but the same type/instance conflation as several other models. Minimal widget refactoring (CSS class suffix only) shows good existing-code respect. Minor React issues: ineffective `useMemo`, palette positioning, toggle/click-outside conflict.
- **Step-3.7-Flash** scores lowest (27/40) on widgets. Its registry pattern is clean, but the widget contract is shallow (`pollInterval` declared but never consumed by the framework), and the README was not updated.
- **Agents A1 FP8** scores 24/40 on widgets. The `WidgetConfig` registry is clean and centralized, but `WidgetInstance.id` conflates instance identity with widget type ID — the deepest type/instance conflation in the benchmark alongside Qwen 3.6-35B-A3B-4bit. This means duplicate widget types cannot be placed and React would fire key warnings. Layout starts with an empty dashboard (no default widgets). The refactoring of all 5 widgets is consistent but loses original column-span fidelity (7-col and 5-col placements replaced by a 2-tier "normal/wide" system). `React.createElement(widgetDef.render)` is an unusual pattern that should be `<widgetDef.render />`.

### Frontend Issues Found

| Issue | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|-------|---------|-----------------|---------------|----------|----------------|---------------------|-------|------------|--------|-----------------|-----------------|----------------|--------|
| Conditional hook call (Rules of Hooks violation) | — | — | ❌ Bug | — | — | — | — | — | — | — | — | — | — | — |
| Incorrect drag event (`onDrag` vs `onDrop`) | — | — | ❌ Bug | — | — | — | — | — | — | — | — | — | — | — |
| Runtime-breaking typo (`setSets` vs `setServices`) | — | — | — | — | — | — | — | — | ❌ Bug | — | — | — | — | — |
| Type-vs-instance conflation risk | — | — | — | ⚠️ Partial | ❌ Clear gap | — | — | ⚠️ Partial (instance id = type id; no duplicate widget types) | — | ⚠️ Partial (no duplicate widgets) | ⚠️ Partial (no instance concept) | ⚠️ Partial (no duplicates) | ❌ Clear gap (instanceId = typeId; React key bug) |
| Dead persistence code (exists but unused) | — | — | — | — | — | — | — | — | ⚠️ Tech debt | — | — | — | — | — |
| Dead code (`\|\| true`, `&& false`) | — | — | — | — | — | — | — | — | — | ⚠️ Sloppy | — | — | — | — |
| CSS duplication (duplicate class definitions) | — | — | — | — | — | — | — | ⚠️ Sloppy | — | — | — | — | — | — |
| Unused contract fields (`pollInterval` dead weight) | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor | — |
| Ineffective `useMemo` / palette positioning | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor | — | — |
| `React.createElement(fn)` instead of component type | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ Minor |
| Layout migration logic bug (always-false condition) | — | — | — | — | — | — | — | ⚠️ Bug | — | — | — | — | — | — |
| Lost widget subtitles in header refresh | ⚠️ Minor | — | — | — | — | — | — | — | — | — | — | — | — | — |
| No default widgets (starts empty) | — | — | — | — | — | — | — | — | — | — | — | — | — | ⚠️ UX gap |

---

## Analysis by Criterion

### Where Q6K Won

1. **Best aggregate score (69/80)**: Highest sync score in the benchmark (35/40) combined with strong widget performance (34/40).
2. **Best sync score overall**: 35/40 — tops even Sonnet (33/40). Correct per-page checkpoint granularity, `--reset` flag, README update, and a unique `max_commented_issue_id` high-water mark that allows efficient skip-on-resume for comments without a full inner checkpoint loop.
3. **Perfect widget type/instance separation**: `WidgetDefinition` vs `WidgetInstance` with a proper `instanceId`, supporting multiple instances of the same widget type.
4. **Top frontend craft (4/4)**: No hook violations, no drag event bugs, proper `useCallback` stability, correct `useEffect` cleanup.

### Where Local 8-bit Won

1. **Best widget score (35.5/40)**: The only model that edges Q6K on widgets — 0.5 points ahead due to stronger ambiguity-handling (8.5 vs 7 on that criterion).
2. **Widget architecture**: Perfect `WidgetType`/`WidgetInstance` separation, self-registering pattern, zero frontend bugs (4/4 frontend craft).
3. **Per-page checkpointing + operational completeness**: Correct checkpoint granularity, `--reset` flag, and README documentation.
4. **No frontend bugs**: Clean frontend craft — no hook violations, no drag event errors.

### Where Sonnet Was Competitive

1. **Best sync score (33/40)**: Sonnet is still the strongest on the sync task specifically.
2. **Nested-loop resumability**: Sonnet remains the only implementation that explicitly handles the comments subloop with dedicated architecture.
3. **Documentation quality**: Sonnet produces the richest documentation (`WIDGET_GUIDE.md`, `EXAMPLE_NEW_WIDGET.md`).
4. **Consistency**: Strong in both tasks; no large architectural misses.

### Where DeepSeek Was Competitive

1. **Fifth overall (62/80)**: Slots in between NVFP4 (63) and the Qwen 4-bit variants (59), despite being a pruned model running on a single DGX Spark.
2. **Widget code quality (4/4)**: Only model to score full marks on code quality for widgets — excellent README with architecture diagram and "Adding a new widget" guide.
3. **Widget ambiguity-handling (8/10)**: Tied with Qwen 27B-4bit for the second-best ambiguity score on widgets; silently addressed both user and developer extensibility.
4. **Existing-code style match**: The sync implementation reads like it was written by the original author — matching logging idioms, naming, and function patterns precisely.
5. **Defensive error handling**: Added try/except around individual issue and comment processing in the sync task — a pragmatic robustness improvement not strictly asked for.

### Where 35B-A3B-8bit (Agent-Pair) Was Competitive

1. **Second-best widget score (35/40)**: Only 0.5 points behind 27B-8bit, with the same perfect type/instance separation and generic `WidgetPlugin<TData>` contract.
2. **Agent-pair uplift**: The observer feedback pushed the widget score from 28 (4-bit solo) to 35 — a +7 point improvement on the same architecture, demonstrating that iterative review catches structural gaps that a solo run misses.
3. **Full marks on existing-code respect (8/8 widgets)**: Consistent refactoring of all 5 widgets into pure render functions with registration calls, matching the design language.
4. **Versioned localStorage key**: The `widget-layout-v1` key suggests awareness of future migration needs — a small but telling detail.

### Where Each Other Variant Stood Out

1. **Qwen 3.6-27B-NVFP4**: Best overall among "vanilla" 4-bit quantizations (63/80). Most balanced scorer — 31 sync + 32 widgets with no severe bugs. Demonstrates that NVIDIA's official NVFP4 quantization pipeline preserves more model quality than GGUF Q4 formats.
2. **Qwen 3.6-27B-NVFP4 (unsloth)**: 61/80 using the same NVFP4 format but via unsloth inference rather than vLLM. Correct per-page checkpointing and clean registry pattern on both tasks; held back by a transaction ordering bug (sync) and always-false migration condition (widgets). The 2-point gap vs NVIDIA official likely reflects per-run variance rather than a meaningful inference-stack difference.
3. **Qwen 3.6-27B-4bit (OpenRouter)**: Weaker overall, but used a generic widget descriptor (`WidgetDescriptor<TData>`).
4. **Qwen 3.6-27B-4bit**: Strongest cloud Qwen on widgets (33/40), with cleaner extensibility and good ambiguity-handling.
5. **Qwen 3.6-35B-A3B-4bit**: Strongest cloud Qwen on sync (31/40), choosing per-page checkpointing and keeping changes surgical.
6. **Qwen 3.6-27B-AEON-NVFP4**: Highest widget architecture score (13/14, tied with 8-bit and 35B-A3B-8bit pair) among community fine-tunes; perfect type/instance separation. Dragged down by dead persistence code, a runtime typo, and lack of documentation.
7. **Shared Qwen strengths**: All variants keep state in SQLite and preserve existing code paths well.

### Where Ornith-1.0-35B Fell Short

1. **Transaction ordering bug undermines the sync checkpoint** — `save_progress` is called *after* `conn.commit()`, so the checkpoint lives in a separate implicit transaction. For the last repo in config, `mark_completed` is never durably committed (`conn.close()` rolls it back).
2. **Comment-fetch scope regression** — refactoring moved the comment-fetch `if` block outside the `upsert_issue` guard, causing comments to be fetched for PRs too. Produces orphaned comment records and wastes API calls.
3. **Misleading docstring** — `save_progress` claims "Called inside the same txn" but this is factually false after the ordering change.
4. **Widget score (30/40) is decent** — strong ambiguity-handling (8/10) and good code quality (3/4), but the same type/instance conflation as most non-Qwen-8bit models, and metadata duplication between the registry and widget-internal headers.
5. **No documentation on either task** — README unchanged for both sync and widgets, no design rationale anywhere.

### Where Step-3.7-Flash Fell Short

1. **Conflated resumability with incremental sync** (only model to do so) — the `since`-based approach doesn't solve crash recovery well.
2. **Broke existing invariants** — changed sort order from `created` to `updated`, undermining pagination stability the original code deliberately maintained.
3. **No documentation at all** — README unchanged on both tasks, no design rationale anywhere.
4. **Shallow widget contract** — `pollInterval` declared but never consumed; no settings abstraction.

### Where Agents A1 FP8 Fell Short

1. **Per-issue checkpointing instead of per-page** — the model tracked `last_issue_id` and skips issues client-side on resume. This means a crash on page 100 of 200 still re-fetches all 100 previous pages from GitHub on restart. Every other model that got the checkpoint granularity wrong (27B-4bit, 27B-4bit-OR) made the same mistake, but it remains the primary sync weakness.
2. **Vestigial `comments_fetched` field** — written after every page of issues but never read in any resume logic. The dead code in `skip_already_synced()` that references it (a branch that does nothing) suggests the model started designing nested-loop checkpointing but abandoned it without cleaning up.
3. **Type/instance conflation in widgets** — `WidgetInstance.id` stores the widget *type* ID, not a unique instance identifier. Duplicate widget types cannot be placed on the dashboard, and React key warnings would fire if they were. This is the sharpest manifestation of type/instance conflation in the benchmark, tied only with Qwen 3.6-35B-A3B-4bit.
4. **Dashboard starts empty** — `loadFromStorage()` returns `[]` as the default, so users who haven't configured the dashboard before see "No widgets added yet" — a UX regression from the original static layout.
5. **No documentation on either task** — neither README was updated, no design rationale anywhere.

### Where All Failed

- **Ambiguity naming is still weak overall**: all models tended to silently pick a branch rather than explicitly framing the tradeoff.
- **Clarifying questions were rare**: none consistently asked high-value, scope-shaping questions.
- **Transactional reasoning is often implicit**: explicit partial-failure discussion is limited in most runs.
- **Widget settings contracts remain shallow**: none delivered a full per-instance settings abstraction end-to-end.
- **Benchmark-optimized agentic coding ≠ architectural judgment**: Ornith-1.0-35B, specifically RL-trained for agentic coding and claiming state-of-the-art on Terminal-Bench 2.1 and SWE-Bench, places 12th of 14 here (51/80). Its transaction ordering bug and comment-fetch regression on the sync task suggest that SWE-Bench-style patch generation doesn't test the same skills as underspecified, ambiguity-heavy design tasks.
- **Step-3.7-Flash underperformance suggests total parameter count ≠ coding skill**: with 198B total but only ~11B active per token, it scored below all 27B dense models (including both NVFP4 variants), reinforcing that active compute matters more than parameter catalog size for architectural reasoning.
- **Agent-pair mode improves execution quality**: The 35B-A3B-8bit agent-pair run (64/80) outperforms the same model's 4-bit solo run (59/80) by +5 points — observer feedback catches structural issues that a solo coding pass misses, particularly on type/instance modeling and widget architecture.

---

## Qualitative Summary

| Dimension | 27B-Q6K | 27B-8bit (local) | 27B-4bit (OR) | 27B-4bit | 35B-A3B-4bit | 35B-A3B-8bit (pair) | NVFP4 | Unsloth-NVFP4 | AEON-NVFP4 | Sonnet 4.5 | DS-V4-REAP-180B | Ornith-35B-8bit | Step-3.7-Flash | A1-FP8 |
|-----------|---------|------------------|---------------|----------|--------------|---------------------|-------|------------|------------|-----------------|-----------------|----------------|--------|
| Engineering execution | Strong on both; best sync score | Strong on both | Solid baseline | Strong on widgets | Strong on sync | Strong on widgets, solid on sync | Strong on both | Solid on both; transaction bug and migration logic bug | Solid architecture, sloppy edges | Most balanced | Solid on both | Decent on widgets, weak on sync | Weak on sync, decent on widgets | Weak on sync (wrong granularity), weak on widgets (type/instance bug) |
| Architectural ambition | Higher/clean | Higher/clean | Higher/invasive | Higher/invasive but cleaner | Moderate/conservative | Higher/clean | Higher/clean | Higher/clean | Higher/clean but unfinished | Conservative/comprehensive | Moderate/clean | Moderate/clean | Moderate/shallow | Moderate/incomplete |
| Reasoning transparency | Mostly silent | Mostly silent | Silent | Mostly silent | Mostly silent | Mostly silent | Mostly silent | Mostly silent | Silent | Slightly better | Mostly silent | Silent | Silent | Silent |
| Edge-case handling | High-water mark for comments (novel); no UI bugs; txn not atomic | Missed comments subloop; no UI bugs | Missed nested loop + UI bugs | Better frontend discipline | Better sync failure boundaries | Missed comments subloop; dead start_page param; no UI bugs | Missed comments subloop; txn ordering bug; no UI bugs | Missed comments subloop; txn ordering bug; layout migration logic bug | Missed comments subloop; runtime typo | Best nested-loop handling | Missed comments subloop; good defensive error handling | Txn ordering bug; comment-fetch scope regression; minor UI issues | Conflated sync concerns; broke sort order | Per-issue instead of per-page; vestigial comments_fetched; type/instance conflation; empty default dashboard |
| Documentation | Updated sync README; widget README unchanged | Updated sync README | Skipped | Minimal | Updated sync README | Skipped | Skipped | Skipped | Skipped | Strongest overall | No sync README; excellent widget README | Skipped | Skipped | Skipped |
| Bug/sloppiness profile | Checkpoint in separate txn (minor); lost widget subtitles | None | 2 frontend bugs | Minor hook/pattern risks | Instance-model gaps | Dead code paths (total_pages, start_page) | Txn ordering bug; CSS duplication | Txn ordering bug; layout migration logic bug (always-false condition) | Runtime typo; dead persistence code | Minor dead-code sloppiness | Type/instance partial conflation | Txn bug + scope regression on sync; type/instance partial on widgets | Sort-order regression; unused contract fields | Per-issue checkpoint (inefficient); dead comments_fetched; type/instance conflation; empty-dashboard UX regression |
| **Would merge PR?** | Yes | Yes | Maybe (fixes needed) | Yes, with minor notes | Yes, with minor notes | Sync: Yes (with fixes); Widgets: Yes | Yes, with minor notes | Yes, with fixes (transaction bug on sync; migration bug on widgets) | Yes, with fixes needed | Yes | Yes, with minor notes | Sync: No; Widgets: Yes (with notes) | Sync: No; Widgets: Yes (with fixes) | Sync: Reluctantly yes (significant rework needed); Widgets: No (type/instance bug) |

---

## Directory Structure

```
A-vs-B/
├── BENCHMARK.md                  # Full rubric and methodology
├── README.md                     # This file
├── original/                     # Starting codebases
│   ├── resumable-sync/
│   └── pluggable-widgets/
├── qwen3.6-27B-8bit/             # Qwen 27B 8-bit local (unsloth) — highest score
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit-openrouter/  # Qwen 27B via OpenRouter (was mislabeled as 8-bit)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27B-4bit/             # Qwen 27B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-35B-A3B-4bit/         # Qwen 35B-A3B 4-bit implementations
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── agent-pair-qwen3.6-35B-A3B-8bit/  # Qwen 35B-A3B FP8 (agent-pair mode)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── nvidia-qwen3.6-27b-nvfp4/        # NVIDIA official Qwen3.6-27B-NVFP4
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── qwen3.6-27b-aeon-ultimate-uncensored-nvfp4/  # AEON fine-tune, NVIDIA FP4
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── claude-sonnet-4.5/            # Sonnet's implementations
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── deepseek-4-flash-reap-180b/   # DeepSeek-V4-Flash-REAP-180B (pruned 180B MoE)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── ornith-1.0-35b-8bit/           # Ornith-1.0-35B Q8_0 (35B MoE, agentic coding RL)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
└── step-3.7-flash-IQ4_XS/        # Step-3.7-Flash IQ4_XS (198B MoE, ~11B active)
    ├── resumable-sync/
    ├── pluggable-widgets/
    ├── review-resumable-sync.md
    └── review-pluggable-widgets.md
├── agents-a1-fp8/                # Agents A1 FP8 — per-issue checkpoint, type/instance conflation
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── unsloth-qwen3.6-27b-nvfp4/   # Qwen 3.6-27B NVFP4 via unsloth — txn bug, migration logic bug
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
├── unsloth-qwen3.6-27b-q6_k/   # Qwen 3.6-27B Q6_K via unsloth — NEW #1 (69/80)
│   ├── resumable-sync/
│   ├── pluggable-widgets/
│   ├── review-resumable-sync.md
│   └── review-pluggable-widgets.md
```

---

## Bottom Line

**Qwen 3.6-27B-Q6K (unsloth) wins overall (69/80).**

Ranking:
1. **Qwen 3.6-27B-Q6K (unsloth)** - 69/80
2. **Qwen 3.6-27B-8bit (Local)** - 66.5/80
3. **Claude Sonnet 4.5** - 65/80
4. **Qwen 3.6-35B-A3B-8bit (Local, agent-pair)** - 64/80
5. **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** - 63/80
6. **[DeepSeek-V4-Flash-REAP-180B](https://huggingface.co/0xSero/DeepSeek-V4-Flash-180B)** - 62/80
7. **Qwen 3.6-27B-NVFP4 (unsloth)** - 61/80
8. **Qwen 3.6-27B-4bit** - 59/80 (tie)
8. **Qwen 3.6-35B-A3B-4bit** - 59/80 (tie)
10. **Qwen 3.6-27B-AEON-NVFP4** - 57.5/80
11. **Qwen 3.6-27B-4bit (OpenRouter)** - 54/80
12. **[Ornith-1.0-35B-8bit](https://huggingface.co/deepreinforce-ai/Ornith-1.0-35B-GGUF)** - 51/80
13. **Agents A1 FP8** - 48/80
14. **[Step-3.7-Flash IQ4_XS](https://huggingface.co/stepfun-ai/Step-3.7-Flash-GGUF)** - 46/80

Most important patterns:
- **Qwen 3.6-27B-Q6K (unsloth) is the new top scorer (69/80)**, posting the highest sync score in the entire benchmark (35/40) despite Q6_K being lower bit-depth than the previous #1 (Q8_0/8-bit). The Q6K run also scores 34/40 on widgets with perfect type/instance separation and 4/4 frontend craft. The most plausible explanation for Q6K beating the 8-bit run is a **chat template update**: Unsloth has issued multiple Qwen3 template revisions since the 8-bit run, and a stale chat template can silently degrade output quality well beyond the 2-bit quantization gap. A controlled re-run of the 8-bit model with the current template would clarify whether this is a template effect or genuine run variance.
- The locally run unsloth 8-bit model still outperforms all cloud/API variants — including Claude Sonnet 4.5 — driven by a near-perfect widget score (35.5/40) and solid sync performance (31/40).
- **Qwen 3.6-35B-A3B-8bit (agent-pair)** places third (64/80), up from 59/80 for the same architecture at 4-bit without observer feedback. The improvement is almost entirely on widgets (+7 points), where observer feedback helped achieve perfect type/instance separation and a generic `WidgetPlugin<TData>` contract. The sync score dropped slightly (29 vs 31) due to dead code the observer flagged but was not fully cleaned up.
- **[Qwen 3.6-27B-NVFP4](https://huggingface.co/nvidia/Qwen3.6-27B-NVFP4)** places fourth (63/80) — NVIDIA's official FP4 quantization of Qwen 3.6-27B, served via vLLM. It outperforms both the GGUF 4-bit quant (59/80) and the AEON community fine-tune at NVFP4 (57.5/80), suggesting the official NVIDIA quantization pipeline preserves more model quality. Balanced across tasks (31 + 32) with correct architectural choices on both, but loses points on transaction ordering (sync) and CSS sloppiness (widgets).
- **DeepSeek-V4-Flash-REAP-180B** places fifth despite being a REAP-pruned 180B MoE model running on a single DGX Spark. It ties Sonnet on widgets (32/40) with the best code quality score there, and nearly matches the per-page checkpoint leaders on sync (30/40). Its main gaps are documentation on the sync side and type/instance modeling on widgets.
- **Qwen 3.6-27B-NVFP4 (unsloth)** places sixth (61/80), 2 points below the NVIDIA official NVFP4 build (63/80) using the same quantization format but a different inference stack. The architectural choices are correct on both tasks — per-page checkpoint granularity (sync) and clean registry with side-effect self-registration (widgets) — and existing-code respect is perfect on both. Main weaknesses: transaction ordering bug on sync (checkpoint written after `conn.commit()`, not atomic), a layout migration logic bug on widgets (always-false condition prevents new widget types from auto-appearing in existing layouts), and no documentation on either task.
- The two cloud 4-bit Qwen variants tie on total score, but for different reasons:
  - **27B-4bit** wins on widgets (higher ambiguity-handling + cleaner extensibility flow).
  - **35B-A3B-4bit** wins on sync (better checkpoint granularity and safer architecture).
- **Qwen 3.6-27B-AEON-NVFP4** (57.5/80) demonstrates that uncensored fine-tunes degrade coding performance — the same NVFP4 quantization format scores 63/80 with the vanilla base model. Its widget architecture is excellent (13/14) with perfect type/instance separation, but execution flaws (runtime typo, dead code) and missing documentation pull the overall score well below the official NVFP4 (63) and the standard 27B-4bit (59).
- **Ornith-1.0-35B-8bit** places 12th (51/80) despite being specifically RL-trained for agentic coding and claiming state-of-the-art results on Terminal-Bench 2.1, SWE-Bench, and NL2Repo. The sync task (21/40) is its main weakness — correct per-page granularity choice is undermined by a transaction ordering bug (`save_progress` after `conn.commit()`) and a comment-fetch scope regression. The widget task (30/40) is more competitive, with strong ambiguity-handling (8/10) and clean code quality, but the same type/instance conflation seen in most models. This gap between SWE-Bench-style performance and architectural-judgment benchmarks suggests these evaluate different skills.
- **Step-3.7-Flash IQ4_XS** scores last (46/80) despite being the largest model by total parameters (198B). Its ~11B active parameter count per token appears insufficient for the architectural reasoning these tasks demand. The sync task is particularly weak (19/40) — it's the only model that conflated crash-recovery resumability with incremental sync via GitHub's `since` parameter, and it broke the existing sort-order invariant. The widget task (27/40) is more respectable, with a clean registry pattern, but the contract is shallow and undocumented.
- **Agents A1 FP8** scores 48/80 (13th of 14), above only Step-3.7-Flash. On sync (24/40), it chose per-issue checkpointing — tracking `last_issue_id` and filtering client-side rather than resuming at the correct page — which produces redundant API calls on restart. The vestigial `comments_fetched` field suggests the nested-loop problem was considered but not resolved. On widgets (24/40), the `WidgetConfig` registry is well-structured but `WidgetInstance.id` carries the widget type ID rather than a unique instance key, making it impossible to place two of the same widget type. Both READMEs were left unchanged.
- The previously reported "Qwen 3.6-27B-8bit" entry was likely a 4-bit OpenRouter quantization; see the `qwen3.6-27B-4bit-openrouter/` directory.

Across all fourteen models, explicit ambiguity-resolution remains the hardest benchmark bar; most implementations still pick a path and code it without clearly naming tradeoffs.
