'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card, Button, Select, Tag, Typography, Progress, Row, Col, Modal, Checkbox, Divider,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, TrophyOutlined, ReloadOutlined,
  ClockCircleOutlined, BookOutlined, ArrowRightOutlined, QuestionCircleOutlined,
  StarOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

const { Title, Text } = Typography;

const PRIMARY = '#50C878';
const PRIMARY_BG = 'rgba(80,200,120,0.08)';
const PRIMARY_BORDER = 'rgba(80,200,120,0.2)';

// ── Types ─────────────────────────────────────────────────────────────────────

type Topic =
  | 'JavaScript' | 'Python' | 'HTML/CSS' | 'SQL' | 'Git'
  | 'Data Structures' | 'Algorithms' | 'TypeScript' | 'React';

type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

interface Question {
  id: number;
  topic: Topic;
  difficulty: Difficulty;
  question: string;
  options: [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

interface QuizScore {
  score: number;
  total: number;
  date: string;
  topic: string;
}

// ── Question Bank (85 questions) ──────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // ── JavaScript ──────────────────────────────────────────────────────────────
  {
    id: 1, topic: 'JavaScript', difficulty: 'Beginner',
    question: 'What does `typeof null` return in JavaScript?',
    options: ['"null"', '"object"', '"undefined"', '"boolean"'],
    answer: 1,
    explanation: '`typeof null` returns "object" — this is a well-known JavaScript bug from its original implementation.',
  },
  {
    id: 2, topic: 'JavaScript', difficulty: 'Beginner',
    question: 'Which of the following is NOT a falsy value in JavaScript?',
    options: ['0', '""', '"false"', 'null'],
    answer: 2,
    explanation: '"false" (the string) is truthy. Only the boolean `false`, 0, "", null, undefined, and NaN are falsy.',
  },
  {
    id: 3, topic: 'JavaScript', difficulty: 'Intermediate',
    question: 'What is a closure in JavaScript?',
    options: [
      'A function that calls itself',
      'A function that has access to variables from its outer (enclosing) scope',
      'A way to close the browser window',
      'A method to terminate a loop',
    ],
    answer: 1,
    explanation: 'A closure is a function that retains access to its lexical scope even when executed outside that scope.',
  },
  {
    id: 4, topic: 'JavaScript', difficulty: 'Intermediate',
    question: 'What will `console.log(1 + "2" + 3)` output?',
    options: ['6', '"123"', '"15"', 'NaN'],
    answer: 1,
    explanation: 'Left-to-right: `1 + "2"` → `"12"` (number coerced to string), then `"12" + 3` → `"123"`.',
  },
  {
    id: 5, topic: 'JavaScript', difficulty: 'Advanced',
    question: 'What is the output of `[1, 2, 3].reduce((a, b) => a + b, 10)`?',
    options: ['6', '16', '10', 'NaN'],
    answer: 1,
    explanation: 'reduce starts with initialValue 10, then 10+1=11, 11+2=13, 13+3=16.',
  },
  {
    id: 6, topic: 'JavaScript', difficulty: 'Intermediate',
    question: 'What does the `event.preventDefault()` method do?',
    options: [
      'Stops event propagation to parent elements',
      'Prevents the default browser action for the event',
      'Removes the event listener',
      'Cancels all pending timeouts',
    ],
    answer: 1,
    explanation: 'preventDefault() stops the browser\'s default action (e.g., form submission, link navigation).',
  },
  {
    id: 7, topic: 'JavaScript', difficulty: 'Advanced',
    question: 'What is the Temporal Dead Zone (TDZ)?',
    options: [
      'The time between declaring a var and using it',
      'The period between entering a scope and the let/const declaration being initialized',
      'A deprecated JavaScript feature',
      'The time a promise is pending',
    ],
    answer: 1,
    explanation: 'TDZ is the period from entering a block scope until a let/const variable is initialized — accessing it throws ReferenceError.',
  },
  {
    id: 8, topic: 'JavaScript', difficulty: 'Beginner',
    question: 'Which method is used to add an element to the END of an array?',
    options: ['push()', 'pop()', 'shift()', 'unshift()'],
    answer: 0,
    explanation: 'push() adds one or more elements to the end of an array and returns the new length.',
  },
  {
    id: 9, topic: 'JavaScript', difficulty: 'Advanced',
    question: 'What does `Promise.allSettled()` do differently from `Promise.all()`?',
    options: [
      'Runs promises sequentially',
      'Rejects as soon as any promise rejects',
      'Always resolves with all results regardless of rejection',
      'Only handles fulfilled promises',
    ],
    answer: 2,
    explanation: 'Promise.allSettled() waits for all promises to settle (either fulfilled or rejected) and returns all results.',
  },
  {
    id: 10, topic: 'JavaScript', difficulty: 'Intermediate',
    question: 'What is hoisting in JavaScript?',
    options: [
      'Moving code to a web server',
      'Variable and function declarations being moved to the top of their scope before execution',
      'A CSS technique for positioning elements',
      'A method for loading scripts asynchronously',
    ],
    answer: 1,
    explanation: 'Hoisting moves declarations (not initializations) to the top of their scope. `var` declarations are hoisted as `undefined`; `let`/`const` are in TDZ.',
  },

  // ── Python ───────────────────────────────────────────────────────────────────
  {
    id: 11, topic: 'Python', difficulty: 'Beginner',
    question: 'What does `[x**2 for x in range(5)]` produce?',
    options: ['[1, 4, 9, 16, 25]', '[0, 1, 4, 9, 16]', '[0, 2, 4, 6, 8]', '[1, 2, 3, 4, 5]'],
    answer: 1,
    explanation: 'range(5) is 0–4, and squaring each gives [0, 1, 4, 9, 16].',
  },
  {
    id: 12, topic: 'Python', difficulty: 'Intermediate',
    question: 'What is a Python decorator?',
    options: [
      'A design pattern for UI elements',
      'A function that wraps another function to extend its behavior',
      'A class attribute annotation',
      'A method for string formatting',
    ],
    answer: 1,
    explanation: 'A decorator is a callable that takes a function and returns a modified version of it, typically using @syntax.',
  },
  {
    id: 13, topic: 'Python', difficulty: 'Advanced',
    question: 'What is the Global Interpreter Lock (GIL)?',
    options: [
      'A security feature blocking untrusted code',
      'A mutex that allows only one thread to execute Python bytecode at a time',
      'A tool for global variable management',
      'A garbage collection algorithm',
    ],
    answer: 1,
    explanation: 'The GIL prevents true parallel thread execution for CPU-bound tasks in CPython, though I/O-bound threads benefit from concurrency.',
  },
  {
    id: 14, topic: 'Python', difficulty: 'Intermediate',
    question: 'What does `yield` do in a Python function?',
    options: [
      'Returns a value and terminates the function',
      'Pauses the function and produces a value, making it a generator',
      'Raises an exception',
      'Imports a module lazily',
    ],
    answer: 1,
    explanation: '`yield` turns a function into a generator, pausing execution and producing a value on each call to `next()`.',
  },
  {
    id: 15, topic: 'Python', difficulty: 'Beginner',
    question: 'What is the difference between a list and a tuple in Python?',
    options: [
      'Lists are faster; tuples are slower',
      'Lists are mutable; tuples are immutable',
      'Lists hold numbers; tuples hold strings',
      'There is no practical difference',
    ],
    answer: 1,
    explanation: 'Lists are mutable (can be modified); tuples are immutable (cannot be changed after creation).',
  },
  {
    id: 16, topic: 'Python', difficulty: 'Advanced',
    question: 'What does `__slots__` do in a Python class?',
    options: [
      'Defines abstract methods',
      'Restricts instance attributes to a fixed set, reducing memory usage',
      'Enables multiple inheritance',
      'Declares class-level constants',
    ],
    answer: 1,
    explanation: '__slots__ prevents the creation of __dict__ per instance, fixing allowed attributes and reducing memory overhead.',
  },
  {
    id: 17, topic: 'Python', difficulty: 'Intermediate',
    question: 'What is the output of `list(map(lambda x: x*2, [1, 2, 3]))`?',
    options: ['[1, 2, 3]', '[2, 4, 6]', '[1, 4, 9]', 'map object'],
    answer: 1,
    explanation: 'map applies the lambda to each element: 1→2, 2→4, 3→6, wrapped in list() gives [2, 4, 6].',
  },
  {
    id: 18, topic: 'Python', difficulty: 'Advanced',
    question: 'What is the `@property` decorator used for?',
    options: [
      'To mark a method as static',
      'To define getter methods that can be accessed like attributes',
      'To prevent method overriding',
      'To create class variables',
    ],
    answer: 1,
    explanation: '@property allows a method to be accessed like an attribute, enabling controlled access with getter/setter/deleter.',
  },

  // ── HTML/CSS ─────────────────────────────────────────────────────────────────
  {
    id: 19, topic: 'HTML/CSS', difficulty: 'Beginner',
    question: 'What does the CSS box model consist of?',
    options: [
      'content, padding, border, margin',
      'width, height, color, font',
      'block, inline, flex, grid',
      'header, body, footer, aside',
    ],
    answer: 0,
    explanation: 'The CSS box model has four areas: content, padding, border, and margin — from inside out.',
  },
  {
    id: 20, topic: 'HTML/CSS', difficulty: 'Intermediate',
    question: 'What is CSS specificity?',
    options: [
      'The speed at which CSS is parsed',
      'A weight system that determines which CSS rule takes precedence when multiple rules target the same element',
      'The number of CSS files loaded',
      'A unit of measure for font sizes',
    ],
    answer: 1,
    explanation: 'Specificity is calculated as (inline, ID, class/attr/pseudo-class, element) — higher specificity wins.',
  },
  {
    id: 21, topic: 'HTML/CSS', difficulty: 'Intermediate',
    question: 'What does `display: flex` do to the children of a container?',
    options: [
      'Hides all children',
      'Arranges children in a block layout',
      'Makes children flexible items laid out in a row (by default)',
      'Converts children to inline elements',
    ],
    answer: 2,
    explanation: 'Flexbox arranges direct children (flex items) along a main axis (default: row) with flexible sizing capabilities.',
  },
  {
    id: 22, topic: 'HTML/CSS', difficulty: 'Advanced',
    question: 'What is the difference between `em` and `rem` units?',
    options: [
      'em is absolute; rem is relative',
      'em is relative to the parent element\'s font-size; rem is relative to the root element\'s font-size',
      'em applies to margins; rem applies to padding',
      'There is no difference in modern browsers',
    ],
    answer: 1,
    explanation: 'em computes relative to the element\'s own (or parent\'s) font-size, while rem always computes relative to the root (<html>) font-size.',
  },
  {
    id: 23, topic: 'HTML/CSS', difficulty: 'Beginner',
    question: 'What is the semantic HTML element for the main navigation of a page?',
    options: ['<div>', '<header>', '<nav>', '<section>'],
    answer: 2,
    explanation: '<nav> is the semantic element for navigation links, improving accessibility and SEO.',
  },
  {
    id: 24, topic: 'HTML/CSS', difficulty: 'Intermediate',
    question: 'Which CSS property creates a grid layout?',
    options: ['display: grid', 'layout: grid', 'grid: true', 'flex-direction: grid'],
    answer: 0,
    explanation: '`display: grid` turns an element into a grid container, enabling CSS Grid layout for its children.',
  },
  {
    id: 25, topic: 'HTML/CSS', difficulty: 'Advanced',
    question: 'What is a CSS custom property (CSS variable)?',
    options: [
      'A preprocessor variable like in Sass',
      'A property defined with `--name: value` and accessed via `var(--name)`',
      'A JavaScript variable injected into CSS',
      'A vendor-prefixed property',
    ],
    answer: 1,
    explanation: 'CSS custom properties are defined with `--property-name: value` on any element and accessed using `var(--property-name)`.',
  },
  {
    id: 26, topic: 'HTML/CSS', difficulty: 'Intermediate',
    question: 'What does `position: sticky` do?',
    options: [
      'Makes an element unmovable',
      'An element scrolls normally until it hits a threshold, then sticks in place',
      'Positions element relative to its parent',
      'Same as `position: fixed`',
    ],
    answer: 1,
    explanation: 'sticky elements behave like relative until the scroll position matches the offset (e.g. `top: 0`), then stick like fixed.',
  },

  // ── SQL ──────────────────────────────────────────────────────────────────────
  {
    id: 27, topic: 'SQL', difficulty: 'Beginner',
    question: 'What is the difference between INNER JOIN and LEFT JOIN?',
    options: [
      'INNER JOIN is faster; LEFT JOIN is slower',
      'INNER JOIN returns only matching rows; LEFT JOIN returns all rows from the left table plus matching rows from the right',
      'LEFT JOIN is the same as INNER JOIN',
      'INNER JOIN works on more tables simultaneously',
    ],
    answer: 1,
    explanation: 'INNER JOIN returns rows where there is a match in both tables. LEFT JOIN returns all left table rows, with NULLs for unmatched right rows.',
  },
  {
    id: 28, topic: 'SQL', difficulty: 'Intermediate',
    question: 'What does GROUP BY do in SQL?',
    options: [
      'Sorts the result set',
      'Groups rows sharing the same values into summary rows, used with aggregate functions',
      'Filters rows after aggregation',
      'Joins multiple tables',
    ],
    answer: 1,
    explanation: 'GROUP BY collapses rows with the same column values into groups so aggregate functions (SUM, COUNT, AVG) can be applied to each group.',
  },
  {
    id: 29, topic: 'SQL', difficulty: 'Advanced',
    question: 'What is the difference between WHERE and HAVING?',
    options: [
      'WHERE filters individual rows; HAVING filters groups after GROUP BY',
      'WHERE works after GROUP BY; HAVING works before',
      'HAVING is for numeric columns; WHERE is for text',
      'They are interchangeable',
    ],
    answer: 0,
    explanation: 'WHERE filters rows before grouping. HAVING filters groups after GROUP BY — it can reference aggregate functions.',
  },
  {
    id: 30, topic: 'SQL', difficulty: 'Intermediate',
    question: 'What is a database index?',
    options: [
      'A table of primary keys',
      'A data structure that speeds up data retrieval operations at the cost of extra storage and write performance',
      'The first column of a table',
      'A backup of table data',
    ],
    answer: 1,
    explanation: 'An index is a separate data structure (e.g. B-tree) that allows the database engine to find rows quickly without scanning the entire table.',
  },
  {
    id: 31, topic: 'SQL', difficulty: 'Advanced',
    question: 'What does a Common Table Expression (CTE) provide?',
    options: [
      'A way to create a permanent view',
      'A named temporary result set that can be referenced within a SELECT, INSERT, UPDATE, or DELETE statement',
      'A stored procedure replacement',
      'A cross-database join mechanism',
    ],
    answer: 1,
    explanation: 'CTEs (WITH clause) create named temporary result sets scoped to a single query, improving readability and enabling recursive queries.',
  },
  {
    id: 32, topic: 'SQL', difficulty: 'Beginner',
    question: 'What does `SELECT DISTINCT` do?',
    options: [
      'Selects the first unique row only',
      'Removes duplicate rows from the result set',
      'Selects rows in a distinct order',
      'Filters NULL values',
    ],
    answer: 1,
    explanation: 'DISTINCT eliminates duplicate rows from the result, returning only unique combinations of the selected columns.',
  },
  {
    id: 33, topic: 'SQL', difficulty: 'Advanced',
    question: 'What is a window function in SQL?',
    options: [
      'A function that operates on the browser window',
      'A function that performs calculations across a set of rows related to the current row, without collapsing them',
      'A function limited to a time window',
      'A trigger that fires on table updates',
    ],
    answer: 1,
    explanation: 'Window functions (OVER clause) compute values across a sliding window of rows (e.g. RANK(), LAG(), SUM OVER PARTITION) without collapsing the result.',
  },

  // ── Git ───────────────────────────────────────────────────────────────────────
  {
    id: 34, topic: 'Git', difficulty: 'Beginner',
    question: 'What does `git stash` do?',
    options: [
      'Deletes uncommitted changes permanently',
      'Temporarily saves uncommitted changes so you can switch branches',
      'Merges the current branch into main',
      'Resets the working directory to the last commit',
    ],
    answer: 1,
    explanation: 'git stash saves uncommitted changes (staged and unstaged) to a stack and reverts the working directory to a clean state.',
  },
  {
    id: 35, topic: 'Git', difficulty: 'Intermediate',
    question: 'What is the difference between `git merge` and `git rebase`?',
    options: [
      'merge is for local branches; rebase is for remote branches',
      'merge preserves history with a merge commit; rebase rewrites history by replaying commits on top of another branch',
      'rebase is safer than merge',
      'They produce identical results',
    ],
    answer: 1,
    explanation: 'Merge creates a merge commit, preserving the branch history. Rebase rewrites commits onto a new base, creating a linear history.',
  },
  {
    id: 36, topic: 'Git', difficulty: 'Advanced',
    question: 'What does `git cherry-pick <commit>` do?',
    options: [
      'Deletes a specific commit',
      'Applies the changes from a specific commit onto the current branch',
      'Merges an entire branch',
      'Tags a commit',
    ],
    answer: 1,
    explanation: 'cherry-pick applies the diff introduced by the specified commit to your current branch, creating a new commit with the same changes.',
  },
  {
    id: 37, topic: 'Git', difficulty: 'Intermediate',
    question: 'What is the difference between `git reset` and `git revert`?',
    options: [
      'reset works on files; revert works on commits',
      'reset rewrites history by moving HEAD; revert creates a new commit that undoes changes',
      'revert deletes commits; reset keeps them',
      'They are identical',
    ],
    answer: 1,
    explanation: 'reset moves HEAD (potentially losing history), while revert creates a new commit that undoes the changes — safe for shared branches.',
  },
  {
    id: 38, topic: 'Git', difficulty: 'Beginner',
    question: 'What command creates a new branch and switches to it?',
    options: ['git branch new-branch', 'git checkout -b new-branch', 'git switch new-branch', 'git new branch'],
    answer: 1,
    explanation: '`git checkout -b <name>` creates a new branch and immediately switches to it. Modern Git also uses `git switch -c <name>`.',
  },
  {
    id: 39, topic: 'Git', difficulty: 'Advanced',
    question: 'What does `git reflog` show?',
    options: [
      'The log of all remote operations',
      'A log of all changes to HEAD and branch tips, including operations that rewrite history',
      'A filtered log showing only merge commits',
      'The network graph of all branches',
    ],
    answer: 1,
    explanation: 'reflog records every position HEAD has pointed to, letting you recover commits after resets or rebases.',
  },
  {
    id: 40, topic: 'Git', difficulty: 'Intermediate',
    question: 'What does `git fetch` do vs `git pull`?',
    options: [
      'fetch is slower; pull is faster',
      'fetch downloads changes but does not merge; pull downloads and merges',
      'pull downloads without merging; fetch downloads and merges',
      'They are identical',
    ],
    answer: 1,
    explanation: '`git fetch` updates remote tracking branches without touching your working directory. `git pull` = `git fetch` + `git merge` (or rebase).',
  },

  // ── Data Structures ───────────────────────────────────────────────────────────
  {
    id: 41, topic: 'Data Structures', difficulty: 'Beginner',
    question: 'What is the main advantage of a linked list over an array?',
    options: [
      'Faster random access',
      'Efficient insertion and deletion at any position without shifting elements',
      'Less memory usage',
      'Better cache performance',
    ],
    answer: 1,
    explanation: 'Linked lists allow O(1) insertion/deletion at a known node pointer, whereas arrays require O(n) shifting.',
  },
  {
    id: 42, topic: 'Data Structures', difficulty: 'Beginner',
    question: 'What data structure follows the LIFO (Last In, First Out) principle?',
    options: ['Queue', 'Stack', 'Deque', 'Heap'],
    answer: 1,
    explanation: 'A stack is LIFO — the last element pushed is the first one popped, like a stack of plates.',
  },
  {
    id: 43, topic: 'Data Structures', difficulty: 'Intermediate',
    question: 'What is a hash collision?',
    options: [
      'When two hash functions produce the same output for all inputs',
      'When two different keys produce the same hash value in a hash table',
      'A crash caused by infinite hashing',
      'When a hash table is full',
    ],
    answer: 1,
    explanation: 'A hash collision occurs when two distinct keys hash to the same bucket. Common resolutions: chaining (linked list per bucket) or open addressing.',
  },
  {
    id: 44, topic: 'Data Structures', difficulty: 'Intermediate',
    question: 'What is the time complexity of searching in a balanced Binary Search Tree (BST)?',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    answer: 1,
    explanation: 'In a balanced BST, each comparison halves the search space, giving O(log n) search time.',
  },
  {
    id: 45, topic: 'Data Structures', difficulty: 'Advanced',
    question: 'What is the difference between a stack and a queue?',
    options: [
      'Stacks are LIFO; queues are FIFO',
      'Stacks are FIFO; queues are LIFO',
      'Stacks store numbers; queues store strings',
      'Both are LIFO but differ in implementation',
    ],
    answer: 0,
    explanation: 'Stack = LIFO (Last In, First Out). Queue = FIFO (First In, First Out). Both abstract linear data structures with different ordering semantics.',
  },
  {
    id: 46, topic: 'Data Structures', difficulty: 'Advanced',
    question: 'What is a heap data structure?',
    options: [
      'A tree where each node is larger than all nodes below it',
      'A complete binary tree satisfying the heap property (max-heap: parent >= children; min-heap: parent <= children)',
      'A linked list sorted in descending order',
      'A hash table with priority',
    ],
    answer: 1,
    explanation: 'A heap is a complete binary tree with the heap property. Min-heaps provide O(log n) extraction of the minimum, used in priority queues.',
  },
  {
    id: 47, topic: 'Data Structures', difficulty: 'Intermediate',
    question: 'What is the time complexity of accessing an element by index in an array?',
    options: ['O(log n)', 'O(n)', 'O(1)', 'O(n²)'],
    answer: 2,
    explanation: 'Arrays provide O(1) random access because elements are stored contiguously and can be accessed by computing base + index × size.',
  },
  {
    id: 48, topic: 'Data Structures', difficulty: 'Advanced',
    question: 'What is a trie (prefix tree)?',
    options: [
      'A balanced binary search tree',
      'A tree data structure for storing strings where each node represents a character prefix',
      'A graph with no cycles',
      'A hash map with string keys',
    ],
    answer: 1,
    explanation: 'A trie stores strings character by character, enabling O(m) search (m = key length) and efficient prefix matching.',
  },

  // ── Algorithms ────────────────────────────────────────────────────────────────
  {
    id: 49, topic: 'Algorithms', difficulty: 'Beginner',
    question: 'What is the Big-O notation for binary search?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    answer: 2,
    explanation: 'Binary search halves the search space each step, giving O(log n) time complexity.',
  },
  {
    id: 50, topic: 'Algorithms', difficulty: 'Intermediate',
    question: 'What is dynamic programming?',
    options: [
      'Programming with dynamic types',
      'An optimization technique that solves problems by breaking them into overlapping subproblems and storing results',
      'A runtime code generation technique',
      'A method for parallel computation',
    ],
    answer: 1,
    explanation: 'DP solves problems by memoizing (top-down) or tabulating (bottom-up) solutions to subproblems, avoiding redundant computation.',
  },
  {
    id: 51, topic: 'Algorithms', difficulty: 'Advanced',
    question: 'What is the average time complexity of quicksort?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    answer: 1,
    explanation: 'Quicksort averages O(n log n) with a good pivot choice, but degrades to O(n²) in the worst case (sorted input with naive pivot).',
  },
  {
    id: 52, topic: 'Algorithms', difficulty: 'Intermediate',
    question: 'What is the difference between BFS and DFS?',
    options: [
      'BFS uses a stack; DFS uses a queue',
      'BFS explores level by level using a queue; DFS explores as deep as possible using a stack (or recursion)',
      'BFS is for trees; DFS is for graphs',
      'DFS always finds the shortest path',
    ],
    answer: 1,
    explanation: 'BFS (Breadth-First Search) explores all neighbors at depth d before d+1, using a queue. DFS explores one path to its end before backtracking, using a stack.',
  },
  {
    id: 53, topic: 'Algorithms', difficulty: 'Advanced',
    question: 'What is memoization?',
    options: [
      'Storing function definitions in memory',
      'An optimization technique caching the results of expensive function calls and returning the cached result when the same inputs occur again',
      'A garbage collection strategy',
      'Compressing algorithms to use less memory',
    ],
    answer: 1,
    explanation: 'Memoization caches function results keyed by input, turning repeated expensive computations into O(1) lookups.',
  },
  {
    id: 54, topic: 'Algorithms', difficulty: 'Beginner',
    question: 'What does O(1) time complexity mean?',
    options: [
      'The algorithm runs in 1 millisecond',
      'The algorithm\'s runtime is constant regardless of input size',
      'The algorithm has exactly one operation',
      'The algorithm runs once per element',
    ],
    answer: 1,
    explanation: 'O(1) (constant time) means the operation takes the same amount of time regardless of how large the input is.',
  },
  {
    id: 55, topic: 'Algorithms', difficulty: 'Advanced',
    question: 'What is the greedy algorithm approach?',
    options: [
      'Using excessive memory for speed',
      'Making the locally optimal choice at each step, hoping it leads to a globally optimal solution',
      'Trying all possible solutions',
      'Dividing the problem into independent subproblems',
    ],
    answer: 1,
    explanation: 'Greedy algorithms build solutions piece by piece, choosing the best option at each step. They work for problems with the greedy-choice property (e.g. Huffman coding, Kruskal\'s).',
  },

  // ── TypeScript ────────────────────────────────────────────────────────────────
  {
    id: 56, topic: 'TypeScript', difficulty: 'Beginner',
    question: 'What is the difference between `type` and `interface` in TypeScript?',
    options: [
      'type is for primitives; interface is for objects',
      'interface can be extended/merged; type aliases cannot be re-opened, but both can describe object shapes',
      'type is faster at compile time',
      'interface supports generics; type does not',
    ],
    answer: 1,
    explanation: 'Both can describe objects, but interfaces support declaration merging and are often preferred for objects. Type aliases are more flexible (unions, mapped types).',
  },
  {
    id: 57, topic: 'TypeScript', difficulty: 'Intermediate',
    question: 'What is a generic in TypeScript?',
    options: [
      'A type that can only be `any`',
      'A placeholder type parameter that allows a function or class to work with multiple types while maintaining type safety',
      'A deprecated TypeScript feature',
      'A way to define optional properties',
    ],
    answer: 1,
    explanation: 'Generics (<T>) parameterize types, letting you write reusable, type-safe code that works across different types.',
  },
  {
    id: 58, topic: 'TypeScript', difficulty: 'Intermediate',
    question: 'What does the `Partial<T>` utility type do?',
    options: [
      'Makes all properties of T required',
      'Makes all properties of T optional',
      'Makes all properties of T readonly',
      'Picks a subset of T',
    ],
    answer: 1,
    explanation: '`Partial<T>` constructs a type with all properties of T set to optional (`?`), useful for update/patch operations.',
  },
  {
    id: 59, topic: 'TypeScript', difficulty: 'Advanced',
    question: 'What is a discriminated union?',
    options: [
      'A union type with no common properties',
      'A union where each member has a common literal property (discriminant) for type narrowing',
      'A union that only allows primitive types',
      'A union restricted to two members',
    ],
    answer: 1,
    explanation: 'Discriminated unions use a shared literal property (e.g. `kind: "circle" | "square"`) to narrow the type inside conditionals.',
  },
  {
    id: 60, topic: 'TypeScript', difficulty: 'Beginner',
    question: 'What does the `readonly` modifier do in TypeScript?',
    options: [
      'Makes a property required',
      'Prevents a property from being reassigned after initialization',
      'Makes a property optional',
      'Hides a property from intellisense',
    ],
    answer: 1,
    explanation: '`readonly` prevents assignment to the property after object creation, similar to `const` for variables.',
  },
  {
    id: 61, topic: 'TypeScript', difficulty: 'Advanced',
    question: 'What is the `infer` keyword used for in TypeScript?',
    options: [
      'To make TypeScript infer types automatically everywhere',
      'To declare a type variable within a conditional type, capturing part of a matched type',
      'To skip type checking for a value',
      'To convert runtime values to types',
    ],
    answer: 1,
    explanation: '`infer` is used inside conditional types (e.g. `T extends Promise<infer U> ? U : T`) to capture and use parts of a matched type.',
  },
  {
    id: 62, topic: 'TypeScript', difficulty: 'Intermediate',
    question: 'What does `keyof T` return in TypeScript?',
    options: [
      'The values of all properties of T',
      'A union type of all the property names (keys) of T',
      'The number of properties in T',
      'An array of T\'s property names',
    ],
    answer: 1,
    explanation: '`keyof T` produces a union of all string/symbol keys of type T, useful in mapped types and generic constraints.',
  },

  // ── React ─────────────────────────────────────────────────────────────────────
  {
    id: 63, topic: 'React', difficulty: 'Beginner',
    question: 'What is the virtual DOM in React?',
    options: [
      'A server-side rendering technique',
      'A lightweight in-memory representation of the real DOM that React uses to compute minimal updates',
      'A browser feature for faster DOM access',
      'A CSS-in-JS library',
    ],
    answer: 1,
    explanation: 'React keeps a virtual DOM tree in memory, diffs it with the previous version on state changes, and applies only the minimal set of real DOM updates.',
  },
  {
    id: 64, topic: 'React', difficulty: 'Intermediate',
    question: 'What are the rules of React Hooks?',
    options: [
      'Hooks can only be used in class components',
      'Only call Hooks at the top level of a function component or custom Hook; never inside loops, conditions, or nested functions',
      'Hooks must be named with a capital letter',
      'Hooks can only return a single value',
    ],
    answer: 1,
    explanation: 'The Rules of Hooks: 1) Call at the top level only. 2) Call from React function components or custom Hooks only.',
  },
  {
    id: 65, topic: 'React', difficulty: 'Intermediate',
    question: 'What does `useEffect` with an empty dependency array `[]` do?',
    options: [
      'Runs the effect on every render',
      'Runs the effect once after the initial render (componentDidMount equivalent)',
      'Runs the effect before every render',
      'Skips the effect entirely',
    ],
    answer: 1,
    explanation: 'An empty dependency array means the effect runs once after the first render. It does not re-run unless the component unmounts and remounts.',
  },
  {
    id: 66, topic: 'React', difficulty: 'Advanced',
    question: 'When should you use `React.memo`?',
    options: [
      'To memoize expensive calculations inside a component',
      'To prevent a component from re-rendering when its props have not changed (shallow comparison)',
      'To cache API responses',
      'To avoid re-creating callback functions',
    ],
    answer: 1,
    explanation: 'React.memo wraps a component and skips re-rendering if props are shallowly equal to the previous render, optimizing pure functional components.',
  },
  {
    id: 67, topic: 'React', difficulty: 'Intermediate',
    question: 'What is the purpose of the `key` prop in React lists?',
    options: [
      'To encrypt list items',
      'To give React a stable identity for each element so it can efficiently reconcile the list when items change',
      'To style list items differently',
      'To prevent duplicate rendering',
    ],
    answer: 1,
    explanation: 'React uses `key` to identify which items changed, were added, or removed, enabling efficient list reconciliation.',
  },
  {
    id: 68, topic: 'React', difficulty: 'Advanced',
    question: 'What is the difference between `useCallback` and `useMemo`?',
    options: [
      'They are identical',
      'useCallback memoizes a function reference; useMemo memoizes the result of a function call',
      'useCallback is for class components; useMemo is for function components',
      'useMemo is faster than useCallback',
    ],
    answer: 1,
    explanation: 'useCallback returns a memoized callback function (the function itself). useMemo returns a memoized computed value (the function\'s return value).',
  },
  {
    id: 69, topic: 'React', difficulty: 'Advanced',
    question: 'What is React Context used for?',
    options: [
      'Managing local component state',
      'Sharing values (like theme, auth) across the component tree without prop drilling',
      'Optimizing component rendering',
      'Handling side effects',
    ],
    answer: 1,
    explanation: 'Context provides a way to pass data through the component tree without explicitly passing props at every level — useful for global state like theme or auth.',
  },
  {
    id: 70, topic: 'React', difficulty: 'Beginner',
    question: 'What is JSX?',
    options: [
      'A JavaScript runtime',
      'A syntax extension for JavaScript that looks like HTML and is transformed into React.createElement() calls',
      'A separate templating language',
      'A CSS-in-JS solution',
    ],
    answer: 1,
    explanation: 'JSX is syntactic sugar for React.createElement() calls. Babel/SWC transforms JSX into regular JavaScript function calls.',
  },

  // ── Extra questions across topics ─────────────────────────────────────────────
  {
    id: 71, topic: 'JavaScript', difficulty: 'Advanced',
    question: 'What does `Object.freeze()` do?',
    options: [
      'Creates a deep immutable copy of an object',
      'Prevents adding, removing, or modifying properties on an object (shallow freeze)',
      'Converts an object to a string',
      'Locks the object to a single thread',
    ],
    answer: 1,
    explanation: 'Object.freeze() makes an object\'s direct properties non-writable and non-configurable, but nested objects are not frozen (shallow).',
  },
  {
    id: 72, topic: 'Python', difficulty: 'Beginner',
    question: 'What does `*args` do in a Python function definition?',
    options: [
      'Passes keyword arguments as a dict',
      'Accepts any number of positional arguments as a tuple',
      'Makes all arguments required',
      'Unpacks a list into arguments',
    ],
    answer: 1,
    explanation: '*args collects extra positional arguments into a tuple, allowing a function to accept any number of positional arguments.',
  },
  {
    id: 73, topic: 'SQL', difficulty: 'Intermediate',
    question: 'What is a transaction in SQL?',
    options: [
      'A single SQL query',
      'A sequence of SQL operations treated as a single atomic unit — either all succeed or all fail',
      'A database backup',
      'A view definition',
    ],
    answer: 1,
    explanation: 'Transactions ensure ACID properties (Atomicity, Consistency, Isolation, Durability), controlled with BEGIN, COMMIT, and ROLLBACK.',
  },
  {
    id: 74, topic: 'Git', difficulty: 'Advanced',
    question: 'What is a Git hook?',
    options: [
      'A branch protection rule',
      'A script that Git executes before or after events like commit, push, and receive',
      'A merge strategy',
      'A remote tracking branch',
    ],
    answer: 1,
    explanation: 'Hooks are scripts in `.git/hooks/` that run automatically at key points in Git\'s workflow (e.g. pre-commit, post-merge).',
  },
  {
    id: 75, topic: 'Algorithms', difficulty: 'Intermediate',
    question: 'What is the time complexity of merge sort?',
    options: ['O(n)', 'O(n log n)', 'O(n²)', 'O(log n)'],
    answer: 1,
    explanation: 'Merge sort always splits the array in half (log n levels) and merges in O(n) per level, giving guaranteed O(n log n) in all cases.',
  },
  {
    id: 76, topic: 'TypeScript', difficulty: 'Intermediate',
    question: 'What does `Pick<T, K>` do in TypeScript?',
    options: [
      'Removes properties K from T',
      'Constructs a type by picking a set of properties K from T',
      'Makes properties K optional in T',
      'Extracts the values of K from T',
    ],
    answer: 1,
    explanation: 'Pick<T, K> creates a new type with only the properties specified in the union K from T.',
  },
  {
    id: 77, topic: 'React', difficulty: 'Advanced',
    question: 'What is React Suspense used for?',
    options: [
      'Suspending component updates during heavy computation',
      'Declaratively specifying loading states while waiting for async operations (data fetching, lazy imports)',
      'Catching errors in the component tree',
      'Batching state updates',
    ],
    answer: 1,
    explanation: 'Suspense lets components declare loading states, used with React.lazy for code splitting and data libraries that support the Suspense protocol.',
  },
  {
    id: 78, topic: 'Data Structures', difficulty: 'Intermediate',
    question: 'What is the difference between a graph and a tree?',
    options: [
      'Trees can have cycles; graphs cannot',
      'A tree is a connected, acyclic graph with a designated root; a graph may have cycles and multiple components',
      'Graphs have nodes; trees have vertices',
      'They are interchangeable terms',
    ],
    answer: 1,
    explanation: 'Trees are a subset of graphs: connected, acyclic, with one root. Graphs have no such restrictions — they may be disconnected and have cycles.',
  },
  {
    id: 79, topic: 'HTML/CSS', difficulty: 'Advanced',
    question: 'What is the CSS `will-change` property used for?',
    options: [
      'To conditionally apply styles',
      'To hint to the browser that an element will change, allowing it to optimize (e.g. create compositor layers) in advance',
      'To animate properties automatically',
      'To define CSS transitions',
    ],
    answer: 1,
    explanation: '`will-change` informs the browser about upcoming changes (e.g. transform, opacity), letting it pre-optimize — but overuse causes excessive memory usage.',
  },
  {
    id: 80, topic: 'JavaScript', difficulty: 'Intermediate',
    question: 'What is the purpose of `Symbol` in JavaScript?',
    options: [
      'To represent mathematical symbols',
      'To create unique, immutable primitive values often used as object property keys',
      'To define regular expressions',
      'To create immutable strings',
    ],
    answer: 1,
    explanation: 'Symbols are unique primitives (Symbol("desc") !== Symbol("desc")) used as unique property keys, preventing accidental name collisions.',
  },
  {
    id: 81, topic: 'Python', difficulty: 'Advanced',
    question: 'What is the difference between `__str__` and `__repr__` in Python?',
    options: [
      'They are identical dunder methods',
      '__str__ returns human-readable string for end users; __repr__ returns an unambiguous representation for developers/debugging',
      '__repr__ is faster than __str__',
      '__str__ is for class names; __repr__ is for instance values',
    ],
    answer: 1,
    explanation: '__str__ is called by str() and print() for user-facing output. __repr__ is called by repr() for developer debugging, ideally showing how to recreate the object.',
  },
  {
    id: 82, topic: 'Algorithms', difficulty: 'Advanced',
    question: 'What is the purpose of the two-pointer technique?',
    options: [
      'To use two CPUs simultaneously',
      'To solve problems involving arrays or strings with two indices moving toward or away from each other, reducing O(n²) to O(n)',
      'To compare two separate arrays',
      'To enable parallel processing',
    ],
    answer: 1,
    explanation: 'Two pointers move through a sorted array/string simultaneously, often reducing brute-force O(n²) solutions to O(n) for problems like pair sums or palindrome checks.',
  },
  {
    id: 83, topic: 'React', difficulty: 'Intermediate',
    question: 'What is the difference between controlled and uncontrolled components in React?',
    options: [
      'Controlled components are class-based; uncontrolled are function-based',
      'Controlled components have their form data managed by React state; uncontrolled components manage their own state via the DOM',
      'Uncontrolled components are deprecated',
      'Controlled components always use refs',
    ],
    answer: 1,
    explanation: 'Controlled: React state is the single source of truth for input values. Uncontrolled: the DOM itself manages values, accessed via refs.',
  },
  {
    id: 84, topic: 'Data Structures', difficulty: 'Advanced',
    question: 'What is an LRU Cache?',
    options: [
      'A cache that evicts the most recently used item',
      'A cache that evicts the Least Recently Used item when at capacity, keeping frequently accessed items',
      'A cache with a last-read unlimited policy',
      'A read-only cache',
    ],
    answer: 1,
    explanation: 'LRU (Least Recently Used) Cache evicts the item not accessed for the longest time when full. Typically implemented with a hash map + doubly linked list for O(1) get/put.',
  },
  {
    id: 85, topic: 'TypeScript', difficulty: 'Advanced',
    question: 'What are template literal types in TypeScript?',
    options: [
      'Types that use template strings at runtime',
      'Types that construct string types by combining literals using template literal syntax: `${Type1}${Type2}`',
      'A way to write multiline type definitions',
      'Types that interpolate JavaScript expressions',
    ],
    answer: 1,
    explanation: 'Template literal types compose string types: `type Greeting = \`Hello, ${string}!\`` creates a type matching any string starting with "Hello, ".',
  },
];

const ALL_TOPICS: Topic[] = ['JavaScript', 'Python', 'HTML/CSS', 'SQL', 'Git', 'Data Structures', 'Algorithms', 'TypeScript', 'React'];
const DIFFICULTIES: Array<Difficulty | 'All'> = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const QUESTION_COUNT = 10;
const QUESTION_TIME = 30;

// ── Main Component ─────────────────────────────────────────────────────────────

type Screen = 'setup' | 'quiz' | 'results';

interface UserAnswer {
  questionId: number;
  selected: number;
  correct: boolean;
  timeSpent: number;
}

export default function CodingQuizTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const border = isDark ? '#2e2e2e' : '#e8e8e8';
  const heading = isDark ? '#e0e0e0' : '#111';
  const textColor = isDark ? '#c9c9c9' : '#333';
  const muted = isDark ? '#555' : '#bbb';
  const mutedText = isDark ? '#777' : '#999';

  const [screen, setScreen] = useState<Screen>('setup');
  const [selectedTopics, setSelectedTopics] = useState<Topic[]>(['JavaScript', 'TypeScript', 'React']);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');
  const [timerEnabled, setTimerEnabled] = useState(true);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [quizStartTime, setQuizStartTime] = useState(Date.now());
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('toolhub_quiz_scores');
      if (saved) setScores(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startQuiz() {
    let pool = QUESTIONS.filter((q) => selectedTopics.includes(q.topic));
    if (difficultyFilter !== 'All') pool = pool.filter((q) => q.difficulty === difficultyFilter);
    if (pool.length === 0) return;
    const picked = shuffle(pool).slice(0, QUESTION_COUNT);
    setQuestions(picked);
    setCurrentIndex(0);
    setAnswers([]);
    setSelectedOption(null);
    setRevealed(false);
    setTimeLeft(QUESTION_TIME);
    setQuizStartTime(Date.now());
    setQuestionStartTime(Date.now());
    setScreen('quiz');
  }

  // Timer
  useEffect(() => {
    if (screen !== 'quiz' || !timerEnabled || revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, currentIndex, revealed, timerEnabled]);

  function handleTimeout() {
    if (revealed) return;
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const answer: UserAnswer = {
      questionId: questions[currentIndex].id,
      selected: -1,
      correct: false,
      timeSpent,
    };
    setAnswers((prev) => [...prev, answer]);
    setRevealed(true);
  }

  function handleSelect(optionIndex: number) {
    if (revealed) return;
    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpent = (Date.now() - questionStartTime) / 1000;
    const correct = optionIndex === questions[currentIndex].answer;
    setSelectedOption(optionIndex);
    setRevealed(true);
    setAnswers((prev) => [...prev, { questionId: questions[currentIndex].id, selected: optionIndex, correct, timeSpent }]);
  }

  function nextQuestion() {
    if (currentIndex + 1 >= questions.length) {
      finishQuiz();
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setRevealed(false);
      setTimeLeft(QUESTION_TIME);
      setQuestionStartTime(Date.now());
    }
  }

  function finishQuiz() {
    const totalTime = Math.round((Date.now() - quizStartTime) / 1000);
    const score = answers.filter((a) => a.correct).length + (answers.length < questions.length && revealed && answers[answers.length - 1]?.correct ? 0 : 0);
    const finalScore = answers.filter((a) => a.correct).length;
    const newScore: QuizScore = {
      score: finalScore,
      total: questions.length,
      date: new Date().toLocaleDateString(),
      topic: selectedTopics.join(', '),
    };
    const newScores = [newScore, ...scores].sort((a, b) => b.score - a.score).slice(0, 5);
    setScores(newScores);
    localStorage.setItem('toolhub_quiz_scores', JSON.stringify(newScores));
    setScreen('results');
  }

  const currentQ = questions[currentIndex];
  const totalCorrect = answers.filter((a) => a.correct).length;

  function optionBg(i: number): string {
    if (!revealed) {
      return selectedOption === i
        ? (isDark ? '#1e3a2a' : '#e6f7ef')
        : (isDark ? '#1a1a1a' : '#f9f9f9');
    }
    if (i === currentQ?.answer) return isDark ? '#1e3a2a' : '#d4edda';
    if (selectedOption === i && i !== currentQ?.answer) return isDark ? '#3a1e1e' : '#f8d7da';
    return isDark ? '#1a1a1a' : '#f9f9f9';
  }

  function optionBorder(i: number): string {
    if (!revealed) {
      return selectedOption === i ? PRIMARY : border;
    }
    if (i === currentQ?.answer) return '#50C878';
    if (selectedOption === i && i !== currentQ?.answer) return '#e05555';
    return border;
  }

  function optionIcon(i: number) {
    if (!revealed) return null;
    if (i === currentQ?.answer) return <CheckCircleOutlined style={{ color: '#50C878' }} />;
    if (selectedOption === i) return <CloseCircleOutlined style={{ color: '#e05555' }} />;
    return null;
  }

  const diffColor: Record<Difficulty, string> = {
    Beginner: '#52c41a',
    Intermediate: '#faad14',
    Advanced: '#f5222d',
  };

  // ── Setup Screen ─────────────────────────────────────────────────────────────
  if (screen === 'setup') {
    const availableCount = (() => {
      let pool = QUESTIONS.filter((q) => selectedTopics.includes(q.topic));
      if (difficultyFilter !== 'All') pool = pool.filter((q) => q.difficulty === difficultyFilter);
      return pool.length;
    })();

    return (
      <div style={{ background: bg, minHeight: '100vh', maxWidth: 720, margin: '0 auto' }}>
        <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16 }} bodyStyle={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <BookOutlined style={{ fontSize: 40, color: PRIMARY, display: 'block', marginBottom: 12 }} />
            <Title level={3} style={{ color: heading, margin: 0 }}>Coding Quiz</Title>
            <Text style={{ color: mutedText }}>Test your programming knowledge across 9 topics</Text>
          </div>

          {/* Topic selector */}
          <div style={{ marginBottom: 24 }}>
            <Text style={{ color: textColor, fontWeight: 600, display: 'block', marginBottom: 10 }}>Select Topics</Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_TOPICS.map((topic) => {
                const active = selectedTopics.includes(topic);
                return (
                  <div
                    key={topic}
                    onClick={() => {
                      setSelectedTopics((prev) =>
                        prev.includes(topic)
                          ? prev.filter((t) => t !== topic)
                          : [...prev, topic]
                      );
                    }}
                    style={{
                      padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      border: `1px solid ${active ? PRIMARY : border}`,
                      background: active ? PRIMARY_BG : (isDark ? '#1a1a1a' : '#f5f5f5'),
                      color: active ? PRIMARY : textColor,
                      transition: 'all 0.15s',
                    }}
                  >
                    {topic}
                  </div>
                );
              })}
            </div>
            <Button
              size="small" type="link"
              onClick={() => setSelectedTopics(selectedTopics.length === ALL_TOPICS.length ? [] : [...ALL_TOPICS])}
              style={{ color: PRIMARY, padding: '4px 0', marginTop: 6 }}
            >
              {selectedTopics.length === ALL_TOPICS.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {/* Difficulty */}
          <div style={{ marginBottom: 24 }}>
            <Text style={{ color: textColor, fontWeight: 600, display: 'block', marginBottom: 10 }}>Difficulty</Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DIFFICULTIES.map((d) => {
                const active = difficultyFilter === d;
                return (
                  <div
                    key={d}
                    onClick={() => setDifficultyFilter(d as Difficulty | 'All')}
                    style={{
                      padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      border: `1px solid ${active ? PRIMARY : border}`,
                      background: active ? PRIMARY_BG : (isDark ? '#1a1a1a' : '#f5f5f5'),
                      color: active ? PRIMARY : textColor,
                      transition: 'all 0.15s',
                    }}
                  >
                    {d}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timer toggle */}
          <div style={{ marginBottom: 28 }}>
            <Checkbox
              checked={timerEnabled}
              onChange={(e) => setTimerEnabled(e.target.checked)}
              style={{ color: textColor }}
            >
              Enable 30-second timer per question
            </Checkbox>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <Text style={{ color: mutedText, fontSize: 13 }}>
              {availableCount} questions available · {Math.min(availableCount, QUESTION_COUNT)} will be selected
            </Text>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                onClick={() => setShowLeaderboard(true)}
                icon={<TrophyOutlined />}
                style={{ borderColor: border, color: textColor }}
              >
                Leaderboard
              </Button>
              <Button
                type="primary"
                disabled={selectedTopics.length === 0 || availableCount === 0}
                onClick={startQuiz}
                icon={<ArrowRightOutlined />}
                style={{ background: PRIMARY, borderColor: PRIMARY }}
              >
                Start Quiz
              </Button>
            </div>
          </div>
        </Card>

        {/* Leaderboard Modal */}
        <Modal
          open={showLeaderboard}
          onCancel={() => setShowLeaderboard(false)}
          footer={null}
          title={<span style={{ color: heading }}><TrophyOutlined style={{ color: '#ffd700', marginRight: 8 }} />Top Scores</span>}
          styles={{ content: { background: cardBg, border: `1px solid ${border}` } }}
        >
          {scores.length === 0 ? (
            <Text style={{ color: muted }}>No scores yet. Take a quiz!</Text>
          ) : (
            scores.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: i === 0 ? '#ffd700' : muted, fontWeight: 700, fontSize: 16 }}>#{i + 1}</span>
                  <div>
                    <div style={{ color: textColor, fontWeight: 600 }}>{s.score}/{s.total} correct</div>
                    <div style={{ color: muted, fontSize: 11 }}>{s.topic}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: PRIMARY, fontWeight: 700 }}>{Math.round((s.score / s.total) * 100)}%</div>
                  <div style={{ color: muted, fontSize: 11 }}>{s.date}</div>
                </div>
              </div>
            ))
          )}
        </Modal>
      </div>
    );
  }

  // ── Quiz Screen ──────────────────────────────────────────────────────────────
  if (screen === 'quiz' && currentQ) {
    const progressPct = Math.round((currentIndex / questions.length) * 100);
    const timerPct = (timeLeft / QUESTION_TIME) * 100;
    const timerColor = timeLeft > 15 ? PRIMARY : timeLeft > 7 ? '#faad14' : '#f5222d';

    return (
      <div style={{ background: bg, minHeight: '100vh', maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Text style={{ color: textColor, fontWeight: 600 }}>
            Question {currentIndex + 1} / {questions.length}
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag color={currentQ.topic === 'JavaScript' ? 'gold' : 'blue'} style={{ fontSize: 11 }}>{currentQ.topic}</Tag>
            <Tag style={{ fontSize: 11, color: diffColor[currentQ.difficulty], borderColor: diffColor[currentQ.difficulty], background: 'transparent' }}>
              {currentQ.difficulty}
            </Tag>
          </div>
        </div>

        {/* Progress */}
        <Progress percent={progressPct} strokeColor={PRIMARY} trailColor={isDark ? '#2e2e2e' : '#e8e8e8'} showInfo={false} size={['100%', 4]} style={{ marginBottom: timerEnabled ? 8 : 16 }} />

        {/* Timer */}
        {timerEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <ClockCircleOutlined style={{ color: timerColor, fontSize: 14 }} />
            <Progress
              percent={timerPct}
              strokeColor={timerColor}
              trailColor={isDark ? '#2e2e2e' : '#e8e8e8'}
              showInfo={false}
              size={['100%', 6]}
            />
            <Text style={{ color: timerColor, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{timeLeft}s</Text>
          </div>
        )}

        {/* Question Card */}
        <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, marginBottom: 16 }} bodyStyle={{ padding: 28 }}>
          <QuestionCircleOutlined style={{ color: PRIMARY, fontSize: 20, marginBottom: 12, display: 'block' }} />
          <Text style={{ color: heading, fontSize: 17, fontWeight: 600, lineHeight: 1.6, display: 'block' }}>
            {currentQ.question}
          </Text>
        </Card>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {currentQ.options.map((opt, i) => (
            <div
              key={i}
              onClick={() => !revealed && handleSelect(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderRadius: 10, border: `1.5px solid ${optionBorder(i)}`,
                background: optionBg(i), cursor: revealed ? 'default' : 'pointer',
                transition: 'all 0.15s', gap: 10,
              }}
              onMouseEnter={(e) => { if (!revealed) (e.currentTarget as HTMLElement).style.borderColor = PRIMARY; }}
              onMouseLeave={(e) => { if (!revealed) (e.currentTarget as HTMLElement).style.borderColor = optionBorder(i); }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: PRIMARY, fontWeight: 700, fontSize: 13, width: 20, flexShrink: 0 }}>
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                <Text style={{ color: textColor, fontSize: 14 }}>{opt}</Text>
              </div>
              {optionIcon(i)}
            </div>
          ))}
        </div>

        {/* Explanation */}
        {revealed && (
          <Card
            style={{
              background: isDark ? '#1a2e1a' : '#f0fdf4',
              border: `1px solid ${PRIMARY_BORDER}`,
              borderRadius: 10, marginBottom: 16,
            }}
            bodyStyle={{ padding: '14px 18px' }}
          >
            <Text style={{ color: PRIMARY, fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 12 }}>Explanation</Text>
            <Text style={{ color: textColor, fontSize: 13, lineHeight: 1.7 }}>{currentQ.explanation}</Text>
          </Card>
        )}

        {revealed && (
          <Button
            type="primary" block size="large"
            onClick={nextQuestion}
            style={{ background: PRIMARY, borderColor: PRIMARY, borderRadius: 10 }}
          >
            {currentIndex + 1 >= questions.length ? 'View Results' : 'Next Question'} <ArrowRightOutlined />
          </Button>
        )}
      </div>
    );
  }

  // ── Results Screen ────────────────────────────────────────────────────────────
  if (screen === 'results') {
    const pct = Math.round((totalCorrect / questions.length) * 100);
    const totalTime = Math.round((Date.now() - quizStartTime) / 1000);
    const wrongAnswers = answers.filter((a) => !a.correct);

    return (
      <div style={{ background: bg, minHeight: '100vh', maxWidth: 720, margin: '0 auto' }}>
        {/* Score Card */}
        <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 16, marginBottom: 20, textAlign: 'center' }} bodyStyle={{ padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            {pct >= 80
              ? <TrophyOutlined style={{ fontSize: 52, color: '#ffd700' }} />
              : pct >= 60
              ? <StarOutlined style={{ fontSize: 52, color: '#faad14' }} />
              : <BookOutlined style={{ fontSize: 52, color: PRIMARY }} />
            }
          </div>
          <Title level={2} style={{ color: heading, margin: '0 0 8px' }}>
            {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep practicing!'}
          </Title>
          <div style={{ fontSize: 48, fontWeight: 800, color: PRIMARY, lineHeight: 1, marginBottom: 8 }}>
            {totalCorrect}/{questions.length}
          </div>
          <Text style={{ color: mutedText }}>{pct}% correct</Text>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            {[
              { label: 'Correct', value: totalCorrect, color: '#50C878' },
              { label: 'Wrong', value: questions.length - totalCorrect, color: '#e05555' },
              { label: 'Time', value: `${totalTime}s`, color: muted },
            ].map((s) => (
              <Col key={s.label} span={8}>
                <div style={{ background: isDark ? '#1a1a1a' : '#f5f5f5', borderRadius: 10, padding: 16 }}>
                  <div style={{ color: s.color, fontSize: 24, fontWeight: 800 }}>{s.value}</div>
                  <div style={{ color: muted, fontSize: 12 }}>{s.label}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Wrong answers review */}
        {wrongAnswers.length > 0 && (
          <Card style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 14, marginBottom: 20 }} bodyStyle={{ padding: 24 }}>
            <Title level={5} style={{ color: heading, margin: '0 0 16px' }}>Review Wrong Answers</Title>
            {wrongAnswers.map((ans) => {
              const q = questions.find((q) => q.id === ans.questionId);
              if (!q) return null;
              return (
                <div key={ans.questionId} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${border}` }}>
                  <Text style={{ color: heading, fontWeight: 600, display: 'block', marginBottom: 8, fontSize: 14 }}>{q.question}</Text>
                  {ans.selected >= 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <CloseCircleOutlined style={{ color: '#e05555', fontSize: 12 }} />
                      <Text style={{ color: '#e05555', fontSize: 12 }}>Your answer: {q.options[ans.selected]}</Text>
                    </div>
                  )}
                  {ans.selected < 0 && (
                    <Text style={{ color: '#e05555', fontSize: 12, display: 'block', marginBottom: 4 }}>Time ran out — no answer selected</Text>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <CheckCircleOutlined style={{ color: '#50C878', fontSize: 12 }} />
                    <Text style={{ color: '#50C878', fontSize: 12 }}>Correct: {q.options[q.answer]}</Text>
                  </div>
                  <Text style={{ color: mutedText, fontSize: 12, fontStyle: 'italic' }}>{q.explanation}</Text>
                </div>
              );
            })}
          </Card>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Button
            type="primary" icon={<ReloadOutlined />}
            onClick={startQuiz}
            style={{ background: PRIMARY, borderColor: PRIMARY }}
          >
            Retry Same Topics
          </Button>
          <Button icon={<BookOutlined />} onClick={() => setScreen('setup')} style={{ borderColor: border, color: textColor }}>
            Change Settings
          </Button>
          <Button icon={<TrophyOutlined />} onClick={() => setShowLeaderboard(true)} style={{ borderColor: border, color: textColor }}>
            Leaderboard
          </Button>
        </div>

        {/* Leaderboard Modal */}
        <Modal
          open={showLeaderboard}
          onCancel={() => setShowLeaderboard(false)}
          footer={null}
          title={<span style={{ color: heading }}><TrophyOutlined style={{ color: '#ffd700', marginRight: 8 }} />Top Scores</span>}
          styles={{ content: { background: cardBg, border: `1px solid ${border}` } }}
        >
          {scores.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: i === 0 ? '#ffd700' : muted, fontWeight: 700, fontSize: 16 }}>#{i + 1}</span>
                <div>
                  <div style={{ color: textColor, fontWeight: 600 }}>{s.score}/{s.total} correct</div>
                  <div style={{ color: muted, fontSize: 11 }}>{s.topic}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: PRIMARY, fontWeight: 700 }}>{Math.round((s.score / s.total) * 100)}%</div>
                <div style={{ color: muted, fontSize: 11 }}>{s.date}</div>
              </div>
            </div>
          ))}
        </Modal>
      </div>
    );
  }

  return null;
}
