'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input, Tabs, Tag, Tooltip, message, Empty, Badge } from 'antd';
import {
  SearchOutlined,
  CopyOutlined,
  StarOutlined,
  StarFilled,
  BranchesOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const PRIMARY = '#50C878';
const LS_KEY = 'toolhub_git_favorites';

// ── Data ──────────────────────────────────────────────────────────────────────
export interface GitCommand {
  id: string;
  category: string;
  command: string;
  description: string;
  example: string;
  flags?: string;
}

const GIT_COMMANDS: GitCommand[] = [
  // Setup
  { id: 'setup-1', category: 'Setup', command: 'git config --global user.name "[name]"', description: 'Set the name attached to all your commits', example: 'git config --global user.name "John Doe"' },
  { id: 'setup-2', category: 'Setup', command: 'git config --global user.email "[email]"', description: 'Set the email attached to all your commits', example: 'git config --global user.email "john@example.com"' },
  { id: 'setup-3', category: 'Setup', command: 'git config --global color.ui auto', description: 'Enable colorization of command line output', example: 'git config --global color.ui auto' },
  { id: 'setup-4', category: 'Setup', command: 'git config --list', description: 'List all configuration settings currently active', example: 'git config --list --show-origin' },
  { id: 'setup-5', category: 'Setup', command: 'git config --global core.editor "[editor]"', description: 'Set the default text editor for commit messages', example: 'git config --global core.editor "code --wait"' },
  { id: 'setup-6', category: 'Setup', command: 'git config --global alias.[alias] "[command]"', description: 'Create a shortcut alias for a git command', example: 'git config --global alias.st status' },

  // Basic
  { id: 'basic-1', category: 'Basic', command: 'git init', description: 'Initialize a new local Git repository in current directory', example: 'git init my-project' },
  { id: 'basic-2', category: 'Basic', command: 'git clone [url]', description: 'Download a repository and its full history', example: 'git clone https://github.com/user/repo.git' },
  { id: 'basic-3', category: 'Basic', command: 'git status', description: 'Show which files are staged, unstaged, and untracked', example: 'git status -s' },
  { id: 'basic-4', category: 'Basic', command: 'git add [file]', description: 'Stage a file for the next commit', example: 'git add src/index.ts' },
  { id: 'basic-5', category: 'Basic', command: 'git add .', description: 'Stage all new and modified files in the working directory', example: 'git add .' },
  { id: 'basic-6', category: 'Basic', command: 'git add -p', description: 'Interactively stage hunks of a file', example: 'git add -p src/app.ts' },
  { id: 'basic-7', category: 'Basic', command: 'git commit -m "[message]"', description: 'Snapshot staged changes with a descriptive message', example: 'git commit -m "feat: add login page"' },
  { id: 'basic-8', category: 'Basic', command: 'git commit --amend', description: 'Replace the last commit with current staged changes', example: 'git commit --amend --no-edit' },
  { id: 'basic-9', category: 'Basic', command: 'git diff', description: 'Show changes in the working directory not yet staged', example: 'git diff HEAD~1 HEAD' },
  { id: 'basic-10', category: 'Basic', command: 'git diff --staged', description: 'Show staged changes that will go into the next commit', example: 'git diff --staged' },
  { id: 'basic-11', category: 'Basic', command: 'git log', description: 'Show the commit history for the current branch', example: 'git log --oneline --graph --all' },
  { id: 'basic-12', category: 'Basic', command: 'git show [commit]', description: 'Display metadata and content changes of a commit', example: 'git show a1b2c3d' },
  { id: 'basic-13', category: 'Basic', command: 'git rm [file]', description: 'Delete file from working directory and stage the removal', example: 'git rm dist/bundle.js' },
  { id: 'basic-14', category: 'Basic', command: 'git mv [old] [new]', description: 'Rename or move a file and stage the change', example: 'git mv old-name.ts new-name.ts' },

  // Branching
  { id: 'branch-1', category: 'Branching', command: 'git branch', description: 'List all local branches; current branch is marked with *', example: 'git branch -a' },
  { id: 'branch-2', category: 'Branching', command: 'git branch [name]', description: 'Create a new branch at the current HEAD', example: 'git branch feature/login' },
  { id: 'branch-3', category: 'Branching', command: 'git checkout [branch]', description: 'Switch to the specified branch and update working directory', example: 'git checkout main' },
  { id: 'branch-4', category: 'Branching', command: 'git checkout -b [branch]', description: 'Create and immediately switch to a new branch', example: 'git checkout -b feature/dashboard' },
  { id: 'branch-5', category: 'Branching', command: 'git switch [branch]', description: 'Switch to another branch (modern alternative to checkout)', example: 'git switch develop' },
  { id: 'branch-6', category: 'Branching', command: 'git switch -c [branch]', description: 'Create and switch to a new branch', example: 'git switch -c fix/header-bug' },
  { id: 'branch-7', category: 'Branching', command: 'git merge [branch]', description: 'Merge the specified branch history into the current branch', example: 'git merge feature/login --no-ff' },
  { id: 'branch-8', category: 'Branching', command: 'git rebase [base]', description: 'Reapply commits on top of another base branch', example: 'git rebase main' },
  { id: 'branch-9', category: 'Branching', command: 'git rebase -i HEAD~[n]', description: 'Interactively edit, squash, or reorder the last n commits', example: 'git rebase -i HEAD~3' },
  { id: 'branch-10', category: 'Branching', command: 'git branch -d [branch]', description: 'Delete the specified branch (safe – won\'t delete unmerged)', example: 'git branch -d feature/login' },
  { id: 'branch-11', category: 'Branching', command: 'git branch -D [branch]', description: 'Force delete a branch even if it has unmerged changes', example: 'git branch -D old-feature' },
  { id: 'branch-12', category: 'Branching', command: 'git cherry-pick [commit]', description: 'Apply the changes from a specific commit onto current branch', example: 'git cherry-pick a1b2c3d' },

  // Remote
  { id: 'remote-1', category: 'Remote', command: 'git remote -v', description: 'List all remote connections with their URLs', example: 'git remote -v' },
  { id: 'remote-2', category: 'Remote', command: 'git remote add [name] [url]', description: 'Add a new remote repository connection', example: 'git remote add origin https://github.com/user/repo.git' },
  { id: 'remote-3', category: 'Remote', command: 'git remote remove [name]', description: 'Remove a remote connection', example: 'git remote remove upstream' },
  { id: 'remote-4', category: 'Remote', command: 'git fetch [remote]', description: 'Download all history from remote without merging', example: 'git fetch origin' },
  { id: 'remote-5', category: 'Remote', command: 'git pull', description: 'Fetch and merge remote changes into current branch', example: 'git pull origin main --rebase' },
  { id: 'remote-6', category: 'Remote', command: 'git push [remote] [branch]', description: 'Upload local branch commits to the remote repository', example: 'git push origin feature/login' },
  { id: 'remote-7', category: 'Remote', command: 'git push -u origin [branch]', description: 'Push and set upstream tracking branch in one step', example: 'git push -u origin develop' },
  { id: 'remote-8', category: 'Remote', command: 'git push --force-with-lease', description: 'Force push safely – fails if remote has new commits', example: 'git push --force-with-lease origin feature/x' },
  { id: 'remote-9', category: 'Remote', command: 'git push origin --delete [branch]', description: 'Delete a branch on the remote repository', example: 'git push origin --delete old-branch' },

  // Undo
  { id: 'undo-1', category: 'Undo', command: 'git restore [file]', description: 'Discard unstaged changes in a file (working directory)', example: 'git restore src/app.ts' },
  { id: 'undo-2', category: 'Undo', command: 'git restore --staged [file]', description: 'Unstage a file while keeping changes in working directory', example: 'git restore --staged src/app.ts' },
  { id: 'undo-3', category: 'Undo', command: 'git reset HEAD~1', description: 'Undo last commit, keep changes unstaged', example: 'git reset HEAD~1' },
  { id: 'undo-4', category: 'Undo', command: 'git reset --soft HEAD~1', description: 'Undo last commit, keep changes staged', example: 'git reset --soft HEAD~1' },
  { id: 'undo-5', category: 'Undo', command: 'git reset --hard HEAD~1', description: 'Undo last commit and discard all changes permanently', example: 'git reset --hard HEAD~1' },
  { id: 'undo-6', category: 'Undo', command: 'git revert [commit]', description: 'Create a new commit that undoes a specific commit (safe)', example: 'git revert a1b2c3d' },
  { id: 'undo-7', category: 'Undo', command: 'git clean -fd', description: 'Remove all untracked files and directories', example: 'git clean -fd --dry-run' },
  { id: 'undo-8', category: 'Undo', command: 'git checkout -- [file]', description: 'Restore file to last committed state (older syntax)', example: 'git checkout -- package.json' },

  // Stash
  { id: 'stash-1', category: 'Stash', command: 'git stash', description: 'Temporarily save uncommitted changes to a stack', example: 'git stash push -m "WIP: login form"' },
  { id: 'stash-2', category: 'Stash', command: 'git stash list', description: 'List all stashed changesets', example: 'git stash list' },
  { id: 'stash-3', category: 'Stash', command: 'git stash pop', description: 'Apply the most recent stash and remove it from the stack', example: 'git stash pop' },
  { id: 'stash-4', category: 'Stash', command: 'git stash apply stash@{n}', description: 'Apply a specific stash entry without removing it', example: 'git stash apply stash@{2}' },
  { id: 'stash-5', category: 'Stash', command: 'git stash drop stash@{n}', description: 'Delete a specific stash entry', example: 'git stash drop stash@{0}' },
  { id: 'stash-6', category: 'Stash', command: 'git stash clear', description: 'Remove all stash entries permanently', example: 'git stash clear' },
  { id: 'stash-7', category: 'Stash', command: 'git stash branch [branch]', description: 'Create a branch from stash and apply changes', example: 'git stash branch feature/saved-work' },
  { id: 'stash-8', category: 'Stash', command: 'git stash show -p', description: 'Show the diff of the most recent stash', example: 'git stash show -p stash@{0}' },

  // Tags
  { id: 'tag-1', category: 'Tags', command: 'git tag', description: 'List all tags in the repository', example: 'git tag -l "v1.*"' },
  { id: 'tag-2', category: 'Tags', command: 'git tag [name]', description: 'Create a lightweight tag at current HEAD', example: 'git tag v1.0.0' },
  { id: 'tag-3', category: 'Tags', command: 'git tag -a [name] -m "[msg]"', description: 'Create an annotated tag with a message', example: 'git tag -a v2.0.0 -m "Version 2 release"' },
  { id: 'tag-4', category: 'Tags', command: 'git push origin [tag]', description: 'Push a specific tag to the remote repository', example: 'git push origin v1.0.0' },
  { id: 'tag-5', category: 'Tags', command: 'git push origin --tags', description: 'Push all local tags to the remote repository', example: 'git push origin --tags' },
  { id: 'tag-6', category: 'Tags', command: 'git tag -d [name]', description: 'Delete a local tag', example: 'git tag -d v1.0.0-rc' },
  { id: 'tag-7', category: 'Tags', command: 'git push origin --delete tag [name]', description: 'Delete a tag on the remote repository', example: 'git push origin --delete tag v1.0.0-rc' },

  // Advanced
  { id: 'adv-1', category: 'Advanced', command: 'git bisect start', description: 'Start binary search to find the commit that introduced a bug', example: 'git bisect start && git bisect bad HEAD && git bisect good v1.0' },
  { id: 'adv-2', category: 'Advanced', command: 'git blame [file]', description: 'Show who last modified each line of a file and when', example: 'git blame -L 10,25 src/app.ts' },
  { id: 'adv-3', category: 'Advanced', command: 'git reflog', description: 'Show history of HEAD and branch reference updates', example: 'git reflog --relative-date' },
  { id: 'adv-4', category: 'Advanced', command: 'git shortlog -sn', description: 'List commit count per author, sorted by most commits', example: 'git shortlog -sn --no-merges' },
  { id: 'adv-5', category: 'Advanced', command: 'git archive --format=zip HEAD', description: 'Create a zip archive of the repository at current HEAD', example: 'git archive --format=zip HEAD > repo.zip' },
  { id: 'adv-6', category: 'Advanced', command: 'git submodule add [url]', description: 'Add another repository as a submodule inside this repo', example: 'git submodule add https://github.com/user/lib.git libs/lib' },
  { id: 'adv-7', category: 'Advanced', command: 'git worktree add [path] [branch]', description: 'Check out a branch into a separate directory (worktree)', example: 'git worktree add ../hotfix hotfix/critical' },
  { id: 'adv-8', category: 'Advanced', command: 'git gc', description: 'Run garbage collection to optimize the local repository', example: 'git gc --aggressive --prune=now' },
  { id: 'adv-9', category: 'Advanced', command: 'git log --grep="[pattern]"', description: 'Search commit messages matching a pattern', example: 'git log --grep="fix" --oneline' },
  { id: 'adv-10', category: 'Advanced', command: 'git log -S "[string]"', description: 'Find commits that added or removed a specific string (pickaxe)', example: 'git log -S "password" --patch' },
];

const ALL_CATEGORIES = ['All', 'Setup', 'Basic', 'Branching', 'Remote', 'Undo', 'Stash', 'Tags', 'Advanced', 'Favorites'];

const CATEGORY_COLORS: Record<string, string> = {
  Setup: '#1677ff',
  Basic: '#52c41a',
  Branching: '#722ed1',
  Remote: '#fa8c16',
  Undo: '#f5222d',
  Stash: '#13c2c2',
  Tags: '#eb2f96',
  Advanced: '#faad14',
  Favorites: '#50C878',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function GitReferenceTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [messageApi, contextHolder] = message.useMessage();

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222' : '#fff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const headingColor = isDark ? '#e0e0e0' : '#111';
  const mutedColor = isDark ? '#666' : '#aaa';
  const codeBg = isDark ? '#111' : '#f5f5f5';
  const codeBorder = isDark ? '#333' : '#ddd';
  const exampleBg = isDark ? '#1a2a1a' : '#f0fff4';
  const exampleBorder = isDark ? 'rgba(80,200,120,0.2)' : 'rgba(80,200,120,0.35)';

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setFavorites(new Set(JSON.parse(saved)));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const copyCommand = useCallback((cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => {
      messageApi.success({ content: 'Copied to clipboard!', duration: 1.5 });
    }).catch(() => {
      messageApi.error({ content: 'Copy failed', duration: 1.5 });
    });
  }, [messageApi]);

  const filterText = search.toLowerCase().trim();

  const filteredCommands = useMemo(() => {
    let list = GIT_COMMANDS;
    if (activeTab === 'Favorites') {
      list = list.filter(c => favorites.has(c.id));
    } else if (activeTab !== 'All') {
      list = list.filter(c => c.category === activeTab);
    }
    if (filterText) {
      list = list.filter(c =>
        c.command.toLowerCase().includes(filterText) ||
        c.description.toLowerCase().includes(filterText) ||
        c.example.toLowerCase().includes(filterText) ||
        c.category.toLowerCase().includes(filterText)
      );
    }
    return list;
  }, [activeTab, filterText, favorites]);

  // Group by category for "All" tab
  const groupedCommands = useMemo(() => {
    if (activeTab !== 'All') return null;
    const groups: Record<string, GitCommand[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [activeTab, filteredCommands]);

  const tabItems = ALL_CATEGORIES.map(cat => {
    const count = cat === 'All'
      ? GIT_COMMANDS.length
      : cat === 'Favorites'
        ? favorites.size
        : GIT_COMMANDS.filter(c => c.category === cat).length;

    return {
      key: cat,
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cat === 'Favorites' && <StarFilled style={{ color: PRIMARY, fontSize: 12 }} />}
          {cat}
          <Badge
            count={count}
            style={{
              background: cat === activeTab ? PRIMARY : (isDark ? '#333' : '#ddd'),
              color: cat === activeTab ? '#fff' : (isDark ? '#aaa' : '#666'),
              fontSize: 10,
              boxShadow: 'none',
              minWidth: 18,
              height: 18,
              lineHeight: '18px',
            }}
          />
        </span>
      ),
    };
  });

  function CommandCard({ cmd }: { cmd: GitCommand }) {
    const isFav = favorites.has(cmd.id);
    return (
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = PRIMARY + '66')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
      >
        {/* Top row: category tag + star */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <Tag
            style={{
              background: (CATEGORY_COLORS[cmd.category] ?? '#666') + '20',
              border: `1px solid ${(CATEGORY_COLORS[cmd.category] ?? '#666')}44`,
              color: CATEGORY_COLORS[cmd.category] ?? '#666',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              borderRadius: 4,
              padding: '0 6px',
              margin: 0,
            }}
          >
            {cmd.category}
          </Tag>
          <Tooltip title={isFav ? 'Remove from favorites' : 'Add to favorites'}>
            <button
              onClick={() => toggleFavorite(cmd.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                color: isFav ? PRIMARY : mutedColor,
                fontSize: 14,
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
            >
              {isFav ? <StarFilled /> : <StarOutlined />}
            </button>
          </Tooltip>
        </div>

        {/* Command + copy button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: codeBg,
            border: `1px solid ${codeBorder}`,
            borderRadius: 7,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
          onClick={() => copyCommand(cmd.command)}
          title="Click to copy"
        >
          <code
            style={{
              flex: 1,
              fontFamily: '"Fira Code", "Cascadia Code", "JetBrains Mono", monospace',
              fontSize: 13,
              color: PRIMARY,
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {cmd.command}
          </code>
          <CopyOutlined style={{ color: mutedColor, fontSize: 13, flexShrink: 0 }} />
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 13, color: textColor, lineHeight: 1.5 }}>
          {cmd.description}
        </p>

        {/* Example */}
        <div
          style={{
            background: exampleBg,
            border: `1px solid ${exampleBorder}`,
            borderRadius: 6,
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8,
            cursor: 'pointer',
          }}
          onClick={() => copyCommand(cmd.example)}
          title="Click to copy example"
        >
          <span style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>
            EXAMPLE
          </span>
          <code
            style={{
              fontFamily: 'monospace',
              fontSize: 12,
              color: isDark ? '#a0d8a0' : '#2d6a4f',
              wordBreak: 'break-all',
              lineHeight: 1.5,
            }}
          >
            {cmd.example}
          </code>
        </div>
      </div>
    );
  }

  function renderGroup(title: string, cmds: GitCommand[]) {
    return (
      <div key={title} style={{ marginBottom: 28 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: CATEGORY_COLORS[title] ?? PRIMARY,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, color: headingColor }}>{title}</span>
          <span style={{ fontSize: 12, color: mutedColor }}>({cmds.length} commands)</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 12,
          }}
        >
          {cmds.map(cmd => <CommandCard key={cmd.id} cmd={cmd} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: bg, minHeight: '100%', color: textColor }}>
      {contextHolder}

      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: PRIMARY }} />}
          placeholder="Search commands, descriptions, or examples..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          allowClear
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            color: textColor,
            borderRadius: 8,
            maxWidth: 520,
          }}
        />
        {filterText && (
          <span style={{ marginLeft: 12, fontSize: 12, color: mutedColor }}>
            {filteredCommands.length} result{filteredCommands.length !== 1 ? 's' : ''} found
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <style>{`
          .git-tabs .ant-tabs-nav {
            padding: 0 12px;
            margin-bottom: 0 !important;
            border-bottom: 1px solid ${border};
          }
          .git-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
            color: ${PRIMARY} !important;
          }
          .git-tabs .ant-tabs-ink-bar {
            background: ${PRIMARY} !important;
          }
          .git-tabs .ant-tabs-content-holder {
            padding: 16px;
          }
        `}</style>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems.map(t => ({ ...t, children: null }))}
          className="git-tabs"
          tabBarStyle={{ background: isDark ? '#1a1a1a' : '#fafafa' }}
          style={{ padding: 0 }}
        />
      </div>

      {/* Content */}
      {filteredCommands.length === 0 ? (
        <Empty
          description={
            <span style={{ color: mutedColor }}>
              {activeTab === 'Favorites' ? 'No favorites yet — click the star icon on any command.' : 'No commands found.'}
            </span>
          }
          style={{ padding: '40px 0' }}
        />
      ) : activeTab === 'All' && !filterText && groupedCommands ? (
        <div>
          {Object.entries(groupedCommands).map(([cat, cmds]) => renderGroup(cat, cmds))}
        </div>
      ) : (
        <div>
          {activeTab !== 'All' && !filterText && (
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: headingColor,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: CATEGORY_COLORS[activeTab] ?? PRIMARY,
                  }}
                />
                {activeTab}
                <span style={{ fontSize: 12, color: mutedColor, fontWeight: 400 }}>
                  ({filteredCommands.length} commands)
                </span>
              </span>
            </div>
          )}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 12,
            }}
          >
            {filteredCommands.map(cmd => <CommandCard key={cmd.id} cmd={cmd} />)}
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          marginTop: 20,
          padding: '10px 16px',
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: mutedColor,
        }}
      >
        <BranchesOutlined style={{ color: PRIMARY }} />
        <span>{GIT_COMMANDS.length} commands across {ALL_CATEGORIES.length - 2} categories &mdash; click any command or example to copy it to clipboard</span>
      </div>
    </div>
  );
}
