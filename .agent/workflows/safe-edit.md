---
description: Safe code editing with guaranteed revert capability (3 commits back)
---

# Safe Code Editing Workflow

## Before EVERY Code Edit

// turbo-all

### 1. Git commit the current state BEFORE editing
```
git add -A && git commit -m "snapshot: before [description of planned change]"
```

### 2. Copy backup of the file being edited
```
Copy-Item "[file-path]" "[file-path].backup.tsx"
```

### 3. Make the edit

Only change what the user asked. Do NOT change anything else.

### 4. Git commit AFTER the edit
```
git add -A && git commit -m "feat/fix: [description of what changed]"
```

### 5. Deploy
```
npx eas-cli update --branch preview --message "[description]" --non-interactive
```

## Reverting Code

### To revert to the last commit:
```
git checkout HEAD~1 -- [file-path]
```

### To revert to 2 commits ago:
```
git checkout HEAD~2 -- [file-path]
```

### To revert to 3 commits ago:
```
git checkout HEAD~3 -- [file-path]
```

### To see the last 5 commits for a file:
```
git log --oneline -5 -- [file-path]
```

### To see the exact content of a file at a specific commit:
```
git show [commit-hash]:[relative-file-path]
```

### To restore from backup:
```
Copy-Item "[file-path].backup.tsx" "[file-path]"
```

## Rules

1. **NEVER change code the user didn't ask to change**
2. **ALWAYS commit before and after edits** — this creates the revert points
3. **ALWAYS save a .backup copy** of the file before editing
4. **ALWAYS tell the user what you plan to do before doing it**
5. **ALWAYS use `git show` to verify exact code** — never guess from memory
6. **When reverting, use git checkout** — never reconstruct code from memory
