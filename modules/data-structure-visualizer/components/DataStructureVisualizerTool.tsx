'use client';

import React, { useState, useRef } from 'react';
import { Input, Button, Tabs, Tag } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  SortAscendingOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ListNode {
  id: number;
  value: number;
  highlighted: boolean;
}

interface BSTNode {
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
  highlighted: boolean;
  pathHighlighted: boolean;
}

type DSKey = 'stack' | 'queue' | 'linkedlist' | 'bst';

// ─── Helpers ──────────────────────────────────────────────────────────────────

let nodeIdCounter = 0;
const newId = () => ++nodeIdCounter;

function bstInsert(root: BSTNode | null, value: number): BSTNode {
  if (root === null) return { value, left: null, right: null, highlighted: true, pathHighlighted: false };
  if (value < root.value) return { ...root, left: bstInsert(root.left, value) };
  if (value > root.value) return { ...root, right: bstInsert(root.right, value) };
  return root;
}

function bstDelete(root: BSTNode | null, value: number): BSTNode | null {
  if (!root) return null;
  if (value < root.value) return { ...root, left: bstDelete(root.left, value) };
  if (value > root.value) return { ...root, right: bstDelete(root.right, value) };
  if (!root.left) return root.right;
  if (!root.right) return root.left;
  // Find inorder successor (min of right subtree)
  let successor = root.right;
  while (successor.left) successor = successor.left;
  return { ...root, value: successor.value, right: bstDelete(root.right, successor.value) };
}

function bstHighlightPath(root: BSTNode | null, value: number): BSTNode | null {
  if (!root) return null;
  if (root.value === value) {
    return { ...root, highlighted: true, pathHighlighted: false };
  }
  if (value < root.value) {
    return { ...root, pathHighlighted: true, left: bstHighlightPath(root.left, value), right: clearHighlight(root.right) };
  }
  return { ...root, pathHighlighted: true, right: bstHighlightPath(root.right, value), left: clearHighlight(root.left) };
}

function clearHighlight(root: BSTNode | null): BSTNode | null {
  if (!root) return null;
  return { ...root, highlighted: false, pathHighlighted: false, left: clearHighlight(root.left), right: clearHighlight(root.right) };
}

function bstInorder(root: BSTNode | null): number[] {
  if (!root) return [];
  return [...bstInorder(root.left), root.value, ...bstInorder(root.right)];
}

function bstHighlightInorder(root: BSTNode | null, values: number[], idx: number): BSTNode | null {
  if (!root) return null;
  const isHighlighted = values[idx] === root.value;
  return {
    ...root,
    highlighted: isHighlighted,
    pathHighlighted: false,
    left: bstHighlightInorder(root.left, values, idx),
    right: bstHighlightInorder(root.right, values, idx),
  };
}

function getBSTHeight(root: BSTNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(getBSTHeight(root.left), getBSTHeight(root.right));
}

// ─── Node Box ─────────────────────────────────────────────────────────────────

interface NodeBoxProps {
  value: number | string;
  highlighted?: boolean;
  active?: boolean;
  label?: string;
  labelPos?: 'top' | 'bottom';
  isDark: boolean;
  cardBorder: string;
  size?: 'sm' | 'md';
}

function NodeBox({ value, highlighted, active, label, labelPos = 'top', isDark, cardBorder, size = 'md' }: NodeBoxProps) {
  const boxSize = size === 'sm' ? 36 : 44;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {label && labelPos === 'top' && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#50C878',
          background: 'rgba(80,200,120,0.15)', borderRadius: 4,
          padding: '1px 6px', letterSpacing: '0.04em',
        }}>
          {label}
        </div>
      )}
      <div
        style={{
          width: boxSize,
          height: boxSize,
          borderRadius: 8,
          background: highlighted || active
            ? '#50C878'
            : isDark ? '#2a2a2a' : '#f0f0f0',
          border: `2px solid ${highlighted || active ? '#50C878' : cardBorder}`,
          color: highlighted || active ? '#000' : isDark ? '#c9c9c9' : '#333',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size === 'sm' ? 12 : 14,
          transition: 'all 0.2s',
          boxShadow: highlighted ? '0 0 12px rgba(80,200,120,0.4)' : 'none',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      {label && labelPos === 'bottom' && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: '#50C878',
          background: 'rgba(80,200,120,0.15)', borderRadius: 4,
          padding: '1px 6px', letterSpacing: '0.04em',
        }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ─── Arrow ────────────────────────────────────────────────────────────────────

function Arrow({ direction = 'right', color = '#50C878' }: { direction?: 'right' | 'down'; color?: string }) {
  if (direction === 'down') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color, fontSize: 14, lineHeight: 1 }}>
        <div style={{ width: 2, height: 12, background: color }} />
        <ArrowDownOutlined style={{ fontSize: 10 }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', color, fontSize: 14 }}>
      <div style={{ height: 2, width: 14, background: color }} />
      <ArrowRightOutlined style={{ fontSize: 10 }} />
    </div>
  );
}

// ─── Stack Visualizer ─────────────────────────────────────────────────────────

function StackVisualizer({ isDark, cardBg, cardBorder, textColor, subColor, panelBg }: {
  isDark: boolean; cardBg: string; cardBorder: string; textColor: string; subColor: string; panelBg: string;
}) {
  const [stack, setStack] = useState<ListNode[]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('Stack is empty. Push some values!');
  const [animatingIdx, setAnimatingIdx] = useState<number | null>(null);

  const push = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    const newNode: ListNode = { id: newId(), value: val, highlighted: true };
    setStack((prev) => [newNode, ...prev]);
    setAnimatingIdx(0);
    setMessage(`Pushed ${val} onto the stack. Stack size: ${stack.length + 1}`);
    setInput('');
    setTimeout(() => {
      setStack((prev) => prev.map((n, i) => i === 0 ? { ...n, highlighted: false } : n));
      setAnimatingIdx(null);
    }, 800);
  };

  const pop = () => {
    if (stack.length === 0) { setMessage('Stack is empty. Nothing to pop!'); return; }
    const top = stack[0];
    setStack((prev) => prev.map((n, i) => i === 0 ? { ...n, highlighted: true } : n));
    setAnimatingIdx(0);
    setTimeout(() => {
      setStack((prev) => prev.slice(1));
      setAnimatingIdx(null);
      setMessage(`Popped ${top.value} from the stack. Stack size: ${stack.length - 1}`);
    }, 600);
  };

  const peek = () => {
    if (stack.length === 0) { setMessage('Stack is empty.'); return; }
    setStack((prev) => prev.map((n, i) => i === 0 ? { ...n, highlighted: true } : n));
    setTimeout(() => {
      setStack((prev) => prev.map((n) => ({ ...n, highlighted: false })));
    }, 1000);
    setMessage(`Top of stack: ${stack[0].value}`);
  };

  const clear = () => {
    setStack([]);
    setMessage('Stack cleared.');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={push}
          placeholder="Enter number"
          style={{ width: 140 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={push} style={{ background: '#50C878', borderColor: '#50C878', color: '#000' }}>
          Push
        </Button>
        <Button icon={<DeleteOutlined />} onClick={pop}>Pop</Button>
        <Button icon={<SearchOutlined />} onClick={peek}>Peek</Button>
        <Button danger onClick={clear}>Clear</Button>
        <Tag color="green" style={{ marginLeft: 'auto' }}>LIFO</Tag>
        <span style={{ fontSize: 12, color: subColor }}>Size: {stack.length}</span>
      </div>

      <div
        style={{
          background: panelBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          color: textColor,
          minHeight: 36,
        }}
      >
        {message}
      </div>

      <div
        style={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0,
          paddingTop: 12,
        }}
      >
        {stack.length === 0 ? (
          <div style={{ color: subColor, fontSize: 13, marginTop: 80 }}>Stack is empty</div>
        ) : (
          <>
            {stack.map((node, idx) => (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {idx === 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#50C878', marginBottom: 4 }}>
                    TOP
                  </div>
                )}
                <div
                  style={{
                    width: 160,
                    height: 44,
                    background: node.highlighted ? '#50C878' : isDark ? '#2a2a2a' : '#f0f0f0',
                    border: `2px solid ${node.highlighted ? '#50C878' : cardBorder}`,
                    borderRadius: idx === 0 ? '8px 8px 0 0' : idx === stack.length - 1 ? '0 0 8px 8px' : 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 15,
                    color: node.highlighted ? '#000' : textColor,
                    transition: 'all 0.2s',
                    boxShadow: node.highlighted ? '0 0 12px rgba(80,200,120,0.4)' : 'none',
                    borderBottom: idx < stack.length - 1 ? `1px solid ${isDark ? '#333' : '#ddd'}` : undefined,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {node.value}
                </div>
              </div>
            ))}
            <div style={{
              width: 160, height: 6, background: isDark ? '#333' : '#e0e0e0',
              borderRadius: '0 0 4px 4px',
            }} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Queue Visualizer ─────────────────────────────────────────────────────────

function QueueVisualizer({ isDark, cardBg, cardBorder, textColor, subColor, panelBg }: {
  isDark: boolean; cardBg: string; cardBorder: string; textColor: string; subColor: string; panelBg: string;
}) {
  const [queue, setQueue] = useState<ListNode[]>([]);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('Queue is empty. Enqueue some values!');

  const enqueue = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    const newNode: ListNode = { id: newId(), value: val, highlighted: true };
    setQueue((prev) => [...prev, newNode]);
    setMessage(`Enqueued ${val} at rear. Queue size: ${queue.length + 1}`);
    setInput('');
    setTimeout(() => {
      setQueue((prev) => prev.map((n) => n.id === newNode.id ? { ...n, highlighted: false } : n));
    }, 800);
  };

  const dequeue = () => {
    if (queue.length === 0) { setMessage('Queue is empty. Nothing to dequeue!'); return; }
    const front = queue[0];
    setQueue((prev) => prev.map((n, i) => i === 0 ? { ...n, highlighted: true } : n));
    setTimeout(() => {
      setQueue((prev) => prev.slice(1));
      setMessage(`Dequeued ${front.value} from front. Queue size: ${queue.length - 1}`);
    }, 600);
  };

  const peek = () => {
    if (queue.length === 0) { setMessage('Queue is empty.'); return; }
    setQueue((prev) => prev.map((n, i) => i === 0 ? { ...n, highlighted: true } : n));
    setTimeout(() => {
      setQueue((prev) => prev.map((n) => ({ ...n, highlighted: false })));
    }, 1000);
    setMessage(`Front of queue: ${queue[0].value}`);
  };

  const clear = () => {
    setQueue([]);
    setMessage('Queue cleared.');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={enqueue}
          placeholder="Enter number"
          style={{ width: 140 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={enqueue} style={{ background: '#50C878', borderColor: '#50C878', color: '#000' }}>
          Enqueue
        </Button>
        <Button icon={<DeleteOutlined />} onClick={dequeue}>Dequeue</Button>
        <Button icon={<SearchOutlined />} onClick={peek}>Peek</Button>
        <Button danger onClick={clear}>Clear</Button>
        <Tag color="blue" style={{ marginLeft: 'auto' }}>FIFO</Tag>
        <span style={{ fontSize: 12, color: subColor }}>Size: {queue.length}</span>
      </div>

      <div
        style={{
          background: panelBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          color: textColor,
          minHeight: 36,
        }}
      >
        {message}
      </div>

      <div
        style={{
          minHeight: 300,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          paddingTop: 12,
          overflowX: 'auto',
        }}
      >
        {queue.length === 0 ? (
          <div style={{ color: subColor, fontSize: 13, textAlign: 'center' }}>Queue is empty</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, paddingBottom: 24, minWidth: 'max-content', margin: '0 auto' }}>
            {queue.map((node, idx) => (
              <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {idx === 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#50C878', marginBottom: 4 }}>FRONT</div>
                )}
                {idx === queue.length - 1 && idx !== 0 && (
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1890ff', marginBottom: 4 }}>REAR</div>
                )}
                {idx !== 0 && idx !== queue.length - 1 && (
                  <div style={{ marginBottom: 4, height: 16 }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 52,
                      height: 44,
                      background: node.highlighted ? '#50C878' : isDark ? '#2a2a2a' : '#f0f0f0',
                      border: `2px solid ${node.highlighted ? '#50C878' : cardBorder}`,
                      borderRadius: idx === 0 ? '8px 0 0 8px' : idx === queue.length - 1 ? '0 8px 8px 0' : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      color: node.highlighted ? '#000' : textColor,
                      transition: 'all 0.2s',
                      boxShadow: node.highlighted ? '0 0 10px rgba(80,200,120,0.4)' : 'none',
                      borderRight: idx < queue.length - 1 ? `1px dashed ${isDark ? '#444' : '#ccc'}` : undefined,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {node.value}
                  </div>
                  {idx < queue.length - 1 && (
                    <div style={{ width: 0 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Linked List Visualizer ───────────────────────────────────────────────────

function LinkedListVisualizer({ isDark, cardBg, cardBorder, textColor, subColor, panelBg }: {
  isDark: boolean; cardBg: string; cardBorder: string; textColor: string; subColor: string; panelBg: string;
}) {
  const [list, setList] = useState<ListNode[]>([]);
  const [input, setInput] = useState('');
  const [indexInput, setIndexInput] = useState('');
  const [message, setMessage] = useState('Linked list is empty. Insert some nodes!');

  const highlight = (ids: number[], duration = 900) => {
    setList((prev) => prev.map((n) => ({ ...n, highlighted: ids.includes(n.id) })));
    setTimeout(() => {
      setList((prev) => prev.map((n) => ({ ...n, highlighted: false })));
    }, duration);
  };

  const insertHead = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    const node: ListNode = { id: newId(), value: val, highlighted: true };
    setList((prev) => [node, ...prev]);
    setMessage(`Inserted ${val} at head. Size: ${list.length + 1}`);
    setInput('');
    setTimeout(() => setList((prev) => prev.map((n) => n.id === node.id ? { ...n, highlighted: false } : n)), 800);
  };

  const insertTail = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    const node: ListNode = { id: newId(), value: val, highlighted: true };
    setList((prev) => [...prev, node]);
    setMessage(`Inserted ${val} at tail. Size: ${list.length + 1}`);
    setInput('');
    setTimeout(() => setList((prev) => prev.map((n) => n.id === node.id ? { ...n, highlighted: false } : n)), 800);
  };

  const insertAtIndex = () => {
    const val = parseInt(input, 10);
    const idx = parseInt(indexInput, 10);
    if (isNaN(val) || isNaN(idx) || idx < 0 || idx > list.length) {
      setMessage('Invalid value or index.'); return;
    }
    const node: ListNode = { id: newId(), value: val, highlighted: true };
    setList((prev) => {
      const newList = [...prev];
      newList.splice(idx, 0, node);
      return newList;
    });
    setMessage(`Inserted ${val} at index ${idx}. Size: ${list.length + 1}`);
    setInput('');
    setTimeout(() => setList((prev) => prev.map((n) => n.id === node.id ? { ...n, highlighted: false } : n)), 800);
  };

  const deleteHead = () => {
    if (list.length === 0) { setMessage('List is empty.'); return; }
    const head = list[0];
    highlight([head.id], 500);
    setTimeout(() => {
      setList((prev) => prev.slice(1));
      setMessage(`Deleted head node (${head.value}). Size: ${list.length - 1}`);
    }, 500);
  };

  const deleteTail = () => {
    if (list.length === 0) { setMessage('List is empty.'); return; }
    const tail = list[list.length - 1];
    highlight([tail.id], 500);
    setTimeout(() => {
      setList((prev) => prev.slice(0, -1));
      setMessage(`Deleted tail node (${tail.value}). Size: ${list.length - 1}`);
    }, 500);
  };

  const deleteAtIndex = () => {
    const idx = parseInt(indexInput, 10);
    if (isNaN(idx) || idx < 0 || idx >= list.length) {
      setMessage('Invalid index.'); return;
    }
    const node = list[idx];
    highlight([node.id], 500);
    setTimeout(() => {
      setList((prev) => prev.filter((_, i) => i !== idx));
      setMessage(`Deleted node at index ${idx} (value: ${node.value}). Size: ${list.length - 1}`);
    }, 500);
  };

  const search = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    const idx = list.findIndex((n) => n.value === val);
    if (idx === -1) {
      setMessage(`Value ${val} not found in the list.`);
    } else {
      highlight([list[idx].id]);
      setMessage(`Found ${val} at index ${idx}.`);
    }
  };

  const clear = () => {
    setList([]);
    setMessage('List cleared.');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Value"
          style={{ width: 100 }}
        />
        <Input
          value={indexInput}
          onChange={(e) => setIndexInput(e.target.value)}
          placeholder="Index"
          style={{ width: 80 }}
        />
        <Button type="primary" onClick={insertHead} style={{ background: '#50C878', borderColor: '#50C878', color: '#000' }}>
          Insert Head
        </Button>
        <Button onClick={insertTail}>Insert Tail</Button>
        <Button onClick={insertAtIndex}>Insert @Index</Button>
        <Button danger onClick={deleteHead}>Del Head</Button>
        <Button danger onClick={deleteTail}>Del Tail</Button>
        <Button danger onClick={deleteAtIndex}>Del @Index</Button>
        <Button icon={<SearchOutlined />} onClick={search}>Search</Button>
        <Button danger onClick={clear}>Clear</Button>
        <span style={{ fontSize: 12, color: subColor, marginLeft: 'auto' }}>Size: {list.length}</span>
      </div>

      <div
        style={{
          background: panelBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          color: textColor,
          minHeight: 36,
        }}
      >
        {message}
      </div>

      <div
        style={{
          minHeight: 300,
          display: 'flex',
          alignItems: 'center',
          padding: '24px 8px',
          overflowX: 'auto',
        }}
      >
        {list.length === 0 ? (
          <div style={{ color: subColor, fontSize: 13, margin: '0 auto' }}>List is empty</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'max-content', margin: '0 auto' }}>
            {/* HEAD label */}
            <div style={{ fontSize: 10, fontWeight: 700, color: '#50C878', marginRight: 6 }}>HEAD</div>
            <Arrow direction="right" />
            {list.map((node, idx) => (
              <React.Fragment key={node.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: 10, color: subColor, marginBottom: 4 }}>[{idx}]</div>
                  <NodeBox
                    value={node.value}
                    highlighted={node.highlighted}
                    isDark={isDark}
                    cardBorder={cardBorder}
                  />
                </div>
                {idx < list.length - 1 && (
                  <Arrow direction="right" />
                )}
              </React.Fragment>
            ))}
            <Arrow direction="right" />
            <div
              style={{
                width: 36,
                height: 44,
                borderRadius: 8,
                border: `2px dashed ${isDark ? '#444' : '#ccc'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: subColor,
              }}
            >
              null
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1890ff', marginLeft: 6 }}>TAIL</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BST Node Renderer ────────────────────────────────────────────────────────

function BSTNodeRenderer({
  node, isDark, cardBorder, textColor,
}: {
  node: BSTNode;
  isDark: boolean;
  cardBorder: string;
  textColor: string;
}) {
  const hasChildren = node.left !== null || node.right !== null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
      {/* Node box */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: node.highlighted ? '#50C878' : node.pathHighlighted ? 'rgba(80,200,120,0.2)' : isDark ? '#2a2a2a' : '#f0f0f0',
          border: `2px solid ${node.highlighted ? '#50C878' : node.pathHighlighted ? '#50C878' : cardBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 13,
          color: node.highlighted ? '#000' : textColor,
          transition: 'all 0.2s',
          boxShadow: node.highlighted ? '0 0 12px rgba(80,200,120,0.4)' : 'none',
          zIndex: 1,
          position: 'relative',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {node.value}
      </div>

      {hasChildren && (
        <div style={{ display: 'flex', gap: 8, marginTop: 0, position: 'relative' }}>
          {/* Left branch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {node.left ? (
              <>
                <div style={{
                  width: 2, height: 20,
                  background: node.left.pathHighlighted || node.left.highlighted ? '#50C878' : isDark ? '#444' : '#ccc',
                  transform: 'rotate(-15deg)',
                  transformOrigin: 'top center',
                  marginBottom: 0,
                }} />
                <BSTNodeRenderer node={node.left} isDark={isDark} cardBorder={cardBorder} textColor={textColor} />
              </>
            ) : (
              <div style={{ width: 40, height: 60 }} />
            )}
          </div>

          {/* Right branch */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {node.right ? (
              <>
                <div style={{
                  width: 2, height: 20,
                  background: node.right.pathHighlighted || node.right.highlighted ? '#50C878' : isDark ? '#444' : '#ccc',
                  transform: 'rotate(15deg)',
                  transformOrigin: 'top center',
                  marginBottom: 0,
                }} />
                <BSTNodeRenderer node={node.right} isDark={isDark} cardBorder={cardBorder} textColor={textColor} />
              </>
            ) : (
              <div style={{ width: 40, height: 60 }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BST Visualizer ───────────────────────────────────────────────────────────

function BSTVisualizer({ isDark, cardBg, cardBorder, textColor, subColor, panelBg }: {
  isDark: boolean; cardBg: string; cardBorder: string; textColor: string; subColor: string; panelBg: string;
}) {
  const [root, setRoot] = useState<BSTNode | null>(null);
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('BST is empty. Insert some values!');
  const [size, setSize] = useState(0);
  const traversalTimerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    traversalTimerRef.current.forEach(clearTimeout);
    traversalTimerRef.current = [];
  };

  const insert = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    clearTimers();
    const newRoot = bstInsert(root ? clearHighlight(root) : null, val);
    setRoot(newRoot);
    setSize((s) => s + 1);
    setMessage(`Inserted ${val}. Tree size: ${size + 1}`);
    setInput('');
    const t = setTimeout(() => {
      setRoot((r) => r ? clearHighlight(r) : null);
    }, 1000);
    traversalTimerRef.current.push(t);
  };

  const deleteNode = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    clearTimers();
    const prevSize = size;
    const newRoot = bstDelete(root ? clearHighlight(root) : null, val);
    // Check if actually deleted
    const newSize = countNodes(newRoot);
    if (newSize === prevSize) {
      setMessage(`Value ${val} not found in BST.`);
    } else {
      setRoot(newRoot);
      setSize(newSize);
      setMessage(`Deleted ${val}. Tree size: ${newSize}`);
    }
    setInput('');
  };

  const countNodes = (node: BSTNode | null): number => {
    if (!node) return 0;
    return 1 + countNodes(node.left) + countNodes(node.right);
  };

  const searchNode = () => {
    const val = parseInt(input, 10);
    if (isNaN(val)) { setMessage('Please enter a valid number.'); return; }
    clearTimers();
    if (!root) { setMessage('BST is empty.'); return; }
    const highlighted = bstHighlightPath(clearHighlight(root), val);
    setRoot(highlighted);
    const found = highlighted ? findNode(highlighted, val) : false;
    setMessage(found ? `Found ${val} in the BST! (highlighted path)` : `Value ${val} not found in BST.`);
    const t = setTimeout(() => {
      setRoot((r) => r ? clearHighlight(r) : null);
    }, 2000);
    traversalTimerRef.current.push(t);
  };

  const findNode = (node: BSTNode | null, val: number): boolean => {
    if (!node) return false;
    if (node.value === val) return true;
    return findNode(node.left, val) || findNode(node.right, val);
  };

  const inorderTraversal = () => {
    if (!root) { setMessage('BST is empty.'); return; }
    clearTimers();
    const order = bstInorder(root);
    setMessage(`In-order traversal: [${order.join(', ')}] — animating...`);

    const animateStep = (idx: number) => {
      if (idx >= order.length) {
        const t = setTimeout(() => {
          setRoot((r) => r ? clearHighlight(r) : null);
          setMessage(`In-order traversal complete: [${order.join(', ')}]`);
        }, 500);
        traversalTimerRef.current.push(t);
        return;
      }
      setRoot((r) => r ? bstHighlightInorder(r, order, idx) : null);
      const t = setTimeout(() => animateStep(idx + 1), 600);
      traversalTimerRef.current.push(t);
    };

    animateStep(0);
  };

  const clear = () => {
    clearTimers();
    setRoot(null);
    setSize(0);
    setMessage('BST cleared.');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={insert}
          placeholder="Enter number"
          style={{ width: 140 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={insert} style={{ background: '#50C878', borderColor: '#50C878', color: '#000' }}>
          Insert
        </Button>
        <Button icon={<DeleteOutlined />} onClick={deleteNode} danger>Delete</Button>
        <Button icon={<SearchOutlined />} onClick={searchNode}>Search</Button>
        <Button icon={<SortAscendingOutlined />} onClick={inorderTraversal}>In-order</Button>
        <Button danger onClick={clear}>Clear</Button>
        <span style={{ fontSize: 12, color: subColor, marginLeft: 'auto' }}>Nodes: {size}</span>
      </div>

      <div
        style={{
          background: panelBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 10,
          padding: '8px 12px',
          marginBottom: 16,
          fontSize: 13,
          color: textColor,
          minHeight: 36,
        }}
      >
        {message}
      </div>

      <div
        style={{
          minHeight: 300,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '24px 8px',
          overflowX: 'auto',
          overflowY: 'auto',
        }}
      >
        {!root ? (
          <div style={{ color: subColor, fontSize: 13 }}>BST is empty</div>
        ) : (
          <BSTNodeRenderer node={root} isDark={isDark} cardBorder={cardBorder} textColor={textColor} />
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DataStructureVisualizerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const subColor = isDark ? '#777' : '#999';
  const panelBg = isDark ? '#1e1e1e' : '#fafafa';

  const sharedProps = { isDark, cardBg, cardBorder, textColor, subColor, panelBg };

  const tabItems = [
    {
      key: 'stack',
      label: 'Stack',
      children: <StackVisualizer {...sharedProps} />,
    },
    {
      key: 'queue',
      label: 'Queue',
      children: <QueueVisualizer {...sharedProps} />,
    },
    {
      key: 'linkedlist',
      label: 'Linked List',
      children: <LinkedListVisualizer {...sharedProps} />,
    },
    {
      key: 'bst',
      label: 'Binary Search Tree',
      children: <BSTVisualizer {...sharedProps} />,
    },
  ];

  return (
    <div style={{ width: '100%', color: textColor }}>
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '20px 24px',
        }}
      >
        <Tabs
          defaultActiveKey="stack"
          items={tabItems}
          style={{ color: textColor }}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '16px 24px',
          marginTop: 16,
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 12, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Legend:
        </span>
        {[
          { color: isDark ? '#2a2a2a' : '#f0f0f0', border: cardBorder, label: 'Default node' },
          { color: '#50C878', border: '#50C878', label: 'Active / highlighted' },
          { color: 'rgba(80,200,120,0.2)', border: '#50C878', label: 'Path (BST search)' },
        ].map(({ color, border, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: color, border: `2px solid ${border}`,
            }} />
            <span style={{ fontSize: 12, color: subColor }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
