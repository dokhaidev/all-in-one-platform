'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Select, Slider } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlgorithmKey = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick';

interface Step {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  description: string;
}

interface AlgorithmInfo {
  label: string;
  best: string;
  average: string;
  worst: string;
  space: string;
  description: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM_INFO: Record<AlgorithmKey, AlgorithmInfo> = {
  bubble: {
    label: 'Bubble Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Repeatedly compares adjacent elements and swaps them if out of order. Simple but inefficient for large arrays.',
  },
  selection: {
    label: 'Selection Sort',
    best: 'O(n²)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Finds the minimum element and places it at the beginning. Always O(n²) regardless of input.',
  },
  insertion: {
    label: 'Insertion Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
    space: 'O(1)',
    description: 'Builds sorted array one element at a time. Very efficient for nearly sorted or small arrays.',
  },
  merge: {
    label: 'Merge Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
    space: 'O(n)',
    description: 'Divide and conquer — splits array in half, sorts each half, then merges. Stable and consistently efficient.',
  },
  quick: {
    label: 'Quick Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
    space: 'O(log n)',
    description: 'Picks a pivot and partitions array around it. Very fast in practice with good pivot selection.',
  },
};

const SPEED_MAP: Record<string, number> = {
  slow: 800,
  medium: 300,
  fast: 50,
};

// ─── Step Generators ──────────────────────────────────────────────────────────

function generateBubbleSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
        description: `Comparing index ${j} (${a[j]}) and index ${j + 1} (${a[j + 1]})`,
      });
      if (a[j] > a[j + 1]) {
        steps.push({
          array: [...a],
          comparing: [],
          swapping: [j, j + 1],
          sorted: [...sorted],
          description: `Swapping ${a[j]} and ${a[j + 1]}`,
        });
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swapped = true;
      }
    }
    sorted.unshift(n - 1 - i);
    if (!swapped) {
      for (let k = 0; k < n - i - 1; k++) sorted.push(k);
      break;
    }
  }
  sorted.push(0);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Array is sorted!',
  });
  return steps;
}

function generateSelectionSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    let minIdx = i;
    for (let j = i + 1; j < n; j++) {
      steps.push({
        array: [...a],
        comparing: [minIdx, j],
        swapping: [],
        sorted: [...sorted],
        description: `Finding minimum: comparing current min (index ${minIdx}, value ${a[minIdx]}) with index ${j} (${a[j]})`,
      });
      if (a[j] < a[minIdx]) {
        minIdx = j;
      }
    }
    if (minIdx !== i) {
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [i, minIdx],
        sorted: [...sorted],
        description: `Placing minimum (${a[minIdx]}) at index ${i}: swapping with ${a[i]}`,
      });
      [a[i], a[minIdx]] = [a[minIdx], a[i]];
    }
    sorted.push(i);
  }
  sorted.push(n - 1);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Array is sorted!',
  });
  return steps;
}

function generateInsertionSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];
  const n = a.length;
  const sorted: number[] = [0];

  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push({
      array: [...a],
      comparing: [i],
      swapping: [],
      sorted: [...sorted],
      description: `Picking element at index ${i} (value ${key}) to insert into sorted portion`,
    });
    while (j >= 0 && a[j] > key) {
      steps.push({
        array: [...a],
        comparing: [j, j + 1],
        swapping: [],
        sorted: [...sorted],
        description: `Comparing ${a[j]} > ${key}, shifting ${a[j]} right`,
      });
      steps.push({
        array: [...a],
        comparing: [],
        swapping: [j, j + 1],
        sorted: [...sorted],
        description: `Shifting ${a[j]} from index ${j} to ${j + 1}`,
      });
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = key;
    sorted.push(i);
    steps.push({
      array: [...a],
      comparing: [],
      swapping: [],
      sorted: [...sorted],
      description: `Inserted ${key} at index ${j + 1}`,
    });
  }
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: n }, (_, i) => i),
    description: 'Array is sorted!',
  });
  return steps;
}

function generateMergeSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];

  function merge(arr: number[], left: number, mid: number, right: number) {
    const leftArr = arr.slice(left, mid + 1);
    const rightArr = arr.slice(mid + 1, right + 1);
    let i = 0, j = 0, k = left;
    while (i < leftArr.length && j < rightArr.length) {
      steps.push({
        array: [...arr],
        comparing: [left + i, mid + 1 + j],
        swapping: [],
        sorted: [],
        description: `Merging: comparing ${leftArr[i]} (left) and ${rightArr[j]} (right)`,
      });
      if (leftArr[i] <= rightArr[j]) {
        arr[k] = leftArr[i];
        i++;
      } else {
        arr[k] = rightArr[j];
        j++;
      }
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [],
        description: `Placed ${arr[k]} at index ${k}`,
      });
      k++;
    }
    while (i < leftArr.length) {
      arr[k] = leftArr[i];
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [],
        description: `Placed remaining ${arr[k]} at index ${k}`,
      });
      i++; k++;
    }
    while (j < rightArr.length) {
      arr[k] = rightArr[j];
      steps.push({
        array: [...arr],
        comparing: [],
        swapping: [k],
        sorted: [],
        description: `Placed remaining ${arr[k]} at index ${k}`,
      });
      j++; k++;
    }
  }

  function mergeSort(arr: number[], left: number, right: number) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    steps.push({
      array: [...arr],
      comparing: [left, right],
      swapping: [],
      sorted: [],
      description: `Splitting subarray from index ${left} to ${right} at mid ${mid}`,
    });
    mergeSort(arr, left, mid);
    mergeSort(arr, mid + 1, right);
    merge(arr, left, mid, right);
  }

  mergeSort(a, 0, a.length - 1);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, i) => i),
    description: 'Array is sorted!',
  });
  return steps;
}

function generateQuickSteps(arr: number[]): Step[] {
  const steps: Step[] = [];
  const a = [...arr];

  function partition(arr: number[], low: number, high: number): number {
    const pivot = arr[high];
    steps.push({
      array: [...arr],
      comparing: [high],
      swapping: [],
      sorted: [],
      description: `Choosing pivot: ${pivot} at index ${high}`,
    });
    let i = low - 1;
    for (let j = low; j < high; j++) {
      steps.push({
        array: [...arr],
        comparing: [j, high],
        swapping: [],
        sorted: [],
        description: `Comparing ${arr[j]} with pivot ${pivot}`,
      });
      if (arr[j] <= pivot) {
        i++;
        if (i !== j) {
          steps.push({
            array: [...arr],
            comparing: [],
            swapping: [i, j],
            sorted: [],
            description: `${arr[j]} ≤ pivot, swapping index ${i} (${arr[i]}) and ${j} (${arr[j]})`,
          });
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
      }
    }
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [i + 1, high],
      sorted: [],
      description: `Placing pivot ${pivot} at its correct position (index ${i + 1})`,
    });
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
  }

  function quickSort(arr: number[], low: number, high: number) {
    if (low >= high) return;
    const pivotIdx = partition(arr, low, high);
    steps.push({
      array: [...arr],
      comparing: [],
      swapping: [],
      sorted: [pivotIdx],
      description: `Pivot ${arr[pivotIdx]} is now at its final position (index ${pivotIdx})`,
    });
    quickSort(arr, low, pivotIdx - 1);
    quickSort(arr, pivotIdx + 1, high);
  }

  quickSort(a, 0, a.length - 1);
  steps.push({
    array: [...a],
    comparing: [],
    swapping: [],
    sorted: Array.from({ length: a.length }, (_, i) => i),
    description: 'Array is sorted!',
  });
  return steps;
}

function generateSteps(algorithm: AlgorithmKey, arr: number[]): Step[] {
  switch (algorithm) {
    case 'bubble': return generateBubbleSteps(arr);
    case 'selection': return generateSelectionSteps(arr);
    case 'insertion': return generateInsertionSteps(arr);
    case 'merge': return generateMergeSteps(arr);
    case 'quick': return generateQuickSteps(arr);
  }
}

function generateRandomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * 90) + 10);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AlgorithmVisualizerTool() {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [algorithm, setAlgorithm] = useState<AlgorithmKey>('bubble');
  const [arraySize, setArraySize] = useState(30);
  const [speed, setSpeed] = useState<string>('medium');
  const [baseArray, setBaseArray] = useState<number[]>(() => generateRandomArray(30));
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Theme tokens ────────────────────────────────────────────────────────
  const bg = isDark ? '#1a1a1a' : '#f5f5f5';
  const cardBg = isDark ? '#222222' : '#ffffff';
  const cardBorder = isDark ? '#2e2e2e' : '#e8e8e8';
  const textColor = isDark ? '#c9c9c9' : '#1a1a1a';
  const subColor = isDark ? '#777' : '#999';
  const panelBg = isDark ? '#1e1e1e' : '#fafafa';

  // ─── Recompute steps whenever algorithm or base array changes ──────────
  useEffect(() => {
    const newSteps = generateSteps(algorithm, baseArray);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
  }, [algorithm, baseArray]);

  // ─── Autoplay interval ───────────────────────────────────────────────────
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, SPEED_MAP[speed]);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, speed, steps.length]);

  const handleGenerateArray = useCallback(() => {
    setBaseArray(generateRandomArray(arraySize));
  }, [arraySize]);

  const handleAlgorithmChange = (val: AlgorithmKey) => {
    setIsPlaying(false);
    setAlgorithm(val);
  };

  const handleSizeChange = (val: number) => {
    setIsPlaying(false);
    setArraySize(val);
    setBaseArray(generateRandomArray(val));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.min(p + 1, steps.length - 1));
  };

  const handleStepBack = () => {
    setIsPlaying(false);
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const togglePlay = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
      setIsPlaying(true);
    } else {
      setIsPlaying((p) => !p);
    }
  };

  const step = steps[currentStep];
  const info = ALGORITHM_INFO[algorithm];
  const maxVal = step ? Math.max(...step.array, 1) : 100;

  const getBarColor = (idx: number): string => {
    if (!step) return '#50C878';
    if (step.swapping.includes(idx)) return '#ff4d4f';
    if (step.comparing.includes(idx)) return '#faad14';
    if (step.sorted.includes(idx)) return '#52c41a';
    return '#50C878';
  };

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    background: active ? '#50C878' : 'transparent',
    border: `1px solid ${active ? '#50C878' : cardBorder}`,
    color: active ? '#000' : textColor,
    borderRadius: 8,
    padding: '6px 14px',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.15s',
  });

  return (
    <div style={{ width: '100%', color: textColor }}>

      {/* ── Top Controls ── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'flex-end',
        }}
      >
        {/* Algorithm */}
        <div style={{ minWidth: 200 }}>
          <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Algorithm
          </div>
          <Select
            value={algorithm}
            onChange={handleAlgorithmChange}
            style={{ width: '100%' }}
            options={Object.entries(ALGORITHM_INFO).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </div>

        {/* Array Size */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Array Size: {arraySize}
          </div>
          <Slider
            min={10}
            max={100}
            value={arraySize}
            onChange={handleSizeChange}
            styles={{ track: { background: '#50C878' }, handle: { borderColor: '#50C878' } }}
          />
        </div>

        {/* Speed */}
        <div style={{ minWidth: 160 }}>
          <div style={{ fontSize: 12, color: subColor, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Speed
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['slow', 'medium', 'fast'].map((s) => (
              <button
                key={s}
                style={{
                  ...btnStyle(speed === s),
                  padding: '5px 12px',
                  fontSize: 12,
                  textTransform: 'capitalize',
                }}
                onClick={() => setSpeed(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          style={{ ...btnStyle(), border: `1px solid #50C878`, color: '#50C878', padding: '7px 16px' }}
          onClick={handleGenerateArray}
        >
          <ThunderboltOutlined />
          New Array
        </button>
      </div>

      {/* ── Visualization Area ── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '20px 24px',
          marginBottom: 20,
        }}
      >
        {/* Bar Chart */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: arraySize > 60 ? 1 : arraySize > 30 ? 2 : 3,
            height: 260,
            marginBottom: 16,
            padding: '0 4px',
          }}
        >
          {step && step.array.map((val, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: `${(val / maxVal) * 100}%`,
                background: getBarColor(idx),
                borderRadius: '3px 3px 0 0',
                minWidth: 2,
                transition: 'height 0.05s, background 0.1s',
              }}
              title={`Index: ${idx}, Value: ${val}`}
            />
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            { color: '#50C878', label: 'Unsorted' },
            { color: '#faad14', label: 'Comparing' },
            { color: '#ff4d4f', label: 'Swapping' },
            { color: '#52c41a', label: 'Sorted' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, background: color, borderRadius: 2 }} />
              <span style={{ fontSize: 12, color: subColor }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div
          style={{
            background: panelBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 13,
            color: textColor,
            minHeight: 40,
            marginBottom: 16,
          }}
        >
          {step?.description || 'Press Play to start visualization'}
        </div>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button style={btnStyle()} onClick={handleReset} title="Reset">
            <ReloadOutlined />
            Reset
          </button>
          <button style={btnStyle()} onClick={handleStepBack} disabled={currentStep === 0} title="Step Back">
            <StepBackwardOutlined />
          </button>
          <button
            style={{ ...btnStyle(), background: '#50C878', border: '1px solid #50C878', color: '#000', padding: '7px 20px' }}
            onClick={togglePlay}
          >
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button style={btnStyle()} onClick={handleStepForward} disabled={currentStep >= steps.length - 1} title="Step Forward">
            <StepForwardOutlined />
          </button>

          <span style={{ marginLeft: 'auto', fontSize: 13, color: subColor, fontVariantNumeric: 'tabular-nums' }}>
            Step {currentStep + 1} / {steps.length}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 12, background: isDark ? '#2a2a2a' : '#e8e8e8', borderRadius: 4, height: 4, overflow: 'hidden' }}>
          <div
            style={{
              width: `${steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0}%`,
              height: '100%',
              background: '#50C878',
              transition: 'width 0.1s',
              borderRadius: 4,
            }}
          />
        </div>
      </div>

      {/* ── Algorithm Info ── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: 14,
          padding: '20px 24px',
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: textColor, marginBottom: 4 }}>
          {info.label}
        </div>
        <div style={{ fontSize: 13, color: subColor, marginBottom: 16, lineHeight: 1.6 }}>
          {info.description}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Best', value: info.best, color: '#52c41a' },
            { label: 'Average', value: info.average, color: '#faad14' },
            { label: 'Worst', value: info.worst, color: '#ff4d4f' },
            { label: 'Space', value: info.space, color: '#1890ff' },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              style={{
                background: panelBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 10,
                padding: '12px 20px',
                textAlign: 'center',
                minWidth: 100,
              }}
            >
              <div style={{ fontSize: 11, color: subColor, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                {label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'monospace' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
