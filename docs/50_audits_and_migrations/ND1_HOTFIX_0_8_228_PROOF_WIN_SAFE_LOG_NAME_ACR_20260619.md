# ND-1 Hotfix 0.8.228 ACR — PROOF_WIN safe log names

- Analyze: The generated Windows prooflauncher used `-replace '[:/\]','_'`, which is an invalid .NET regex character class.
- Critique: The launcher continued running, but every proof row emitted `InvalidOperation`, damaging operator confidence and risking bad log paths.
- Refine: Add a regression proof that rejects the invalid regex and requires a literal `.Replace(':','_').Replace('/','_').Replace('\\','_')` chain or correctly escaped regex.
