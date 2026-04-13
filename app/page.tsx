"use client";

import { useEffect, useRef, useState } from "react";

// ─── 类型 & 数据 ─────────────────────────────────────────────
type ProcessStatus = "可分货" | "已分货" | "不可分";

const PROCESSES = ["前袋", "后袋", "上腰", "三针", "锁边", "装拉链", "熨烫整理", "质检包装"];

const PROCESS_COLORS = [
  "#e11d48", "#9333ea", "#ea580c", "#16a34a", "#2563eb", "#0891b2", "#d97706", "#65a30d",
];

const BATCH_ROWS = [
  {
    matchNo: "1", bundleNo: "(1)",
    color: "天蓝", size: "25",
    total: 200,
    statuses: ["已分货","已分货","已分货","可分货","可分货","不可分","不可分","不可分"] as ProcessStatus[],
  },
  {
    matchNo: "1", bundleNo: "(2)",
    color: "天蓝", size: "26",
    total: 200,
    statuses: ["已分货","可分货","可分货","可分货","不可分","不可分","不可分","不可分"] as ProcessStatus[],
  },
  {
    matchNo: "2", bundleNo: "(1)",
    color: "大红", size: "27",
    total: 180,
    statuses: ["已分货","已分货","已分货","已分货","可分货","不可分","不可分","不可分"] as ProcessStatus[],
  },
  {
    matchNo: "2", bundleNo: "(2)",
    color: "大红", size: "28",
    total: 180,
    statuses: ["已分货","已分货","可分货","可分货","可分货","不可分","不可分","不可分"] as ProcessStatus[],
  },
  {
    matchNo: "3", bundleNo: "(1)",
    color: "米白", size: "29",
    total: 160,
    statuses: ["可分货","可分货","可分货","不可分","不可分","不可分","不可分","不可分"] as ProcessStatus[],
  },
  {
    matchNo: "3", bundleNo: "(2)",
    color: "米白", size: "30",
    total: 160,
    statuses: ["可分货","不可分","不可分","不可分","不可分","不可分","不可分","不可分"] as ProcessStatus[],
  },
];

// 工具：按匹号聚合汇总
type WorkerItem = { no: string; matchNo: string; color: string; size: string; qty: number };

function calcMatchSummary(items: WorkerItem[]) {
  const map = new Map<string, { matchNo: string; entries: { color: string; size: string; qty: number }[]; total: number }>();
  items.forEach((item) => {
    const key = item.matchNo;
    if (!map.has(key)) map.set(key, { matchNo: item.matchNo, entries: [], total: 0 });
    const rec = map.get(key)!;
    const existing = rec.entries.find((e) => e.color === item.color && e.size === item.size);
    if (existing) { existing.qty += item.qty; } else { rec.entries.push({ color: item.color, size: item.size, qty: item.qty }); }
    rec.total += item.qty;
  });
  return Array.from(map.values());
}

function getWorkerStats(items: WorkerItem[]) {
  return {
    bundles: new Set(items.map((item) => getBundleKey(item))).size,
    pieces: items.reduce((sum, item) => sum + item.qty, 0),
  };
}

function getSectionStats(section: { workers: { items: WorkerItem[] }[] }) {
  const items = section.workers.flatMap((worker) => worker.items);
  return {
    bundles: new Set(items.map((item) => getBundleKey(item))).size,
    pieces: items.reduce((sum, item) => sum + item.qty, 0),
  };
}

function getBundleKey(item: Pick<WorkerItem, "matchNo" | "no">) {
  return `${item.matchNo}:${item.no}`;
}

function getSharedBundleNos(section: { workers: { items: WorkerItem[] }[] }) {
  const counts = new Map<string, number>();
  section.workers.forEach((worker) => {
    worker.items.forEach((item) => {
      const bundleKey = getBundleKey(item);
      counts.set(bundleKey, (counts.get(bundleKey) ?? 0) + 1);
    });
  });
  return new Set(Array.from(counts.entries()).filter(([, count]) => count > 1).map(([bundleKey]) => bundleKey));
}

function getBundleBadgeTone(isShared: boolean) {
  return isShared
    ? "border border-sky-200 bg-sky-100 text-sky-700"
    : "border border-gray-200 bg-gray-100 text-gray-500";
}


function getWorkerMatchNotes(items: WorkerItem[], sec: SectionType, sharedBundleNos: Set<string>) {
  const itemsByMatch = new Map<string, WorkerItem[]>();
  items.forEach((item) => {
    if (!itemsByMatch.has(item.matchNo)) itemsByMatch.set(item.matchNo, []);
    itemsByMatch.get(item.matchNo)!.push(item);
  });

  return Array.from(itemsByMatch.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([matchNo, matchItems]) => {
      const sectionMatchItems = sec.workers.flatMap((worker) => worker.items).filter((item) => item.matchNo === matchNo);
      const complete = matchItems.length === sectionMatchItems.length && sectionMatchItems.every((item) => matchItems.includes(item));
      const sizes = Array.from(new Map(matchItems.map((item) => [item.size, {
        size: item.size,
        isShared: matchItems.some((entry) => entry.size === item.size && sharedBundleNos.has(getBundleKey(entry))),
      }])).values()).sort((a, b) => Number(a.size) - Number(b.size));
      return { matchNo, complete, sizes };
    });
}

const WORKERS_BASE: WorkerItem[] = [
  { no: "1",  matchNo: "1", color: "天蓝", size: "25", qty: 20 },
  { no: "2",  matchNo: "1", color: "天蓝", size: "26", qty: 20 },
  { no: "3",  matchNo: "1", color: "天蓝", size: "27", qty: 20 },
  { no: "4",  matchNo: "1", color: "天蓝", size: "28", qty: 20 },
  { no: "5",  matchNo: "2", color: "天蓝", size: "29", qty: 20 },
  { no: "6",  matchNo: "2", color: "天蓝", size: "30", qty: 20 },
  { no: "7",  matchNo: "2", color: "大红", size: "31", qty: 20 },
  { no: "8",  matchNo: "2", color: "大红", size: "32", qty: 20 },
  { no: "9",  matchNo: "3", color: "大红", size: "25", qty: 20 },
  { no: "10", matchNo: "3", color: "大红", size: "26", qty: 20 },
];

const WHOLE_MATCH_SIZES = ["25", "26", "27", "28", "29", "30", "31", "32", "33"];

function createWholeMatch(matchNo: string, color: string): WorkerItem[] {
  return WHOLE_MATCH_SIZES.map((size, index) => ({
    no: String(index + 1),
    matchNo,
    color,
    size,
    qty: 20,
  }));
}

const PROCESS_SECTIONS = [
  // ── 前袋（4人）──────────────────────────────────────────────
  {
    idx: 1, processName: "前袋", totalBundles: 81, totalPieces: 1620,
    color: PROCESS_COLORS[0],
    workers: [
      {
        name: "王巧手", bundles: 21, pieces: 405,
        summary: [{ color: "天蓝", size: "25-33", total: 405 }],
        items: [
          { no: "1", matchNo: "4", color: "天蓝", size: "25", qty: 20 },
          { no: "2", matchNo: "4", color: "天蓝", size: "26", qty: 20 },
          { no: "9", matchNo: "4", color: "天蓝", size: "33", qty: 5 },
          { no: "1", matchNo: "5", color: "天蓝", size: "25", qty: 20 },
          { no: "2", matchNo: "5", color: "天蓝", size: "26", qty: 20 },
          { no: "3", matchNo: "5", color: "天蓝", size: "27", qty: 20 },
          { no: "4", matchNo: "5", color: "天蓝", size: "28", qty: 20 },
          { no: "5", matchNo: "5", color: "天蓝", size: "29", qty: 20 },
          { no: "6", matchNo: "5", color: "天蓝", size: "30", qty: 20 },
          { no: "7", matchNo: "5", color: "天蓝", size: "31", qty: 20 },
          { no: "8", matchNo: "5", color: "天蓝", size: "32", qty: 20 },
          { no: "9", matchNo: "5", color: "天蓝", size: "33", qty: 20 },
          { no: "1", matchNo: "6", color: "天蓝", size: "25", qty: 20 },
          { no: "2", matchNo: "6", color: "天蓝", size: "26", qty: 20 },
          { no: "3", matchNo: "6", color: "天蓝", size: "27", qty: 20 },
          { no: "4", matchNo: "6", color: "天蓝", size: "28", qty: 20 },
          { no: "5", matchNo: "6", color: "天蓝", size: "29", qty: 20 },
          { no: "6", matchNo: "6", color: "天蓝", size: "30", qty: 20 },
          { no: "7", matchNo: "6", color: "天蓝", size: "31", qty: 20 },
          { no: "8", matchNo: "6", color: "天蓝", size: "32", qty: 20 },
          { no: "9", matchNo: "6", color: "天蓝", size: "33", qty: 20 },
        ],
      },
      {
        name: "李桂花", bundles: 21, pieces: 405,
        summary: [{ color: "大红", size: "25-33", total: 405 }],
        items: [
          { no: "3", matchNo: "4", color: "天蓝", size: "27", qty: 20 },
          { no: "4", matchNo: "4", color: "天蓝", size: "28", qty: 20 },
          { no: "9", matchNo: "4", color: "天蓝", size: "33", qty: 5 },
          { no: "1", matchNo: "7", color: "大红", size: "25", qty: 20 },
          { no: "2", matchNo: "7", color: "大红", size: "26", qty: 20 },
          { no: "3", matchNo: "7", color: "大红", size: "27", qty: 20 },
          { no: "4", matchNo: "7", color: "大红", size: "28", qty: 20 },
          { no: "5", matchNo: "7", color: "大红", size: "29", qty: 20 },
          { no: "6", matchNo: "7", color: "大红", size: "30", qty: 20 },
          { no: "7", matchNo: "7", color: "大红", size: "31", qty: 20 },
          { no: "8", matchNo: "7", color: "大红", size: "32", qty: 20 },
          { no: "9", matchNo: "7", color: "大红", size: "33", qty: 20 },
          { no: "1", matchNo: "8", color: "大红", size: "25", qty: 20 },
          { no: "2", matchNo: "8", color: "大红", size: "26", qty: 20 },
          { no: "3", matchNo: "8", color: "大红", size: "27", qty: 20 },
          { no: "4", matchNo: "8", color: "大红", size: "28", qty: 20 },
          { no: "5", matchNo: "8", color: "大红", size: "29", qty: 20 },
          { no: "6", matchNo: "8", color: "大红", size: "30", qty: 20 },
          { no: "7", matchNo: "8", color: "大红", size: "31", qty: 20 },
          { no: "8", matchNo: "8", color: "大红", size: "32", qty: 20 },
          { no: "9", matchNo: "8", color: "大红", size: "33", qty: 20 },
        ],
      },
      {
        name: "陈秀英", bundles: 21, pieces: 405,
        summary: [{ color: "米白", size: "25-33", total: 405 }],
        items: [
          { no: "5", matchNo: "4", color: "天蓝", size: "29", qty: 20 },
          { no: "6", matchNo: "4", color: "天蓝", size: "30", qty: 20 },
          { no: "9", matchNo: "4", color: "天蓝", size: "33", qty: 5 },
          { no: "1", matchNo: "9", color: "米白", size: "25", qty: 20 },
          { no: "2", matchNo: "9", color: "米白", size: "26", qty: 20 },
          { no: "3", matchNo: "9", color: "米白", size: "27", qty: 20 },
          { no: "4", matchNo: "9", color: "米白", size: "28", qty: 20 },
          { no: "5", matchNo: "9", color: "米白", size: "29", qty: 20 },
          { no: "6", matchNo: "9", color: "米白", size: "30", qty: 20 },
          { no: "7", matchNo: "9", color: "米白", size: "31", qty: 20 },
          { no: "8", matchNo: "9", color: "米白", size: "32", qty: 20 },
          { no: "9", matchNo: "9", color: "米白", size: "33", qty: 20 },
          { no: "1", matchNo: "10", color: "米白", size: "25", qty: 20 },
          { no: "2", matchNo: "10", color: "米白", size: "26", qty: 20 },
          { no: "3", matchNo: "10", color: "米白", size: "27", qty: 20 },
          { no: "4", matchNo: "10", color: "米白", size: "28", qty: 20 },
          { no: "5", matchNo: "10", color: "米白", size: "29", qty: 20 },
          { no: "6", matchNo: "10", color: "米白", size: "30", qty: 20 },
          { no: "7", matchNo: "10", color: "米白", size: "31", qty: 20 },
          { no: "8", matchNo: "10", color: "米白", size: "32", qty: 20 },
          { no: "9", matchNo: "10", color: "米白", size: "33", qty: 20 },
        ],
      },
      {
        name: "刘翠莲", bundles: 21, pieces: 405,
        summary: [{ color: "藏青", size: "25-33", total: 405 }],
        items: [
          { no: "7", matchNo: "4", color: "天蓝", size: "31", qty: 20 },
          { no: "8", matchNo: "4", color: "天蓝", size: "32", qty: 20 },
          { no: "9", matchNo: "4", color: "天蓝", size: "33", qty: 5 },
          { no: "1", matchNo: "11", color: "藏青", size: "25", qty: 20 },
          { no: "2", matchNo: "11", color: "藏青", size: "26", qty: 20 },
          { no: "3", matchNo: "11", color: "藏青", size: "27", qty: 20 },
          { no: "4", matchNo: "11", color: "藏青", size: "28", qty: 20 },
          { no: "5", matchNo: "11", color: "藏青", size: "29", qty: 20 },
          { no: "6", matchNo: "11", color: "藏青", size: "30", qty: 20 },
          { no: "7", matchNo: "11", color: "藏青", size: "31", qty: 20 },
          { no: "8", matchNo: "11", color: "藏青", size: "32", qty: 20 },
          { no: "9", matchNo: "11", color: "藏青", size: "33", qty: 20 },
          { no: "1", matchNo: "12", color: "藏青", size: "25", qty: 20 },
          { no: "2", matchNo: "12", color: "藏青", size: "26", qty: 20 },
          { no: "3", matchNo: "12", color: "藏青", size: "27", qty: 20 },
          { no: "4", matchNo: "12", color: "藏青", size: "28", qty: 20 },
          { no: "5", matchNo: "12", color: "藏青", size: "29", qty: 20 },
          { no: "6", matchNo: "12", color: "藏青", size: "30", qty: 20 },
          { no: "7", matchNo: "12", color: "藏青", size: "31", qty: 20 },
          { no: "8", matchNo: "12", color: "藏青", size: "32", qty: 20 },
          { no: "9", matchNo: "12", color: "藏青", size: "33", qty: 20 },
        ],
      },
    ],
  },
  {
    idx: 2, processName: "后袋", totalBundles: 24, totalPieces: 440,
    color: PROCESS_COLORS[1],
    workers: [
      {
        name: "王巧手", bundles: 14, pieces: 240,
        summary: [{ color: "天蓝", size: "25-32", total: 240 }],
        items: [
          { no: "1",  matchNo: "1", color: "天蓝", size: "25", qty: 30 },
          { no: "2",  matchNo: "1", color: "天蓝", size: "26", qty: 30 },
          { no: "3",  matchNo: "1", color: "天蓝", size: "27", qty: 30 },
          { no: "4",  matchNo: "1", color: "天蓝", size: "28", qty: 30 },
          { no: "5",  matchNo: "1", color: "天蓝", size: "29", qty: 30 },
          { no: "6",  matchNo: "1", color: "天蓝", size: "30", qty: 30 },
          { no: "7",  matchNo: "1", color: "天蓝", size: "31", qty: 30 },
          { no: "8",  matchNo: "1", color: "天蓝", size: "32", qty: 30 },
        ],
      },
      {
        name: "孙美华", bundles: 10, pieces: 200,
        summary: [{ color: "大红", size: "25-32", total: 200 }],
        items: [
          { no: "1",  matchNo: "2", color: "大红", size: "25", qty: 25 },
          { no: "2",  matchNo: "2", color: "大红", size: "26", qty: 25 },
          { no: "3",  matchNo: "2", color: "大红", size: "27", qty: 25 },
          { no: "4",  matchNo: "2", color: "大红", size: "28", qty: 25 },
          { no: "5",  matchNo: "2", color: "大红", size: "29", qty: 25 },
          { no: "6",  matchNo: "2", color: "大红", size: "30", qty: 25 },
          { no: "7",  matchNo: "2", color: "大红", size: "31", qty: 25 },
          { no: "8",  matchNo: "2", color: "大红", size: "32", qty: 25 },
        ],
      },
    ],
  },
  // ── 上腰（3人）──────────────────────────────────────────────
  {
    idx: 3, processName: "上腰", totalBundles: 30, totalPieces: 560,
    color: PROCESS_COLORS[2],
    workers: [
      {
        name: "王巧手", bundles: 12, pieces: 200,
        summary: [{ color: "天蓝", size: "25-28", total: 200 }],
        items: [
          { no: "1",  matchNo: "1", color: "天蓝", size: "25", qty: 50 },
          { no: "2",  matchNo: "1", color: "天蓝", size: "26", qty: 50 },
          { no: "3",  matchNo: "1", color: "天蓝", size: "27", qty: 50 },
          { no: "4",  matchNo: "1", color: "天蓝", size: "28", qty: 50 },
        ],
      },
      {
        name: "周小燕", bundles: 10, pieces: 180,
        summary: [{ color: "大红", size: "25-30", total: 180 }],
        items: [
          { no: "5",  matchNo: "2", color: "大红", size: "25", qty: 30 },
          { no: "6",  matchNo: "2", color: "大红", size: "26", qty: 30 },
          { no: "7",  matchNo: "2", color: "大红", size: "27", qty: 30 },
          { no: "8",  matchNo: "2", color: "大红", size: "28", qty: 30 },
          { no: "9",  matchNo: "2", color: "大红", size: "29", qty: 30 },
          { no: "10", matchNo: "2", color: "大红", size: "30", qty: 30 },
        ],
      },
      {
        name: "吴桂芬", bundles: 8, pieces: 180,
        summary: [{ color: "米白", size: "25-32", total: 180 }],
        items: [
          { no: "11", matchNo: "3", color: "米白", size: "25", qty: 22 },
          { no: "12", matchNo: "3", color: "米白", size: "26", qty: 22 },
          { no: "13", matchNo: "3", color: "米白", size: "27", qty: 22 },
          { no: "14", matchNo: "3", color: "米白", size: "28", qty: 22 },
          { no: "15", matchNo: "3", color: "米白", size: "29", qty: 22 },
          { no: "16", matchNo: "3", color: "米白", size: "30", qty: 22 },
          { no: "17", matchNo: "3", color: "米白", size: "31", qty: 23 },
          { no: "18", matchNo: "3", color: "米白", size: "32", qty: 23 },
        ],
      },
    ],
  },
  // ── 三针（2人）──────────────────────────────────────────────
  {
    idx: 4, processName: "三针", totalBundles: 16, totalPieces: 200,
    color: PROCESS_COLORS[3],
    workers: [
      {
        name: "王巧手", bundles: 8, pieces: 100,
        summary: [{ color: "天蓝", size: "25-28", total: 100 }],
        items: WORKERS_BASE.slice(0, 4).map((w) => ({ ...w, qty: 25 })),
      },
      {
        name: "张师傅", bundles: 8, pieces: 100,
        summary: [{ color: "天蓝", size: "29-32", total: 100 }],
        items: WORKERS_BASE.slice(4, 8).map((w) => ({ ...w, qty: 25 })),
      },
    ],
  },
  // ── 锁边（1人）──────────────────────────────────────────────
  {
    idx: 5, processName: "锁边", totalBundles: 10, totalPieces: 160,
    color: PROCESS_COLORS[4],
    workers: [
      {
        name: "王巧手", bundles: 10, pieces: 160,
        summary: [{ color: "天蓝", size: "25-32", total: 160 }],
        items: WORKERS_BASE.map((w) => ({ ...w, qty: 16 })),
      },
    ],
  },
  // ── 装拉链（1人）────────────────────────────────────────────
  {
    idx: 6, processName: "装拉链", totalBundles: 8, totalPieces: 80,
    color: PROCESS_COLORS[5],
    workers: [
      {
        name: "陈巧手", bundles: 8, pieces: 80,
        summary: [{ color: "大红", size: "25-28", total: 80 }],
        items: WORKERS_BASE.slice(0, 4).map((w) => ({ ...w, color: "大红", qty: 20 })),
      },
    ],
  },
  // ── 熨烫整理（1人）──────────────────────────────────────────
  {
    idx: 7, processName: "熨烫整理", totalBundles: 6, totalPieces: 60,
    color: PROCESS_COLORS[6],
    workers: [
      {
        name: "刘整洁", bundles: 6, pieces: 60,
        summary: [{ color: "米白", size: "25-30", total: 60 }],
        items: WORKERS_BASE.slice(0, 6).map((w) => ({ ...w, color: "米白", qty: 10 })),
      },
    ],
  },
  // ── 质检包装（1人）──────────────────────────────────────────
  {
    idx: 8, processName: "质检包装", totalBundles: 8, totalPieces: 80,
    color: PROCESS_COLORS[7],
    workers: [
      {
        name: "周质检", bundles: 8, pieces: 80,
        summary: [{ color: "天蓝", size: "25-32", total: 80 }],
        items: WORKERS_BASE.map((w) => ({ ...w, qty: 8 })),
      },
    ],
  },
];

// ─── 共用：状态徽章样式 ─────────────────────────────────────
function statusBg(status: ProcessStatus, theme: "green" | "dark" | "blue" | "warm" | "bw") {
  const map = {
    green: { "可分货": "bg-green-500 text-white", "已分货": "bg-amber-400 text-amber-900", "不可分": "bg-gray-100 text-gray-400 border border-gray-200" },
    dark:  { "可分货": "bg-emerald-500 text-white", "已分货": "bg-amber-400 text-amber-900", "不可分": "bg-gray-700 text-gray-500" },
    blue:  { "可分货": "bg-blue-600 text-white", "已分货": "bg-sky-200 text-blue-800", "不可分": "bg-gray-100 text-gray-400 border border-dashed border-gray-300" },
    warm:  { "可分货": "bg-teal-500 text-white", "已分货": "bg-orange-400 text-white", "不可分": "bg-gray-100 text-gray-300 border border-gray-200" },
    bw:    { "可分货": "bg-green-600 text-white", "已分货": "bg-red-500 text-white", "不可分": "bg-gray-200 text-gray-400" },
  };
  return map[theme][status];
}

// ─── 共用：同步横向滚动的表头+数据区 ─────────────────────────
interface BatchTableProps {
  headerBg: string;
  headerText: string;
  rowEven: string;
  rowOdd: string;
  theme: "green" | "dark" | "blue" | "warm" | "bw";
  fixedColClass: string;
  totalColClass: string;
  badgeH?: string;
}

function BatchTable({ headerBg, headerText, rowEven, rowOdd, theme, fixedColClass, totalColClass, badgeH = "h-9" }: BatchTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const syncScroll = (src: HTMLDivElement, dst: HTMLDivElement | null) => {
    if (dst) dst.scrollLeft = src.scrollLeft;
  };

  return (
    <div className="border-b border-gray-200">
      {/* 表头行 */}
      <div className={`flex items-center px-3 py-2 ${headerBg}`}>
        <div className={`w-24 flex-shrink-0 text-sm font-bold ${headerText}`}>匹号/颜色/尺码</div>
        <div className={`w-12 flex-shrink-0 text-sm font-bold text-center ${headerText}`}>总数</div>
        <div
          ref={headerScrollRef}
          className="flex-1 overflow-x-hidden"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="flex gap-1.5 pl-2" style={{ minWidth: "max-content" }}>
            {PROCESSES.map((p, pi) => (
              <div key={p} className="flex-shrink-0 w-[4.5rem] text-center">
                <span className="text-xs font-bold opacity-60">{pi + 1}.</span>
                <span className={`text-sm font-bold ${headerText} ml-0.5`}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 数据行 */}
      {BATCH_ROWS.map((row, i) => (
        <div key={i} className={`flex items-center px-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? rowEven : rowOdd}`}>
          {/* 固定列：匹号 + 颜色尺码 */}
          <div className="w-24 flex-shrink-0 py-2">
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-black ${fixedColClass}`}>{row.matchNo}</span>
              <span className="text-sm font-bold text-gray-400">{row.bundleNo}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1 rounded">{row.color}</span>
              <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1 rounded">{row.size}</span>
            </div>
          </div>
          {/* 固定列：总数 */}
          <div className={`w-12 flex-shrink-0 text-center text-lg font-black ${totalColClass}`}>{row.total}</div>
          {/* 滚动列：工序状态 */}
          <div
            className="flex-1 overflow-x-auto py-2"
            style={{ scrollbarWidth: "none" }}
            ref={i === 0 ? scrollRef : undefined}
            onScroll={(e) => {
              const t = e.currentTarget;
              // 同步所有同级数据行和表头
              const parent = t.closest(".border-b.border-gray-200");
              if (!parent) return;
              parent.querySelectorAll<HTMLDivElement>(".flex-1.overflow-x-auto").forEach((el) => {
                if (el !== t) el.scrollLeft = t.scrollLeft;
              });
              if (headerScrollRef.current) headerScrollRef.current.scrollLeft = t.scrollLeft;
            }}
          >
            <div className="flex gap-1.5 pl-2" style={{ minWidth: "max-content" }}>
              {row.statuses.map((s, j) => (
                <div
                  key={j}
                  className={`flex-shrink-0 w-[4.5rem] ${badgeH} flex items-center justify-center rounded text-sm font-bold ${statusBg(s, theme)}`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案一专用（卡片式，颜色在匹号下，尺码+件数横排）
function MatchSummaryOne({ items, color: _color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="flex gap-2 flex-wrap mt-1 mb-1">
      {ms.map((m, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 min-w-[100px]">
          {/* 第X匹 */}
          <div className="flex items-baseline gap-0.5 mb-0.5">
            <span className="text-xs text-gray-400">第</span>
            <span className="text-2xl font-black text-red-500 leading-none">{m.matchNo}</span>
            <span className="text-xs text-gray-400">匹</span>
          </div>
          {/* 颜色（弱化，独立行） */}
          <div className="text-xs text-gray-400 font-medium mb-1.5">
            {Array.from(new Set(m.entries.map(e => e.color))).join(" / ")}
          </div>
          {/* 尺码+件数横排 */}
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            {m.entries.map((e, ei) => (
              <div key={ei} className="flex items-baseline gap-0.5">
                <span className="text-sm font-black text-gray-600 rounded border border-gray-300 bg-white px-1.5 py-0.5 leading-none">{e.size}</span>
                <span className="text-lg font-black text-gray-900 leading-none">{e.qty}</span>
                <span className="text-xs text-gray-400">件</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案二专用（水平标签行，紧凑横排）
function MatchSummaryOneByWorker({
  items,
  color,
  sharedBundleNos,
}: {
  items: WorkerItem[];
  color: string;
  sharedBundleNos: Set<string>;
}) {
  const map = new Map<string, { matchNo: string; colors: string[]; entries: WorkerItem[]; total: number }>();
  items.forEach((item) => {
    if (!map.has(item.matchNo)) {
      map.set(item.matchNo, { matchNo: item.matchNo, colors: [], entries: [], total: 0 });
    }
    const rec = map.get(item.matchNo)!;
    if (!rec.colors.includes(item.color)) rec.colors.push(item.color);
    rec.entries.push(item);
    rec.total += item.qty;
  });
  const ms = Array.from(map.values()).sort((a, b) => Number(a.matchNo) - Number(b.matchNo));
  return (
    <div className="mt-1 space-y-2">
      {ms.map((m, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ background: `${color}18` }}>
            <span className="text-2xl font-black text-red-500">{m.matchNo}</span>
            <span className="text-sm text-gray-500">匹</span>
            <span className="text-sm font-semibold text-gray-600">{m.colors.join(" / ")}</span>
            <span className="ml-auto text-sm text-gray-500">{m.total} 件</span>
          </div>
          <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
            {[...m.entries].sort((a, b) => Number(a.no) - Number(b.no) || Number(a.size) - Number(b.size)).map((e, ei) => {
              const isShared = sharedBundleNos.has(getBundleKey(e));
              return (
                <div key={ei} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                  <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-base font-semibold text-gray-500">
                    <span className="text-gray-700">{e.no}</span>扎
                  </span>
                  <span className={`text-lg font-black leading-none ${isShared ? "text-sky-600" : "text-gray-800"}`}>
                    {e.size}
                  </span>
                  <span className="text-base font-semibold text-slate-300">
                    <span className="text-slate-500">{e.qty}</span>件
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkerSummaryMeta({
  name,
  items,
  sec,
  bundles,
  pieces,
  sharedBundleNos,
}: {
  name: string;
  items: WorkerItem[];
  sec: SectionType;
  bundles: number;
  pieces: number;
  sharedBundleNos: Set<string>;
}) {
  const matchNotes = getWorkerMatchNotes(items, sec, sharedBundleNos);
  const wholeMatches = matchNotes.filter((note) => note.complete).map((note) => note.matchNo);
  const partialMatches = matchNotes.filter((note) => !note.complete);

  return (
    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-black text-gray-900">{name}</span>
        <span className="text-sm text-gray-400">{bundles} 扎</span>
        <span className="text-lg font-black text-red-500">{pieces}</span>
        <span className="text-sm text-gray-400">件</span>
        {wholeMatches.length > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
            <span className="text-gray-400">整匹：</span>
            <span className="text-sm font-semibold text-gray-600">{wholeMatches.join("，")}</span>
          </span>
        )}
      </div>
      {partialMatches.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
          {partialMatches.map((note) => (
              <span key={note.matchNo} className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-0.5">
              <span className="text-sm font-semibold text-gray-600">{note.matchNo}匹：</span>
                <span className="flex flex-wrap items-center gap-1">
                {note.sizes.map((size, idx) => (
                  <span key={size.size} className={size.isShared ? "text-base font-black text-sky-600" : "text-base font-black text-gray-700"}>
                    {idx > 0 ? "," : ""}{size.size}
                  </span>
                ))}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function MatchSummaryTwo({ items, color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="space-y-1.5 mt-1">
      {ms.map((m, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <div className="flex-shrink-0 flex items-center gap-0.5 min-w-[52px]">
            <span className="text-base font-black text-red-500">{m.matchNo}</span>
            <span className="text-xs text-gray-400">匹</span>
            <span className="text-xs text-gray-300 mx-0.5 font-light">{Array.from(new Set(m.entries.map(e => e.color))).join("/")}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {m.entries.map((e, ei) => (
              <span key={ei} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ background: color }}>
                {e.size} <span className="font-black text-sm">{e.qty}</span>件
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案三专用（抽屉内大尺寸卡片，含色块）
function MatchSummaryThree({ items, color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="space-y-2 mt-1">
      {ms.map((m, i) => (
        <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
          <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: `${color}18` }}>
            <span className="text-2xl font-black text-red-500">{m.matchNo}</span>
            <span className="text-sm text-gray-500">匹</span>
            <span className="text-sm font-bold" style={{ color }}>{Array.from(new Set(m.entries.map(e => e.color))).join(" · ")}</span>
            <span className="ml-auto text-sm text-gray-500">{m.total} 件</span>
          </div>
          <div className="px-3 py-2 flex flex-wrap gap-2 bg-white">
            {m.entries.map((e, ei) => (
              <div key={ei} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 border" style={{ borderColor: `${color}50`, background: `${color}08` }}>
                <span className="text-base font-black" style={{ color }}>{e.size}</span>
                <span className="text-2xl font-black text-gray-900">{e.qty}</span>
                <span className="text-sm text-gray-400">件</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案四专用（行内紧凑，时间轴右侧空间有限）
function MatchSummaryFour({ items, color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="mt-1 space-y-1">
      {ms.map((m, i) => (
        <div key={i} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 border border-gray-100 bg-gray-50">
          <span className="text-xl font-black text-red-500 w-5 text-center leading-none">{m.matchNo}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-400 w-8">{Array.from(new Set(m.entries.map(e => e.color))).join("/")}</span>
          <span className="text-xs text-gray-300">|</span>
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            {m.entries.map((e, ei) => (
              <span key={ei} className="text-xs font-bold">
                <span className="font-black rounded px-1 text-white text-xs" style={{ background: color }}>{e.size}</span>
                <span className="text-gray-900 font-black ml-0.5">{e.qty}</span>
                <span className="text-gray-400">件</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案五专用（黑白超大风格）
function MatchSummaryFive({ items, color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="flex gap-2 flex-wrap mt-1">
      {ms.map((m, i) => (
        <div key={i} className="rounded-xl border-2 border-gray-900 bg-white px-3 py-2">
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-xs text-gray-500">第</span>
            <span className="text-3xl font-black text-red-600 leading-none">{m.matchNo}</span>
            <span className="text-xs text-gray-500">匹</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">{Array.from(new Set(m.entries.map(e => e.color))).join(" / ")}</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {m.entries.map((e, ei) => (
              <div key={ei} className="flex items-baseline gap-1">
                <span className="text-base font-black bg-gray-900 text-white px-2 py-0.5 rounded">{e.size}</span>
                <span className="text-2xl font-black text-gray-900">{e.qty}</span>
                <span className="text-sm text-gray-400">件</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：按匹汇总 - 方案六～十通用（紧凑版）
function MatchSummaryBar({ items, color }: { items: WorkerItem[]; color: string }) {
  const ms = calcMatchSummary(items);
  return (
    <div className="flex gap-2 flex-wrap mt-1 mb-1">
      {ms.map((m, i) => (
        <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
          <div className="flex items-baseline gap-0.5 mb-0.5">
            <span className="text-xs text-gray-400">第</span>
            <span className="text-xl font-black text-red-500 leading-none">{m.matchNo}</span>
            <span className="text-xs text-gray-400">匹</span>
          </div>
          <div className="text-xs text-gray-400 mb-1">{Array.from(new Set(m.entries.map(e => e.color))).join(" / ")}</div>
          <div className="flex flex-wrap gap-x-1.5 gap-y-1">
            {m.entries.map((e, ei) => (
              <div key={ei} className="flex items-baseline gap-0.5">
                <span className="text-xs font-black text-white rounded px-1 py-0.5" style={{ background: color }}>{e.size}</span>
                <span className="text-base font-black text-gray-900 leading-none">{e.qty}</span>
                <span className="text-xs text-gray-400">件</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 共用：工序块标题 ─────────────────────────────────────────
function ProcessHeader({ idx, name, bundles, pieces, color, titleClass }: {
  idx: number; name: string; bundles: number; pieces: number; color: string; titleClass: string;
}) {
  return (
    <div className={`px-3 py-2 flex items-center gap-2 ${titleClass}`}>
      <span
        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-white text-base font-black"
        style={{ background: color }}
      >{idx}</span>
      <span className="text-xs text-gray-400 font-medium">工序</span>
      <span className="text-base font-black" style={{ color }}>{name}</span>
      <span className="text-xs text-gray-400 ml-1">{bundles}扎 {pieces}件</span>
    </div>
  );
}

// ─── 方案一相关组件 ──────────────────────────────────────────

/** SVG 进度圆圈 + 状态图标 */
function ProgressRing({ pct }: { pct: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const dashArray = [dash, circ].join(" ");
  const status = pct === 0 ? "notStarted" : pct >= 100 ? "done" : "inProgress";
  const theme = status === "notStarted"
    ? { stroke: "#d1d5db", icon: "#9ca3af" }
    : status === "done"
      ? { stroke: "#22c55e", icon: "#16a34a" }
      : { stroke: "#f59e0b", icon: "#d97706" };
  return (
    <div className="relative flex-shrink-0" style={{ width: 44, height: 44 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={theme.stroke} strokeWidth="4"
          strokeDasharray={dashArray} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {status === "notStarted" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
        {status === "inProgress" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.icon} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        )}
        {status === "done" && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.icon} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
    </div>
  );
}

/** 工序标题行（含进度圆圈，点击展开/收起工序卡） */
function ProcessHeaderWithRing({
  sec, titleClass, isOpen, onToggle, onProgressClick,
}: {
  sec: SectionType; titleClass: string; isOpen: boolean; onToggle: () => void; onProgressClick?: () => void;
}) {
  const mockPct = sec.idx === 1 ? 75 : sec.idx === 2 ? 100 : sec.idx === 3 ? 40 : sec.idx === 4 ? 10 : 0;
  const sectionStats = getSectionStats(sec);
  return (
    <div className={`w-full px-3 py-2 flex items-center gap-2 ${titleClass}`}>
      <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={onToggle}>
      <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full text-white text-base font-black" style={{ background: sec.color }}>
        {sec.idx}
      </span>
      <span className="text-xs text-gray-400 font-medium">工序</span>
      <span className="text-base font-black text-gray-900">{sec.processName}</span>
      <span className="text-xs text-gray-400 ml-1">{sectionStats.bundles}扎 {sectionStats.pieces}件</span>
      <span className="ml-2 text-gray-400 text-sm">{isOpen ? "▲" : "▼"}</span>
      <div className="hidden ml-auto">
        <ProgressRing pct={mockPct} />
      </div>
      </button>
      {onProgressClick ? (
        <button
          type="button"
          onClick={onProgressClick}
          className="shrink-0 cursor-pointer rounded-full transition-transform active:scale-95"
          title="打开工序分配"
        >
          <ProgressRing pct={mockPct} />
        </button>
      ) : (
        <div className="shrink-0">
          <ProgressRing pct={mockPct} />
        </div>
      )}
    </div>
  );
}

/** 人员卡片（点击展开/收起明细） */
function WorkerCard({ w, sec, isOpen, onToggle, sharedBundleNos }: {
  w: WorkerType; sec: SectionType; isOpen: boolean; onToggle: () => void; sharedBundleNos: Set<string>;
}) {
  const workerStats = getWorkerStats(w.items);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button className="w-full px-3 py-2.5 text-left" onClick={onToggle}>
        <div className="flex items-center justify-between gap-2">
          <WorkerSummaryMeta
            name={w.name}
            items={w.items}
            sec={sec}
            bundles={workerStats.bundles}
            pieces={workerStats.pieces}
            sharedBundleNos={sharedBundleNos}
          />
          <span className="shrink-0 text-gray-300 text-lg">{isOpen ? "▼" : "▶"}</span>
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-2.5">
          <MatchSummaryOneByWorker items={w.items} color={sec.color} sharedBundleNos={sharedBundleNos} />
        </div>
      )}
    </div>
  );
}

function WorkersByMatch({ sec, sharedBundleNos }: { sec: SectionType; sharedBundleNos: Set<string> }) {
  type MatchEntry = { no: string; workerName: string; size: string; qty: number };
  type MatchGroup = { matchNo: string; colors: string[]; entries: MatchEntry[] };
  const matchMap = new Map<string, MatchGroup>();
  sec.workers.forEach((w) => {
    w.items.forEach((item) => {
      if (!matchMap.has(item.matchNo)) matchMap.set(item.matchNo, { matchNo: item.matchNo, colors: [], entries: [] });
      const g = matchMap.get(item.matchNo)!;
      if (!g.colors.includes(item.color)) g.colors.push(item.color);
      g.entries.push({ no: item.no, workerName: w.name, size: item.size, qty: item.qty });
    });
  });
  const groups = Array.from(matchMap.values()).sort((a, b) => Number(a.matchNo) - Number(b.matchNo));
  const workerTotals = new Map<string, { bundles: number; pieces: number }>();
  sec.workers.forEach((w) => workerTotals.set(w.name, { bundles: w.bundles, pieces: w.pieces }));

  return (
    <div className="space-y-3 px-3 py-3">
      {groups.map((g, gi) => (
        <div key={gi} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-2">
            <span className="text-2xl font-black text-red-500 leading-none">{g.matchNo}</span>
            <span className="text-sm text-gray-400">匹</span>
            <span className="text-sm font-semibold text-gray-600">{g.colors.join(" / ")}</span>
            <span className="ml-auto text-sm text-gray-500">{g.entries.reduce((sum, entry) => sum + entry.qty, 0)} 件</span>
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-gray-100 px-3 py-2">
            {Array.from(new Set(g.entries.map((entry) => entry.no))).map((no) => (
              <span key={no} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBundleBadgeTone(sharedBundleNos.has(`${g.matchNo}:${no}`))}`}>
                扎{no}
              </span>
            ))}
          </div>
          <div className="space-y-2 px-3 py-3">
            {(() => {
              const byWorker = new Map<string, { no: string; size: string; qty: number }[]>();
              g.entries.forEach((entry) => {
                if (!byWorker.has(entry.workerName)) byWorker.set(entry.workerName, []);
                byWorker.get(entry.workerName)!.push({ no: entry.no, size: entry.size, qty: entry.qty });
              });
              return Array.from(byWorker.entries()).map(([name, parts], wi) => {
                const totals = workerTotals.get(name);
                return (
                  <div key={wi} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-gray-900">{name}</span>
                      {totals && (
                        <>
                          <span className="text-sm text-gray-400">{totals.bundles} 扎</span>
                          <span className="text-lg font-black text-red-500">{totals.pieces}</span>
                          <span className="text-sm text-gray-400">件</span>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Array.from(new Set(parts.map((part) => part.no))).map((no) => (
                        <span key={no} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBundleBadgeTone(sharedBundleNos.has(`${g.matchNo}:${no}`))}`}>
                          扎{no}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {parts.map((part, pi) => (
                        <div key={pi} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5">
                          <span className="text-sm font-medium text-gray-500">{part.size}</span>
                          <span className="text-lg font-medium text-gray-700">{part.qty}</span>
                          <span className="text-xs text-gray-400">件</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ))}
    </div>
  );
}

function TabByProcess({ onProgressClick }: { onProgressClick?: () => void }) {
  const [secOpen, setSecOpen] = useState<Record<number, boolean>>(
    Object.fromEntries(PROCESS_SECTIONS.map((_, i) => [i, true]))
  );
  const [workerOpen, setWorkerOpen] = useState<Record<string, boolean>>({});
  const [jumpTo, setJumpTo] = useState<number>(-1);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const toggleSection = (si: number) =>
    setSecOpen((p) => ({ ...p, [si]: !(p[si] ?? true) }));

  const toggleWorker = (key: string) =>
    setWorkerOpen((p) => ({ ...p, [key]: !p[key] }));

  const handleJump = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setJumpTo(idx);
    if (idx >= 0 && sectionRefs.current[idx] && scrollRef.current) {
      const container = scrollRef.current;
      const target = sectionRefs.current[idx];
      if (target) container.scrollTo({ top: target.offsetTop - container.offsetTop - 8, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200">
        <div className="flex-1 relative">
          <select
            value={jumpTo}
            onChange={handleJump}
            className="w-full text-sm font-bold bg-white border border-gray-300 rounded-lg px-2 py-1.5 appearance-none pr-6 text-gray-700"
          >
            <option value={-1}>快速定位工序...</option>
            {PROCESS_SECTIONS.map((s, i) => (
              <option key={i} value={i}>{s.idx}. {s.processName}</option>
            ))}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs">▼</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-2 pb-20 space-y-2" style={{ scrollbarWidth: "none" }}>
        {PROCESS_SECTIONS.map((sec, si) => {
          const isSecOpen = secOpen[si] ?? true;
          const sharedBundleNos = getSharedBundleNos(sec);
          return (
            <div key={si} ref={(el) => { sectionRefs.current[si] = el; }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <ProcessHeaderWithRing sec={sec} titleClass="border-b border-gray-100" isOpen={isSecOpen} onToggle={() => toggleSection(si)} onProgressClick={onProgressClick} />
              {isSecOpen && sec.workers.map((w, wi) => (
                <WorkerCard key={wi} w={w} sec={sec} sharedBundleNos={sharedBundleNos}
                  isOpen={workerOpen[`${si}-${wi}`] ?? false}
                  onToggle={() => toggleWorker(`${si}-${wi}`)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 多工序人员头像：用 SVG 饼图按工序颜色等分圆 */
function MultiColorAvatar({ name, colors }: { name: string; colors: string[] }) {
  const size = 36;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  if (colors.length === 1) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-base font-black flex-shrink-0"
        style={{ background: colors[0] }}>{name[0]}</div>
    );
  }
  const slices = colors.map((color, i) => {
    const startAngle = (i / colors.length) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / colors.length) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = 1 / colors.length > 0.5 ? 1 : 0;
    return { color, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });
  return (
    <div className="relative flex-shrink-0 w-9 h-9">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full overflow-hidden">
        {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} />)}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-black drop-shadow">
        {name[0]}
      </span>
    </div>
  );
}

/** 按人员 Tab 所需数据（在组件定义之前声明） */
const ALL_WORKERS_MERGED = (() => {
  const map = new Map<string, { name: string; procMap: { sec: SectionType; worker: WorkerType }[] }>();
  PROCESS_SECTIONS.forEach((sec) => {
    sec.workers.forEach((w) => {
      if (!map.has(w.name)) map.set(w.name, { name: w.name, procMap: [] });
      map.get(w.name)!.procMap.push({ sec, worker: w });
    });
  });
  return Array.from(map.values());
})();

/** 按人员 Tab */
function TabByWorker() {
  const [openWorker, setOpenWorker] = useState<string | null>(ALL_WORKERS_MERGED[0]?.name ?? null);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const personRefs = useRef<(HTMLDivElement | null)[]>([]);

  const filtered = ALL_WORKERS_MERGED.filter((p) =>
    search === "" || p.name.includes(search)
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    if (val && scrollRef.current) {
      const idx = ALL_WORKERS_MERGED.findIndex((p) => p.name.includes(val));
      if (idx >= 0 && personRefs.current[idx]) {
        const container = scrollRef.current;
        const target = personRefs.current[idx];
        if (target) container.scrollTo({ top: target.offsetTop - container.offsetTop - 8, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col min-h-0">
      <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 bg-gray-100 border-b border-gray-200">
        <div className="flex-1 relative">
          <input type="text" value={search} onChange={handleSearch} placeholder="搜索人员..."
            className="w-full text-sm bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-gray-700 font-medium placeholder:text-gray-400" />
          {search ? (
            <button onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-base leading-none">×</button>
          ) : (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
          )}
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pt-2 pb-20 space-y-2" style={{ scrollbarWidth: "none" }}>
        {filtered.map((person, pi) => {
          const isOpen = openWorker === person.name;
          const totalPieces = person.procMap.reduce((a, p) => a + getWorkerStats(p.worker.items).pieces, 0);
          const totalBundles = person.procMap.reduce((a, p) => a + getWorkerStats(p.worker.items).bundles, 0);
          const avatarColors = person.procMap.map((p) => p.sec.color);
          const realIdx = ALL_WORKERS_MERGED.indexOf(person);
          return (
            <div key={pi} ref={(el) => { personRefs.current[realIdx] = el; }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <button className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                onClick={() => setOpenWorker(isOpen ? null : person.name)}>
                <MultiColorAvatar name={person.name} colors={avatarColors} />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-gray-900">{person.name}</span>
                    <span className="text-sm text-gray-400">{totalBundles}扎</span>
                    <span className="text-xl font-black text-red-500">{totalPieces}</span>
                    <span className="text-sm text-gray-400">件</span>
                  </div>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {person.procMap.map((p, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold"
                        style={{ background: p.sec.color }}>{p.sec.idx}.{p.sec.processName}</span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-300 text-lg">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-gray-100 px-3 py-2">
                  {person.procMap.map((proc, pi2) => {
                    const procStats = getWorkerStats(proc.worker.items);
                    const procSharedBundleNos = getSharedBundleNos(proc.sec);
                    return (
                      <div key={pi2} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-black text-white"
                            style={{ background: proc.sec.color }}
                          >
                            {proc.sec.idx}
                          </span>
                          <span className="text-xs font-medium text-gray-400">工序</span>
                          <span className="text-base font-black text-gray-900">{proc.sec.processName}</span>
                          <span className="ml-auto text-xs text-gray-400">{procStats.bundles}扎 {procStats.pieces}件</span>
                        </div>
                        <div className="px-3 py-2.5">
                          <WorkerSummaryMeta
                            name={person.name}
                            items={proc.worker.items}
                            sec={proc.sec}
                            bundles={procStats.bundles}
                            pieces={procStats.pieces}
                            sharedBundleNos={procSharedBundleNos}
                          />
                        </div>
                        <div className="px-3 pb-2.5">
                          <MatchSummaryOneByWorker
                            items={proc.worker.items}
                            color={proc.sec.color}
                            sharedBundleNos={procSharedBundleNos}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-base">未找到匹配人员</div>
        )}
      </div>
    </div>
  );
}

function ThemeOne({ onOpenSchemeEleven }: { onOpenSchemeEleven?: () => void }) {
  const [tab, setTab] = useState<"process" | "worker">("process");
  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button className="text-base font-medium">{"← 返回"}</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 pt-2 pb-0 flex">
        <button onClick={() => setTab("process")}
          className={`flex-1 py-2.5 text-base font-bold border-b-2 transition-all ${tab === "process" ? "border-green-600 text-green-700" : "border-transparent text-gray-400"}`}>
          按工序查看</button>
        <button onClick={() => setTab("worker")}
          className={`flex-1 py-2.5 text-base font-bold border-b-2 transition-all ${tab === "worker" ? "border-green-600 text-green-700" : "border-transparent text-gray-400"}`}>
          按人员查看</button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === "process" ? <TabByProcess onProgressClick={onOpenSchemeEleven} /> : <TabByWorker />}
      </div>
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-green-600 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}


// ─── 方案二：横排标签页切换工序 ────────────────────────────────
// 交互特点：工序区用标签页切换，每次只��一道工序的完整分货明细
function ThemeTwo() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [activeProcess, setActiveProcess] = useState(0);
  const sec = PROCESS_SECTIONS[activeProcess] ?? PROCESS_SECTIONS[0];

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-slate-700 px-3 py-2 flex items-center gap-2 border-b border-slate-600">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-teal-500 text-white" : "bg-slate-600 text-slate-300"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-teal-500 text-white" : "bg-slate-600 text-slate-300"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-slate-600 text-slate-300 text-sm ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-teal-500 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-slate-700"
        headerText="text-slate-200"
        rowEven="bg-white"
        rowOdd="bg-slate-50"
        theme="green"
        fixedColClass="text-red-500"
        totalColClass="text-slate-800"
      />

      {/* 工序标签横滑 */}
      <div className="bg-white border-b border-gray-200 px-2 py-1.5">
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {PROCESS_SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveProcess(i)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border transition-all ${activeProcess === i ? "text-white border-transparent shadow" : "bg-white text-gray-500 border-gray-200"}`}
              style={activeProcess === i ? { background: s.color, borderColor: s.color } : {}}
            >
              <span className="text-xs font-black opacity-80">{s.idx}.</span>
              {s.processName}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-20 space-y-2" style={{ scrollbarWidth: "none" }}>
        <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: sec.color }}>
          <ProcessHeader idx={sec.idx} name={sec.processName} bundles={sec.totalBundles} pieces={sec.totalPieces} color={sec.color} titleClass="border-b border-gray-100 bg-gray-50" />
          {sec.workers.map((w, wi) => (
            <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-black" style={{ color: sec.color }}>{w.name}</span>
                <span className="text-sm text-gray-400">{w.bundles} 扎</span>
                <span className="text-xl font-black text-red-500">{getWorkerStats(w.items).pieces}</span>
                <span className="text-sm text-gray-400">件</span>
              </div>
              <MatchSummaryTwo items={w.items} color={sec.color} />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 text-white text-lg font-black rounded-xl shadow mr-3" style={{ background: sec.color }}>保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案三：紧凑行列表（横向紧凑，每行一个工人，点击查看明细弹出层）
// 交互特点：工人明细用底部弹出抽屉展示，列表极度紧凑
type SectionType = typeof PROCESS_SECTIONS[number];
type WorkerType = SectionType["workers"][number];

function ThemeThree() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [drawer, setDrawer] = useState<{ sec: SectionType; worker: WorkerType } | null>(null);

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", overflow: "hidden" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#0f172a" }}>
        <button className="text-base font-medium text-slate-300">← 返回</button>
        <span className="text-lg font-black text-white">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="px-3 py-2 flex items-center gap-2 border-b border-slate-200" style={{ background: "#f8fafc" }}>
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-slate-900 text-white shadow" : "bg-white text-slate-500 border border-slate-200"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-white text-slate-500 text-sm border border-slate-200 ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-slate-900"
        headerText="text-slate-200"
        rowEven="bg-white"
        rowOdd="bg-slate-50"
        theme="blue"
        fixedColClass="text-red-500"
        totalColClass="text-slate-800"
      />

      <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200">
        <span className="text-xs text-slate-500 font-medium">方案三：点击工人行 → 底部弹出明细</span>
      </div>

      <div className="flex-1 overflow-y-auto pb-20" style={{ scrollbarWidth: "none" }}>
        {PROCESS_SECTIONS.map((sec, si) => (
          <div key={si} className="border-b-2 border-gray-100 last:border-0">
            <ProcessHeader idx={sec.idx} name={sec.processName} bundles={sec.totalBundles} pieces={sec.totalPieces} color={sec.color} titleClass="bg-slate-50" />
            {sec.workers.map((w, wi) => (
              <button
                key={wi}
                className="w-full flex items-center px-3 py-2.5 border-b border-gray-100 last:border-0 text-left active:bg-gray-50"
                onClick={() => setDrawer({ sec, worker: w })}
              >
                <span className="text-base font-black w-20" style={{ color: sec.color }}>{w.name}</span>
                <span className="text-sm text-gray-400 w-16">{w.bundles} 扎</span>
                <span className="text-xl font-black text-red-500 w-14">{getWorkerStats(w.items).pieces} 件</span>
                <div className="flex gap-1 flex-1 flex-wrap">
                  {w.summary.map((s, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">{s.color}/{s.size}:{s.total}</span>
                  ))}
                </div>
                <span className="text-gray-300 text-lg ml-2">›</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* 底部抽屉 */}
      {drawer && (
        <div className="absolute inset-0 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.45)", zIndex: 50 }}>
          <div className="bg-white rounded-t-2xl px-4 pt-3 pb-6 max-h-[60%] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-base font-black" style={{ color: drawer.sec.color }}>{drawer.worker.name}</span>
                <span className="text-sm text-gray-400">{drawer.worker.bundles} 扎</span>
                <span className="text-xl font-black text-red-500">{drawer.worker.pieces}</span>
                <span className="text-sm text-gray-400">件</span>
              </div>
              <button onClick={() => setDrawer(null)} className="text-gray-400 text-2xl font-light leading-none">×</button>
            </div>
            <MatchSummaryThree items={drawer.worker.items} color={drawer.sec.color} />
          </div>
        </div>
      )}

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-slate-900 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案四：时间轴进度流 ──────────────────────────────────────
// 交互特点：左侧固定工序序号时间轴，右侧滚动浏览每道工序的分货，一眼看清进度
function ThemeFour() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-indigo-700 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-indigo-50 px-3 py-2 flex items-center gap-2 border-b border-indigo-200">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-indigo-700 text-white shadow" : "bg-white text-indigo-500 border border-indigo-200"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-indigo-700 text-white shadow" : "bg-white text-indigo-500 border border-indigo-200"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-white text-indigo-400 text-sm border border-indigo-200 ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-indigo-700 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-indigo-700"
        headerText="text-indigo-100"
        rowEven="bg-white"
        rowOdd="bg-indigo-50"
        theme="blue"
        fixedColClass="text-red-500"
        totalColClass="text-indigo-900"
        badgeH="h-10"
      />

      <div className="px-3 py-1.5 bg-indigo-50 border-b border-indigo-100">
        <span className="text-xs text-indigo-600 font-medium">方案四：左侧时间轴选工序，右侧查看分货明细</span>
      </div>

      <div className="flex flex-1 overflow-hidden pb-16">
        {/* 左侧时间轴 */}
        <div className="w-14 flex-shrink-0 bg-white border-r border-gray-100 overflow-y-auto flex flex-col items-center py-2 gap-1">
          {PROCESS_SECTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="flex flex-col items-center w-full py-2 relative"
            >
              {i < PROCESS_SECTIONS.length - 1 && (
                <div className="absolute left-1/2 top-8 bottom-0 w-0.5 -translate-x-1/2" style={{ background: "#e2e8f0" }} />
              )}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-base font-black z-10 border-2 transition-all"
                style={activeIdx === i
                  ? { background: s.color, color: "white", borderColor: s.color }
                  : { background: "white", color: s.color, borderColor: s.color }}
              >
                {s.idx}
              </div>
              <span className="text-[10px] text-gray-400 mt-1 leading-tight text-center w-12 truncate">{s.processName}</span>
            </button>
          ))}
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {(() => {
            const sec = PROCESS_SECTIONS[activeIdx];
            return (
              <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: sec.color }}>
                <ProcessHeader idx={sec.idx} name={sec.processName} bundles={sec.totalBundles} pieces={sec.totalPieces} color={sec.color} titleClass="border-b border-gray-100 bg-gray-50" />
                {sec.workers.map((w, wi) => (
                  <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-black" style={{ color: sec.color }}>{w.name}</span>
                      <span className="text-sm text-gray-400">{w.bundles} 扎</span>
                      <span className="text-xl font-black text-red-500">{getWorkerStats(w.items).pieces}</span>
                      <span className="text-sm text-gray-400">件</span>
                    </div>
                    <MatchSummaryFour items={w.items} color={sec.color} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-indigo-700 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案五：超大字极简黑白风（保留原版，强化细节）────────────
function ThemeFive() {
  const [mode, setMode] = useState<"avg" | "total">("avg");

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-black px-4 py-3.5 flex items-center justify-between">
        <button className="text-lg font-bold text-white">← 返回</button>
        <span className="text-xl font-black text-white tracking-wider">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-gray-100 px-3 py-2.5 flex items-center gap-2 border-b-2 border-gray-300">
        <button onClick={() => setMode("avg")} className={`flex-1 py-3 rounded-lg text-lg font-black ${mode === "avg" ? "bg-black text-white shadow" : "bg-white text-gray-500 border-2 border-gray-300"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-3 rounded-lg text-lg font-black ${mode === "total" ? "bg-black text-white shadow" : "bg-white text-gray-500 border-2 border-gray-300"}`}>填总数</button>
        <button className="px-3 py-2.5 rounded-lg bg-white text-gray-600 text-base font-bold border-2 border-gray-300 ml-1">清除</button>
        <button className="px-3 py-2.5 rounded-lg bg-black text-white text-base font-black">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-gray-900"
        headerText="text-gray-200"
        rowEven="bg-white"
        rowOdd="bg-gray-50"
        theme="bw"
        fixedColClass="text-red-600"
        totalColClass="text-gray-900"
        badgeH="h-10"
      />

      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20 space-y-3 bg-gray-50" style={{ scrollbarWidth: "none" }}>
        {PROCESS_SECTIONS.map((sec, si) => (
          <div key={si} className="bg-white rounded-xl overflow-hidden border-2 border-gray-900 shadow">
            <ProcessHeader idx={sec.idx} name={sec.processName} bundles={sec.totalBundles} pieces={sec.totalPieces} color={sec.color} titleClass="bg-gray-900 border-b-2 border-gray-700" />
            {sec.workers.map((w, wi) => (
              <div key={wi} className="px-3 py-3 border-b-2 border-gray-200 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-black text-gray-900">{w.name}</span>
                  <span className="text-base text-gray-400 font-medium">{w.bundles} 扎</span>
                  <span className="text-2xl font-black text-red-600">{getWorkerStats(w.items).pieces}</span>
                  <span className="text-base text-gray-400 font-medium">件</span>
                </div>
                <MatchSummaryFive items={w.items} color={sec.color} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t-4 border-gray-900 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3.5 bg-black text-white text-xl font-black rounded-xl shadow-lg mr-3 tracking-widest">保存</button>
        <div className="text-base text-gray-600 font-medium text-right">已录中：共 <span className="text-red-600 font-black text-2xl">5</span> 扎 <span className="text-red-600 font-black text-2xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案六：全屏分页横滑工序 ─────────────────────────────────
// 交互特点：每道工序占满右侧全屏，像翻书一样左右滑动，所有明细一页内可见
function ThemeSix() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [page, setPage] = useState(0);
  const total = PROCESS_SECTIONS.length;
  const sec = PROCESS_SECTIONS[page];

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-green-50 px-3 py-2 flex items-center gap-2 border-b border-green-200">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-green-700 text-white shadow" : "bg-white text-green-700 border border-green-300"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-green-700 text-white shadow" : "bg-white text-green-700 border border-green-300"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-white text-green-600 text-sm border border-green-200 ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-green-700 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-green-700"
        headerText="text-white"
        rowEven="bg-white"
        rowOdd="bg-green-50"
        theme="green"
        fixedColClass="text-red-500"
        totalColClass="text-gray-800"
      />

      {/* 工序翻页导航 */}
      <div className="flex items-center bg-white border-b border-gray-200 px-3 py-2 gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30 text-xl font-black"
        >‹</button>
        <div className="flex-1 text-center">
          <span className="w-8 h-8 inline-flex items-center justify-center rounded-full text-white text-base font-black" style={{ background: sec.color }}>{sec.idx}</span>
          <span className="text-sm text-gray-400 font-medium ml-1">工序</span>
          <span className="text-lg font-black ml-1" style={{ color: sec.color }}>{sec.processName}</span>
          <span className="text-xs text-gray-400 ml-2">{page + 1}/{total}</span>
        </div>
        <button
          onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
          disabled={page === total - 1}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 disabled:opacity-30 text-xl font-black"
        >›</button>
      </div>

      {/* 工序进度点 */}
      <div className="flex items-center justify-center gap-2 py-1.5 bg-white border-b border-gray-100">
        {PROCESS_SECTIONS.map((s, i) => (
          <button key={i} onClick={() => setPage(i)}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{ background: i === page ? s.color : "#d1d5db", transform: i === page ? "scale(1.5)" : "scale(1)" }}
          />
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-20" style={{ scrollbarWidth: "none" }}>
        <div className="bg-white rounded-xl border-2 overflow-hidden" style={{ borderColor: sec.color }}>
          <div className="px-3 py-2 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">共</span>
            <span className="text-xl font-black text-red-500">{sec.totalBundles}</span>
            <span className="text-xs text-gray-400">扎</span>
            <span className="text-xl font-black text-red-500">{sec.totalPieces}</span>
            <span className="text-xs text-gray-400">件</span>
          </div>
          {sec.workers.map((w, wi) => (
            <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-black" style={{ color: sec.color }}>{w.name}</span>
                <span className="text-sm text-gray-400">{w.bundles} 扎</span>
                <span className="text-2xl font-black text-red-500">{getWorkerStats(w.items).pieces}</span>
                <span className="text-sm text-gray-400">件</span>
              </div>
              <MatchSummaryBar items={w.items} color={sec.color} />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-green-700 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案七：双栏进度看板 ─────────────────────────────────────
// 交互特点：上��部分是工序进度总览（横向进度条），下半部分是选中工序的人员明细，两区联动
function ThemeSeven() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [selected, setSelected] = useState(0);
  const sec = PROCESS_SECTIONS[selected];

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-slate-800 px-3 py-2 flex items-center gap-2 border-b border-slate-700">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-amber-500 text-white shadow" : "bg-slate-700 text-slate-300"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-amber-500 text-white shadow" : "bg-slate-700 text-slate-300"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-slate-800"
        headerText="text-slate-200"
        rowEven="bg-white"
        rowOdd="bg-slate-50"
        theme="green"
        fixedColClass="text-red-500"
        totalColClass="text-slate-800"
      />

      {/* 工序进度总览 */}
      <div className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="text-xs text-gray-400 font-medium mb-1.5">点击工序查看分货明细</div>
        <div className="space-y-1.5">
          {PROCESS_SECTIONS.map((s, i) => {
            const pct = Math.round((s.workers.reduce((a, w) => a + w.pieces, 0) / (s.totalPieces || 1)) * 100);
            return (
              <button key={i} onClick={() => setSelected(i)} className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all ${selected === i ? "ring-2" : "bg-gray-50"}`}
                style={selected === i ? { background: `${s.color}15`, ringColor: s.color } as React.CSSProperties : {}}>
                <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-white text-xs font-black" style={{ background: s.color }}>{s.idx}</span>
                <span className="text-sm font-bold w-14 text-left" style={{ color: selected === i ? s.color : "#374151" }}>{s.processName}</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                </div>
                <span className="text-xs font-bold w-8 text-right" style={{ color: s.color }}>{pct}%</span>
                <span className="text-xs text-gray-400 w-12 text-right">{s.totalPieces}件</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-20" style={{ scrollbarWidth: "none" }}>
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="w-6 h-6 flex items-center justify-center rounded-full text-white text-sm font-black" style={{ background: sec.color }}>{sec.idx}</span>
          <span className="text-sm text-gray-400">工序</span>
          <span className="text-base font-black text-gray-900">{sec.processName}</span>
          <span className="text-xs text-gray-400 ml-auto">{sec.totalBundles} 扎 {sec.totalPieces} 件</span>
        </div>
        {sec.workers.map((w, wi) => (
          <div key={wi} className="bg-white rounded-xl border border-gray-200 mb-2 overflow-hidden">
            <div className="flex items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-base font-black" style={{ color: sec.color }}>{w.name}</span>
              <span className="text-sm text-gray-400 ml-2">{w.bundles} 扎</span>
              <span className="text-xl font-black text-red-500 ml-2">{getWorkerStats(w.items).pieces}</span>
              <span className="text-sm text-gray-400 ml-1">件</span>
            </div>
            <div className="px-3 py-2">
              <MatchSummaryBar items={w.items} color={sec.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-slate-900 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案八：按工人为主轴展示 ─────────────────────────────────
// 交互特点：以"人"为核心维度，每人一张卡，横向工序标签显示该人负责哪道工序及分货量
const ALL_WORKERS = [
  { name: "好多鱼", processMap: [{ idx: 1, processName: "三针", color: PROCESS_COLORS[0], bundles: 8, pieces: 80, summary: [{ color: "天蓝", size: "S", total: 80 }], items: WORKERS_BASE }] },
  { name: "张师傅", processMap: [{ idx: 1, processName: "三针", color: PROCESS_COLORS[0], bundles: 8, pieces: 80, summary: [{ color: "天蓝", size: "S", total: 80 }], items: WORKERS_BASE.map((w) => ({ ...w, no: String(Number(w.no) + 1) })) }] },
  { name: "李大姐", processMap: [{ idx: 2, processName: "锁边", color: PROCESS_COLORS[1], bundles: 16, pieces: 160, summary: [{ color: "大红", size: "M", total: 160 }], items: WORKERS_BASE.map((w) => ({ ...w, color: "大红", size: "M" })) }] },
  { name: "王师傅", processMap: [{ idx: 3, processName: "贴袋", color: PROCESS_COLORS[2], bundles: 6, pieces: 60, summary: [{ color: "米白", size: "L", total: 60 }], items: WORKERS_BASE.slice(0, 6).map((w) => ({ ...w, color: "米白", size: "L" })) }] },
  { name: "陈巧手", processMap: [{ idx: 4, processName: "装拉链", color: PROCESS_COLORS[3], bundles: 8, pieces: 80, summary: [{ color: "天蓝", size: "S", total: 80 }], items: WORKERS_BASE }] },
  { name: "刘整洁", processMap: [{ idx: 5, processName: "熨烫整理", color: PROCESS_COLORS[4], bundles: 6, pieces: 60, summary: [{ color: "天蓝", size: "S", total: 30 }, { color: "大红", size: "M", total: 30 }], items: WORKERS_BASE.slice(0, 6) }] },
];

function ThemeEight() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [openWorker, setOpenWorker] = useState<string | null>("好多鱼");

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-violet-700 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-violet-50 px-3 py-2 flex items-center gap-2 border-b border-violet-200">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-violet-700 text-white shadow" : "bg-white text-violet-600 border border-violet-200"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-violet-700 text-white shadow" : "bg-white text-violet-600 border border-violet-200"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-white text-violet-500 text-sm border border-violet-200 ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-violet-700 text-white text-sm font-bold">按扎号</button>
      </div>

      <BatchTable
        headerBg="bg-violet-700"
        headerText="text-white"
        rowEven="bg-white"
        rowOdd="bg-violet-50"
        theme="blue"
        fixedColClass="text-red-500"
        totalColClass="text-gray-800"
      />

      <div className="px-3 py-1.5 bg-violet-50 border-b border-violet-100">
        <span className="text-xs text-violet-700 font-medium">方案八：以工人为主轴 — 查看每人承接的工序</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-20 space-y-2" style={{ scrollbarWidth: "none" }}>
        {ALL_WORKERS.map((worker, wi) => {
          const isOpen = openWorker === worker.name;
          const totalPieces = worker.processMap.reduce((a, p) => a + p.pieces, 0);
          return (
            <div key={wi} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                className="w-full px-3 py-2.5 flex items-center gap-2 text-left"
                onClick={() => setOpenWorker(isOpen ? null : worker.name)}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-black flex-shrink-0" style={{ background: worker.processMap[0].color }}>
                  {worker.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-gray-900">{worker.name}</span>
                    <span className="text-xl font-black text-red-500">{totalPieces}</span>
                    <span className="text-sm text-gray-400">件</span>
                  </div>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {worker.processMap.map((p, pi) => (
                      <span key={pi} className="text-xs px-1.5 py-0.5 rounded-full text-white font-bold" style={{ background: p.color }}>{p.idx}.{p.processName}</span>
                    ))}
                  </div>
                </div>
                <span className="text-gray-400 text-xl">{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && worker.processMap.map((proc, pi) => (
                <div key={pi} className="border-t border-gray-100 px-3 py-2">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 flex items-center justify-center rounded-full text-white text-xs font-black" style={{ background: proc.color }}>{proc.idx}</span>
                    <span className="text-sm text-gray-400">工序</span>
                    <span className="text-base font-black" style={{ color: proc.color }}>{proc.processName}</span>
                    <span className="text-sm text-gray-400 ml-auto">{proc.bundles} 扎</span>
                    <span className="text-base font-black text-red-500">{proc.pieces} 件</span>
                  </div>
                  <MatchSummaryBar items={proc.items} color={proc.color} />
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-violet-700 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案九：颜色/尺码筛选快速定位 ──────────────────────────
// 交互特点：顶部颜色/尺码快速筛选标签，只显示命中的匹号行和分货明细，减少无关信息干扰
const COLOR_OPTIONS = ["全部", "天蓝", "大红", "米白"];
const SIZE_OPTIONS = ["全部", "S", "M", "L"];

function ThemeNine() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [filterColor, setFilterColor] = useState("全部");
  const [filterSize, setFilterSize] = useState("全部");

  const filteredBatch = BATCH_ROWS.filter((r) =>
    (filterColor === "全部" || r.color === filterColor) &&
    (filterSize === "全部" || r.size === filterSize)
  );

  const filteredSections = PROCESS_SECTIONS.map((sec) => ({
    ...sec,
    workers: sec.workers.map((w) => ({
      ...w,
      items: w.items.filter((item) =>
        (filterColor === "全部" || item.color === filterColor) &&
        (filterSize === "全部" || item.size === filterSize)
      ),
      summary: w.summary.filter((s) =>
        (filterColor === "全部" || s.color === filterColor) &&
        (filterSize === "全部" || s.size === filterSize)
      ),
    })).filter((w) => w.items.length > 0),
  })).filter((sec) => sec.workers.length > 0);

  return (
    <div className="flex flex-col bg-gray-50" style={{ height: "100%", overflow: "hidden" }}>
      <div className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-black">工序分货</span>
        <div className="w-16" />
      </div>
      <div className="bg-teal-50 px-3 py-2 flex items-center gap-2 border-b border-teal-200">
        <button onClick={() => setMode("avg")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "avg" ? "bg-teal-700 text-white shadow" : "bg-white text-teal-600 border border-teal-200"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-2.5 rounded-lg text-base font-bold ${mode === "total" ? "bg-teal-700 text-white shadow" : "bg-white text-teal-600 border border-teal-200"}`}>填总数</button>
        <button className="px-2.5 py-2 rounded-lg bg-white text-teal-500 text-sm border border-teal-200 ml-1">清除</button>
        <button className="px-2.5 py-2 rounded-lg bg-teal-700 text-white text-sm font-bold">按扎号</button>
      </div>

      {/* 颜色+尺码筛选 */}
      <div className="bg-white border-b border-gray-200 px-3 py-2 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-bold w-8 flex-shrink-0">颜色</span>
          <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {COLOR_OPTIONS.map((c) => (
              <button key={c} onClick={() => setFilterColor(c)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-sm font-bold border transition-all ${filterColor === c ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-600 border-gray-200"}`}
              >{c}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-bold w-8 flex-shrink-0">尺码</span>
          <div className="flex gap-1.5">
            {SIZE_OPTIONS.map((s) => (
              <button key={s} onClick={() => setFilterSize(s)}
                className={`px-3 py-1 rounded-full text-sm font-bold border transition-all ${filterSize === s ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"}`}
              >{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 筛选后的批次表 */}
      <div className="border-b border-gray-200">
        <div className="flex items-center px-3 py-2 bg-teal-700">
          <div className="w-24 flex-shrink-0 text-sm font-bold text-white">匹号/颜色/尺码</div>
          <div className="w-12 flex-shrink-0 text-sm font-bold text-center text-white">总数</div>
          <div className="flex-1 overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-1.5 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p, pi) => (
                <div key={p} className="flex-shrink-0 w-[4.5rem] text-center">
                  <span className="text-xs font-bold opacity-60">{pi + 1}.</span>
                  <span className="text-sm font-bold text-white ml-0.5">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {filteredBatch.length === 0 ? (
          <div className="px-3 py-6 text-center text-gray-400 text-base">无匹配数据</div>
        ) : filteredBatch.map((row, i) => (
          <div key={i} className={`flex items-center px-3 border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-teal-50"}`}>
            <div className="w-24 flex-shrink-0 py-2">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-black text-red-500">{row.matchNo}</span>
                <span className="text-sm font-bold text-gray-400">{row.bundleNo}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1 rounded">{row.color}</span>
                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-1 rounded">{row.size}</span>
              </div>
            </div>
            <div className="w-12 flex-shrink-0 text-center text-lg font-black text-gray-800">{row.total}</div>
            <div className="flex-1 overflow-x-auto py-2" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-1.5 pl-2" style={{ minWidth: "max-content" }}>
                {row.statuses.map((s, j) => (
                  <div key={j} className={`flex-shrink-0 w-[4.5rem] h-9 flex items-center justify-center rounded text-sm font-bold ${statusBg(s, "warm")}`}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-20 space-y-2" style={{ scrollbarWidth: "none" }}>
        {filteredSections.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-base">无匹配工序数据</div>
        ) : filteredSections.map((sec, si) => (
          <div key={si} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <ProcessHeader idx={sec.idx} name={sec.processName} bundles={sec.totalBundles} pieces={sec.totalPieces} color={sec.color} titleClass="border-b border-gray-100 bg-gray-50" />
            {sec.workers.map((w, wi) => (
              <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base font-black" style={{ color: sec.color }}>{w.name}</span>
                  <span className="text-sm text-gray-400">{w.bundles} 扎</span>
                  <span className="text-xl font-black text-red-500">{getWorkerStats(w.items).pieces}</span>
                  <span className="text-sm text-gray-400">件</span>
                </div>
                <MatchSummaryBar items={w.items} color={sec.color} />
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-teal-700 text-white text-lg font-black rounded-xl shadow mr-3">保存</button>
        <div className="text-sm text-gray-500 text-right">已录中：共 <span className="text-red-500 font-black text-xl">5</span> 扎 <span className="text-red-500 font-black text-xl">40</span> 件</div>
      </div>
    </div>
  );
}

// ─── 方案十：手套模式（超大触控按钮，极简操作）────────────────
// 交互特点：所有可操作区域特大，字体超大，为脏手/手套/强光环境下快速操作设计
function ThemeTen() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const [page, setPage] = useState(0);
  const [workerPage, setWorkerPage] = useState(0);
  const sec = PROCESS_SECTIONS[page];
  const worker = sec.workers[workerPage] ?? sec.workers[0];

  return (
    <div className="flex flex-col bg-white" style={{ height: "100%", overflow: "hidden" }}>
      {/* 极大顶部栏 */}
      <div className="px-4 py-4 flex items-center justify-between" style={{ background: "#1a1a1a" }}>
        <button className="text-xl font-black text-white w-16 h-12 flex items-center justify-center bg-gray-700 rounded-xl">←</button>
        <span className="text-xl font-black text-white">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 极大模式切换 */}
      <div className="px-3 py-3 flex gap-3 bg-gray-900 border-b-4 border-gray-700">
        <button onClick={() => setMode("avg")} className={`flex-1 py-4 rounded-xl text-xl font-black ${mode === "avg" ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-400"}`}>平均分配</button>
        <button onClick={() => setMode("total")} className={`flex-1 py-4 rounded-xl text-xl font-black ${mode === "total" ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-400"}`}>填总数</button>
      </div>

      {/* 批次列表（紧凑但字大） */}
      <div className="border-b-4 border-gray-200">
        <div className="flex items-center px-3 py-2.5 bg-gray-900">
          <div className="w-28 flex-shrink-0 text-base font-black text-gray-300">匹/颜色/码</div>
          <div className="w-14 flex-shrink-0 text-base font-black text-center text-gray-300">总数</div>
          <div className="flex-1 overflow-x-hidden" style={{ scrollbarWidth: "none" }}>
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p, pi) => (
                <div key={p} className="flex-shrink-0 w-20 text-center">
                  <span className="text-sm font-black text-yellow-400">{pi + 1}.</span>
                  <span className="text-sm font-bold text-gray-300 ml-0.5">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 border-b-2 border-gray-200 last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="w-28 flex-shrink-0 py-2.5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-red-600">{row.matchNo}</span>
                <span className="text-base font-bold text-gray-400">{row.bundleNo}</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-1.5 rounded">{row.color}</span>
                <span className="text-sm font-bold text-purple-600 bg-purple-50 px-1.5 rounded">{row.size}</span>
              </div>
            </div>
            <div className="w-14 flex-shrink-0 text-center text-2xl font-black text-gray-800">{row.total}</div>
            <div className="flex-1 overflow-x-auto py-2.5" style={{ scrollbarWidth: "none" }}>
              <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
                {row.statuses.map((s, j) => (
                  <div key={j} className={`flex-shrink-0 w-20 h-12 flex items-center justify-center rounded-lg text-base font-black ${statusBg(s, "bw")}`}>{s}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 工序选择 — 超大按钮横滑 */}
      <div className="bg-gray-100 border-b-4 border-gray-300 px-3 py-3">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {PROCESS_SECTIONS.map((s, i) => (
            <button key={i} onClick={() => { setPage(i); setWorkerPage(0); }}
              className="flex-shrink-0 flex flex-col items-center justify-center w-20 h-16 rounded-xl border-3 font-black transition-all"
              style={page === i
                ? { background: s.color, color: "white", border: `3px solid ${s.color}` }
                : { background: "white", color: s.color, border: `3px solid ${s.color}` }}
            >
              <span className="text-2xl font-black">{s.idx}</span>
              <span className="text-xs font-bold leading-tight text-center">{s.processName}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 工人选择 */}
      {sec.workers.length > 1 && (
        <div className="bg-white border-b-2 border-gray-200 px-3 py-2 flex gap-2">
          {sec.workers.map((w, wi) => (
            <button key={wi} onClick={() => setWorkerPage(wi)}
              className={`flex-1 py-3 rounded-xl text-lg font-black border-2 transition-all ${workerPage === wi ? "text-white border-transparent" : "bg-white border-gray-300 text-gray-600"}`}
              style={workerPage === wi ? { background: sec.color, borderColor: sec.color } : {}}
            >{w.name}</button>
          ))}
        </div>
      )}

      {/* 当前工人明细 — 超大显示 */}
      <div className="flex-1 overflow-y-auto pb-24 px-3 pt-3">
        <div className="flex items-center gap-3 mb-2 bg-white rounded-2xl border-2 px-4 py-3" style={{ borderColor: sec.color }}>
          <span className="text-2xl font-black" style={{ color: sec.color }}>{worker.name}</span>
          <span className="text-base text-gray-400 font-bold">{worker.bundles} 扎</span>
          <span className="text-3xl font-black text-red-600">{worker.pieces}</span>
          <span className="text-base text-gray-400 font-bold">件</span>
        </div>
        <MatchSummaryBar items={worker.items} color={sec.color} />
      </div>

      <div className="sticky bottom-0 border-t-4 border-gray-900 px-4 py-3 flex items-center gap-3 bg-white">
        <button className="flex-1 py-4 bg-black text-white text-2xl font-black rounded-2xl shadow-lg">保存</button>
        <div className="text-base text-gray-600 font-bold text-right leading-tight">
          已录中<br /><span className="text-red-600 font-black text-2xl">5</span>扎 <span className="text-red-600 font-black text-2xl">40</span>件
        </div>
      </div>
    </div>
  );
}

// ─── 主页面 ──────────────���──────��──────────────────────────────
type CutBedSize = "XS" | "S" | "M" | "L" | "XL" | "2XL" | "3XL";

type CutBedRow = {
  id: string;
  color: string;
  sizes: Record<CutBedSize, number>;
};

type CutBedWorker = {
  id: string;
  name: string;
  color: string;
};

type CutBedCell = {
  key: string;
  rowId: string;
  color: string;
  size: CutBedSize;
  quantity: number;
};

type CutBedAssignments = Record<string, string | undefined>;

type CutBedChange = {
  key: string;
  previousWorkerId: string | undefined;
  nextWorkerId: string | undefined;
};

const CUT_BED_SIZE_ORDER: CutBedSize[] = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const CUT_BED_TABLE_DATA: CutBedRow[] = [
  { id: "101", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "102", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "103", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "104", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "105", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "106", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "107", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "108", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "109", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "110", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "111", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "112", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "113", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "114", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "115", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "116", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "117", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
  { id: "118", color: "黄色", sizes: { XS: 25, S: 25, M: 25, L: 25, XL: 25, "2XL": 25, "3XL": 25 } },
  { id: "119", color: "蓝色", sizes: { XS: 12, S: 12, M: 12, L: 12, XL: 12, "2XL": 12, "3XL": 12 } },
  { id: "120", color: "黑色", sizes: { XS: 20, S: 20, M: 20, L: 20, XL: 20, "2XL": 20, "3XL": 20 } },
];

const CUT_BED_WORKERS: CutBedWorker[] = [
  { id: "w1", name: "张三", color: "#EF4444" },
  { id: "w2", name: "李四", color: "#10B981" },
  { id: "w3", name: "王五", color: "#3B82F6" },
  { id: "w4", name: "赵前", color: "#F59E0B" },
  { id: "w5", name: "钱风中", color: "#8B5CF6" },
  { id: "w6", name: "刘太已", color: "#06B6D4" },
];

const CUT_BED_PROCESS_OPTIONS = PROCESSES.map((name, index) => ({
  id: `proc-${index + 1}`,
  index: index + 1,
  name,
}));

const CUT_BED_ALL_CELLS: CutBedCell[] = CUT_BED_TABLE_DATA.flatMap((row) =>
  CUT_BED_SIZE_ORDER.map((size) => ({
    key: `${row.id}__${size}`,
    rowId: row.id,
    color: row.color,
    size,
    quantity: row.sizes[size],
  }))
);

const CUT_BED_TOTAL_QUANTITY = CUT_BED_ALL_CELLS.reduce((sum, cell) => sum + cell.quantity, 0);

function buildCutBedSummary(assignments: CutBedAssignments, workerId: string) {
  const selectedCells = CUT_BED_ALL_CELLS.filter((cell) => assignments[cell.key] === workerId);
  const consumed = new Set<string>();
  const lines: string[] = [];

  const colors = Array.from(new Set(CUT_BED_TABLE_DATA.map((row) => row.color)));
  colors.forEach((color) => {
    const colorCells = CUT_BED_ALL_CELLS.filter((cell) => cell.color === color);
    if (colorCells.length > 0 && colorCells.every((cell) => assignments[cell.key] === workerId)) {
      lines.push(`[整色:${color}:${colorCells.reduce((sum, cell) => sum + cell.quantity, 0)}]`);
      colorCells.forEach((cell) => consumed.add(cell.key));
    }
  });

  CUT_BED_TABLE_DATA.forEach((row) => {
    const rowCells = CUT_BED_ALL_CELLS.filter((cell) => cell.rowId === row.id && !consumed.has(cell.key));
    if (rowCells.length > 0 && rowCells.every((cell) => assignments[cell.key] === workerId)) {
      lines.push(`[整匹:${row.id}]`);
      rowCells.forEach((cell) => consumed.add(cell.key));
    }
  });

  CUT_BED_SIZE_ORDER.forEach((size) => {
    const sizeCells = CUT_BED_ALL_CELLS.filter((cell) => cell.size === size && !consumed.has(cell.key));
    if (sizeCells.length > 0 && sizeCells.every((cell) => assignments[cell.key] === workerId)) {
      lines.push(`[整码:${size}:${sizeCells.reduce((sum, cell) => sum + cell.quantity, 0)}]`);
      sizeCells.forEach((cell) => consumed.add(cell.key));
    }
  });

  selectedCells
    .filter((cell) => !consumed.has(cell.key))
    .sort((a, b) => Number(a.rowId) - Number(b.rowId) || CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size))
    .forEach((cell) => {
      lines.push(`[${cell.rowId}:扎尺:${cell.size}:${cell.quantity}]`);
    });

  return {
    lines,
    totalQuantity: selectedCells.reduce((sum, cell) => sum + cell.quantity, 0),
    cellCount: selectedCells.length,
  };
}

function getCutBedWorkerBreakdown(assignments: CutBedAssignments, workerId: string) {
  const selectedCells = CUT_BED_ALL_CELLS.filter((cell) => assignments[cell.key] === workerId);
  const rowMap = new Map<string, { rowId: string; color: string; entries: CutBedCell[]; total: number }>();

  selectedCells.forEach((cell) => {
    if (!rowMap.has(cell.rowId)) {
      rowMap.set(cell.rowId, { rowId: cell.rowId, color: cell.color, entries: [], total: 0 });
    }
    const rec = rowMap.get(cell.rowId)!;
    rec.entries.push(cell);
    rec.total += cell.quantity;
  });

  const rows = Array.from(rowMap.values())
    .map((row) => ({
      ...row,
      entries: row.entries.sort((a, b) => CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size)),
      complete: row.entries.length === CUT_BED_SIZE_ORDER.length,
    }))
    .sort((a, b) => Number(a.rowId) - Number(b.rowId));

  return {
    rows,
    totalQuantity: selectedCells.reduce((sum, cell) => sum + cell.quantity, 0),
    bundleCount: selectedCells.length,
    wholeMatches: rows.filter((row) => row.complete).map((row) => row.rowId),
    partialMatches: rows
      .filter((row) => !row.complete)
      .map((row) => ({
        rowId: row.rowId,
        sizes: row.entries.map((entry) => entry.size),
      })),
  };
}

function CutBedSummaryCard({
  worker,
  assignments,
  onUndo,
  canUndo,
}: {
  worker: CutBedWorker;
  assignments: CutBedAssignments;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const breakdown = getCutBedWorkerBreakdown(assignments, worker.id);
  return (
    <div data-cutbed-summary-v5 className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <style>{`
        [data-cutbed-summary-v5] > div:first-child > div > button {
          display: none !important;
        }
      `}</style>
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-gray-900">{worker.name}</span>
              <span className="text-sm text-gray-400">{breakdown.bundleCount} 扎</span>
              <span className="text-lg font-black text-red-500">{breakdown.totalQuantity}</span>
              <span className="text-sm text-gray-400">件</span>
            </div>
            {breakdown.wholeMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                  <span className="text-gray-400">整匹：</span>
                  <span className="text-sm font-semibold text-gray-600">{breakdown.wholeMatches.join("，")}</span>
                </span>
              </div>
            )}
            {breakdown.partialMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                {breakdown.partialMatches.map((row) => (
                  <span key={row.rowId} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                    <span className="text-sm font-semibold text-gray-600">{row.rowId}匹</span>
                    <span className="flex flex-wrap items-center gap-0.5">
                      {row.sizes.map((size, idx) => (
                        <span key={`${row.rowId}-${size}`} className="font-semibold text-sky-600">
                          {idx > 0 ? "," : ""}{size}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button hidden
            hidden
            onClick={onUndo}
            disabled={!canUndo}
            className={`shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
              !canUndo
                ? "bg-gray-100 text-gray-300"
                : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700"
            }`}
          >
            撤销
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        {breakdown.rows.length > 0 ? (
          <div className="space-y-2">
            {breakdown.rows.map((row) => (
              <div key={row.rowId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5">
                  <span className="text-2xl font-black text-red-500">{row.rowId}</span>
                  <span className="text-sm text-gray-500">匹</span>
                  <span className="text-sm font-semibold text-gray-600">{row.color}</span>
                  <span className="ml-auto text-sm text-gray-500">{row.total} 件</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
                  {row.entries.map((entry, index) => (
                    <div key={entry.key} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                        <span className="text-gray-700">{index + 1}</span>扎
                      </span>
                      <span className={`text-lg font-black leading-none ${row.complete ? "text-gray-800" : "text-sky-600"}`}>
                        {entry.size}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        <span className="text-gray-700">{entry.quantity}</span>件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-400">还没有分配数量</div>
        )}
      </div>
    </div>
  );
}

function ThemeEleven() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(CUT_BED_WORKERS[0].id);
  const [assignments, setAssignments] = useState<CutBedAssignments>({});
  const [history, setHistory] = useState<CutBedChange[][]>([]);

  const selectedWorker = CUT_BED_WORKERS.find((worker) => worker.id === selectedWorkerId) ?? CUT_BED_WORKERS[0];
  const applyChanges = (changes: CutBedChange[]) => {
    if (changes.length === 0) return;

    setAssignments((current) => {
      const next = { ...current };
      changes.forEach((change) => {
        if (change.nextWorkerId) {
          next[change.key] = change.nextWorkerId;
        } else {
          delete next[change.key];
        }
      });
      return next;
    });

    setHistory((current) => [...current, changes]);
  };

  const buildOtherProcessLoadTotals = () =>
    Object.fromEntries(
      workers.map((worker) => [
        worker.id,
        Object.entries(processAllocations).reduce((sum, [processId, processAllocation]) => {
          if (processId === selectedProcessId) return sum;
          return sum + getCutBedWorkerAssignedTotalV4(processAllocation, worker.id);
        }, 0),
      ])
    ) as Record<string, number>;

  const buildQuickAllocations = (mode: "balance" | "ai") => {
    const workerIds = workers.map((worker) => worker.id);

    if (mode === "balance") {
      switch (balanceRule) {
        case "cross-match-even":
          return buildGlobalBalancedAllocations(workerIds);
        case "size-rotation":
          return buildSizeRotationAllocations(workerIds);
        case "per-match-even":
        default:
          return buildMatchBalancedAllocations(workerIds);
      }
    }

    switch (aiRule) {
      case "color-focus":
        return buildColorFocusedAllocations(workerIds);
      case "size-focus":
        return buildSizeFocusedAllocations(workerIds);
      case "load-priority":
        return buildGlobalBalancedAllocations(workerIds, buildOtherProcessLoadTotals());
      case "skill-priority":
        return buildSkillPriorityAllocations(workerIds, selectedProcess.index);
      case "history-data":
      default:
        return buildHistoryDrivenAllocations(workerIds, selectedProcess.index);
    }
  };

  const handleQuickAllocate = (mode: "balance" | "ai") => {
    const activeRule = mode === "balance" ? balanceRuleMeta : aiRuleMeta;
    const nextAllocations = buildQuickAllocations(mode);

    if (quickAllocateTimerRef.current) {
      window.clearTimeout(quickAllocateTimerRef.current);
    }

    setIsQuickAllocateDrawerOpen(false);
    setIsProcessDrawerOpen(false);
    setEditingCellKey(null);
    setAllocatingTask({
      title: `${mode === "balance" ? "数量平分" : "AI平分"} · ${activeRule.label}`,
      description: `${selectedProcess.name}正在按“${activeRule.label}”规则生成分配结果，完成后将自动回写到当前工序。`,
    });

    quickAllocateTimerRef.current = window.setTimeout(() => {
      pushHistory();
      setCurrentAllocations(nextAllocations);
      setAllocatingTask(null);
      quickAllocateTimerRef.current = null;
    }, 1400);
  };

  const handleCellAssign = (cellKey: string) => {
    const previousWorkerId = assignments[cellKey];
    const nextWorkerId = previousWorkerId === selectedWorkerId ? undefined : selectedWorkerId;
    applyChanges([{ key: cellKey, previousWorkerId, nextWorkerId }]);
  };

  const handleRowAssign = (rowId: string) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.rowId === rowId && !assignments[cell.key])
      .map((cell) => ({
        key: cell.key,
        previousWorkerId: undefined,
        nextWorkerId: selectedWorkerId,
      }));

    applyChanges(changes);
  };

  const handleColumnAssign = (size: CutBedSize) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.size === size && !assignments[cell.key])
      .map((cell) => ({
        key: cell.key,
        previousWorkerId: undefined,
        nextWorkerId: selectedWorkerId,
      }));

    applyChanges(changes);
  };

  const handleUndo = () => {
    const last = history[history.length - 1];
    if (!last) return;

    setAssignments((current) => {
      const next = { ...current };
      last.forEach((change) => {
        if (change.previousWorkerId) {
          next[change.key] = change.previousWorkerId;
        } else {
          delete next[change.key];
        }
      });
      return next;
    });

    setHistory((current) => current.slice(0, -1));
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-stone-50">
      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="text-lg font-black text-slate-900">裁床数量分配</div>
        <div className="mt-1 text-xs font-medium text-slate-500">支持单点分配、整行批量分配与整码批量分配</div>
      </div>

      <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-3">
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {CUT_BED_WORKERS.map((worker) => {
            const isSelected = worker.id === selectedWorkerId;
            const ownedQuantity = CUT_BED_ALL_CELLS
              .filter((cell) => assignments[cell.key] === worker.id)
              .reduce((sum, cell) => sum + cell.quantity, 0);

            return (
              <button
                key={worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
                className={`relative overflow-hidden cursor-pointer active:scale-95 whitespace-nowrap rounded-2xl border px-4 py-2 text-left transition-all hover:bg-slate-50 ${
                  isSelected ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-700"
                }`}
                style={isSelected ? { background: worker.color } : undefined}
              >
                {!isSelected && (
                  <span
                    className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                    style={{ background: worker.color }}
                  />
                )}
                <div className="text-sm font-black">{worker.name}</div>
                <div className={`text-[11px] font-medium ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                  已分 {ownedQuantity}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-28 pt-0">
        <div className="overflow-auto border-y border-slate-200 bg-white shadow-sm">
          <table className="min-w-max border-separate border-spacing-0 text-center">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                  <div className="flex min-h-11 w-[64px] flex-col items-center justify-center text-xs font-bold text-white">
                    <span>匹号</span>
                    <span className="text-[10px] font-medium text-white/70">颜色</span>
                  </div>
                </th>
                {CUT_BED_SIZE_ORDER.map((size) => (
                  <th key={size} className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                    <button
                      onClick={() => handleColumnAssign(size)}
                      className="flex min-h-[30px] w-[52px] cursor-pointer items-center justify-center text-[11px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700"
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUT_BED_TABLE_DATA.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-0 py-0">
                    <button
                      onClick={() => handleRowAssign(row.id)}
                      className={`flex min-h-11 w-[64px] cursor-pointer items-center justify-center px-1 transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-black text-slate-900">{row.id}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-slate-400">{row.color}</span>
                      </span>
                    </button>
                  </td>
                  {CUT_BED_SIZE_ORDER.map((size) => {
                    const cellKey = `${row.id}__${size}`;
                    const ownerId = assignments[cellKey];
                    const owner = CUT_BED_WORKERS.find((worker) => worker.id === ownerId);
                    const isSelectedOwner = ownerId === selectedWorkerId;
                    const quantity = row.sizes[size];

                    return (
                      <td key={cellKey} className="border-b border-r border-slate-200 px-0 py-0">
                        <button
                          onClick={() => handleCellAssign(cellKey)}
                          className={`relative flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-sm transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                            owner
                              ? isSelectedOwner
                                ? "bg-slate-100 text-slate-500"
                                : "bg-slate-50 text-slate-400"
                              : "bg-white text-slate-700"
                          } ${isSelectedOwner ? "ring-1 ring-inset ring-slate-300" : ""}`}
                        >
                          {owner && (
                            <span
                              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                              style={{ background: owner.color }}
                            >
                              {owner.name.slice(-1)}
                            </span>
                          )}
                          <span className={owner ? "font-medium" : "font-semibold"}>{quantity}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sticky bottom-0 z-30 bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent px-3 pb-3 pt-2">
        <CutBedSummaryCard worker={selectedWorker} assignments={assignments} onUndo={handleUndo} canUndo={history.length > 0} />
      </div>
    </div>
  );
}

function CutBedSummaryCardV2({
  worker,
  assignments,
  onUndo,
  canUndo,
}: {
  worker: CutBedWorker;
  assignments: CutBedAssignments;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const breakdown = getCutBedWorkerBreakdown(assignments, worker.id);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-gray-900">{worker.name}</span>
              <span className="text-sm text-gray-400">{breakdown.bundleCount} 扎</span>
              <span className="text-lg font-black text-red-500">{breakdown.totalQuantity}</span>
              <span className="text-sm text-gray-400">件</span>
              {breakdown.wholeMatches.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                  <span className="text-gray-400">整匹：</span>
                  <span className="text-sm font-semibold text-gray-600">{breakdown.wholeMatches.join("，")}</span>
                </span>
              )}
            </div>
            {breakdown.partialMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                {breakdown.partialMatches.map((row) => (
                  <span key={row.rowId} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                    <span className="text-sm font-semibold text-gray-600">{row.rowId}匹：</span>
                    <span className="flex flex-wrap items-center gap-0.5">
                      {row.sizes.map((size, idx) => (
                        <span key={`${row.rowId}-${size}`} className="font-semibold text-sky-600">
                          {idx > 0 ? "," : ""}{size}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button hidden
            onClick={onUndo}
            disabled={!canUndo}
            className={`shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
              !canUndo
                ? "bg-gray-100 text-gray-300"
                : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700"
            }`}
          >
            撤销
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 py-2.5">
        {breakdown.rows.length > 0 ? (
          <div className="space-y-2">
            {breakdown.rows.map((row) => (
              <div key={row.rowId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5">
                  <span className="text-2xl font-black text-red-500">{row.rowId}</span>
                  <span className="text-sm text-gray-500">匹</span>
                  <span className="text-sm font-semibold text-gray-600">{row.color}</span>
                  <span className="ml-auto text-sm text-gray-500">{row.total} 件</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
                  {row.entries.map((entry, index) => (
                    <div key={entry.key} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                        <span className="text-gray-700">{index + 1}</span>扎
                      </span>
                      <span className={`text-lg font-black leading-none ${row.complete ? "text-gray-800" : "text-sky-600"}`}>
                        {entry.size}
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        <span className="text-gray-700">{entry.quantity}</span>件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-400">还没有分配数量</div>
        )}
      </div>
    </div>
  );
}

function ThemeElevenV2() {
  const workers: CutBedWorker[] = [
    { id: "w1", name: "张三", color: "#EF4444" },
    { id: "w2", name: "李四", color: "#10B981" },
    { id: "w3", name: "王五", color: "#3B82F6" },
    { id: "w4", name: "赵前", color: "#F59E0B" },
    { id: "w5", name: "钱风中", color: "#8B5CF6" },
    { id: "w6", name: "刘太已", color: "#06B6D4" },
  ];
  const processOptions = PROCESSES.map((name, index) => ({
    id: `cut-bed-proc-${index + 1}`,
    index: index + 1,
    name,
  }));

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [selectedProcessId, setSelectedProcessId] = useState(processOptions[0].id);
  const [isProcessDrawerOpen, setIsProcessDrawerOpen] = useState(false);
  const [assignments, setAssignments] = useState<CutBedAssignments>({});
  const [history, setHistory] = useState<CutBedChange[][]>([]);

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const processAssignedTotal = Object.values(allocations).reduce((sum, workerMap) => sum + Object.values(workerMap).reduce((inner, qty) => inner + qty, 0), 0);
  const processPct = CUT_BED_TOTAL_QUANTITY === 0 ? 0 : Math.round((processAssignedTotal / CUT_BED_TOTAL_QUANTITY) * 100);

  const applyChanges = (changes: CutBedChange[]) => {
    if (changes.length === 0) return;

    setAssignments((current) => {
      const next = { ...current };
      changes.forEach((change) => {
        if (change.nextWorkerId) {
          next[change.key] = change.nextWorkerId;
        } else {
          delete next[change.key];
        }
      });
      return next;
    });

    setHistory((current) => [...current, changes]);
  };

  const handleCellAssign = (cellKey: string) => {
    const previousWorkerId = assignments[cellKey];
    const nextWorkerId = previousWorkerId === selectedWorkerId ? undefined : selectedWorkerId;
    applyChanges([{ key: cellKey, previousWorkerId, nextWorkerId }]);
  };

  const handleRowAssign = (rowId: string) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.rowId === rowId && !assignments[cell.key])
      .map((cell) => ({
        key: cell.key,
        previousWorkerId: undefined,
        nextWorkerId: selectedWorkerId,
      }));

    applyChanges(changes);
  };

  const handleColumnAssign = (size: CutBedSize) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.size === size && !assignments[cell.key])
      .map((cell) => ({
        key: cell.key,
        previousWorkerId: undefined,
        nextWorkerId: selectedWorkerId,
      }));

    applyChanges(changes);
  };

  const handleUndo = () => {
    const last = history[history.length - 1];
    if (!last) return;

    setAssignments((current) => {
      const next = { ...current };
      last.forEach((change) => {
        if (change.previousWorkerId) {
          next[change.key] = change.previousWorkerId;
        } else {
          delete next[change.key];
        }
      });
      return next;
    });

    setHistory((current) => current.slice(0, -1));
  };

  return (
    <div data-theme-eleven-v5 className="relative flex h-full flex-col overflow-hidden bg-stone-50">
      <style>{`
        [data-theme-eleven-v5] thead {
          position: sticky;
          top: 0;
          z-index: 30;
        }

        [data-theme-eleven-v5] thead th {
          position: sticky;
          top: 0;
          z-index: 30;
        }

        [data-theme-eleven-v5] thead th > div {
          min-height: 30px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        [data-theme-eleven-v5] thead th > div > span:last-child {
          display: none;
        }

        [data-theme-eleven-v5] thead th button {
          min-height: 30px;
          font-size: 11px;
        }
      `}</style>
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex w-max gap-2 pr-2">
              {processOptions.map((process) => {
                const isActive = process.id === selectedProcessId;
                return (
                  <button
                    key={process.id}
                    onClick={() => setSelectedProcessId(process.id)}
                    className={`cursor-pointer active:scale-95 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] font-black opacity-70">{process.index}.</span>
                    <span>{process.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button hidden
            onClick={() => setIsProcessDrawerOpen(true)}
            className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="7" y1="12" x2="20" y2="12" />
              <line x1="10" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {workers.map((worker) => {
              const isSelected = worker.id === selectedWorkerId;
              const ownedQuantity = CUT_BED_ALL_CELLS
                .filter((cell) => assignments[cell.key] === worker.id)
                .reduce((sum, cell) => sum + cell.quantity, 0);

              return (
                <button
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`relative overflow-hidden cursor-pointer active:scale-95 whitespace-nowrap rounded-2xl border px-4 py-2 text-left transition-all hover:bg-slate-50 ${
                    isSelected ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={isSelected ? { background: worker.color } : undefined}
                >
                  {!isSelected && (
                    <span
                      className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                      style={{ background: worker.color }}
                    />
                  )}
                  <div className="text-sm font-black">{worker.name}</div>
                  <div className={`text-[11px] font-medium ${isSelected ? "text-white/80" : "text-slate-400"}`}>
                    已分 {ownedQuantity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {false && (
        <div className="shrink-0 border-b border-slate-200 bg-white/95 px-3 py-1.5 backdrop-blur">
          <div ref={compactHeaderScrollRef} className="overflow-x-hidden">
            <div className="flex min-w-max items-center rounded-2xl bg-slate-900 px-2 py-1 text-[10px] font-black text-white shadow-sm">
              <span className="flex w-[48px] shrink-0 items-center justify-center text-white/65">尺码</span>
              {CUT_BED_SIZE_ORDER.map((size) => (
                <span
                  key={`compact-${size}`}
                  className="inline-flex h-6 w-[52px] shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white/90"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={contentScrollRef} onScroll={handleContentScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto border-y border-slate-200 bg-white shadow-sm [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-30 [&_thead_th>div]:min-h-[30px] [&_thead_th>div]:flex-row [&_thead_th>div]:items-center [&_thead_th>div]:justify-center [&_thead_th>div]:text-[11px] [&_thead_th>div>span:last-child]:hidden [&_thead_th_button]:min-h-[30px] [&_thead_th_button]:text-[11px]"
        >
          <table className="min-w-max border-separate border-spacing-0 text-center">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                  <div className="flex min-h-11 w-[64px] flex-col items-center justify-center text-xs font-bold text-white">
                    <span>匹号</span>
                    <span className="text-[10px] font-medium text-white/70">颜色</span>
                  </div>
                </th>
                {CUT_BED_SIZE_ORDER.map((size) => (
                  <th key={size} className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                    <button
                      onClick={() => handleColumnAssign(size)}
                      className="flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700"
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUT_BED_TABLE_DATA.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-0 py-0">
                    <button
                      onClick={() => handleRowAssign(row.id)}
                      className={`flex min-h-11 w-[64px] cursor-pointer items-center justify-center px-1 transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-black text-slate-900">{row.id}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-slate-400">{row.color}</span>
                      </span>
                    </button>
                  </td>
                  {CUT_BED_SIZE_ORDER.map((size) => {
                    const cellKey = `${row.id}__${size}`;
                    const ownerId = assignments[cellKey];
                    const owner = workers.find((worker) => worker.id === ownerId);
                    const isSelectedOwner = ownerId === selectedWorkerId;
                    const quantity = row.sizes[size];

                    return (
                      <td key={cellKey} className="border-b border-r border-slate-200 px-0 py-0">
                        <button
                          onClick={() => handleCellAssign(cellKey)}
                          className={`relative flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-sm transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                            owner
                              ? isSelectedOwner
                                ? "bg-slate-100 text-slate-500"
                                : "bg-slate-50 text-slate-400"
                              : "bg-white text-slate-700"
                          } ${isSelectedOwner ? "ring-1 ring-inset ring-slate-300" : ""}`}
                        >
                          {owner && (
                            <span
                              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                              style={{ background: owner.color }}
                            >
                              {owner.name.slice(0, 1)}
                            </span>
                          )}
                          <span className={owner ? "font-medium" : "font-semibold"}>{quantity}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-3">
          <CutBedSummaryCardV2 worker={selectedWorker} assignments={assignments} onUndo={handleUndo} canUndo={history.length > 0} />
        </div>
      </div>

      {isProcessDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/35">
          <button
            onClick={() => setIsProcessDrawerOpen(false)}
            className="flex-1 cursor-default"
            aria-hidden="true"
          />
          <div className="flex h-full w-[280px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="text-base font-black text-slate-900">选择工序</div>
              <button
                onClick={() => setIsProcessDrawerOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-2">
                {processOptions.map((process) => {
                  const isActive = process.id === selectedProcessId;
                  return (
                    <button
                      key={process.id}
                      onClick={() => {
                        setSelectedProcessId(process.id);
                        setIsProcessDrawerOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:bg-slate-50 active:scale-[0.99] ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {process.index}
                      </span>
                      <span className="text-sm font-bold">{process.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CutBedAllocations = Record<string, Record<string, number>>;

function cloneCutBedAllocations(allocations: CutBedAllocations) {
  return Object.fromEntries(
    Object.entries(allocations).map(([cellKey, workerMap]) => [cellKey, { ...workerMap }])
  );
}

function getCellWorkerMap(allocations: CutBedAllocations, cellKey: string) {
  return allocations[cellKey] ?? {};
}

function getCellAssignedTotal(allocations: CutBedAllocations, cellKey: string) {
  return Object.values(getCellWorkerMap(allocations, cellKey)).reduce((sum, qty) => sum + qty, 0);
}

function getCellSplitCount(allocations: CutBedAllocations, cellKey: string) {
  return Object.values(getCellWorkerMap(allocations, cellKey)).filter((qty) => qty > 0).length;
}

function getWorkerOwnedQuantity(allocations: CutBedAllocations, workerId: string) {
  return CUT_BED_ALL_CELLS.reduce((sum, cell) => sum + (allocations[cell.key]?.[workerId] ?? 0), 0);
}

function getCutBedWorkerBreakdownV3(allocations: CutBedAllocations, workerId: string) {
  const workerCells = CUT_BED_ALL_CELLS
    .map((cell) => {
      const quantity = allocations[cell.key]?.[workerId] ?? 0;
      return {
        ...cell,
        assignedQuantity: quantity,
        isSplit: getCellSplitCount(allocations, cell.key) > 1,
      };
    })
    .filter((cell) => cell.assignedQuantity > 0);

  const rowMap = new Map<string, { rowId: string; color: string; entries: typeof workerCells; total: number }>();

  workerCells.forEach((cell) => {
    if (!rowMap.has(cell.rowId)) {
      rowMap.set(cell.rowId, { rowId: cell.rowId, color: cell.color, entries: [], total: 0 });
    }
    const rec = rowMap.get(cell.rowId)!;
    rec.entries.push(cell);
    rec.total += cell.assignedQuantity;
  });

  const rows = Array.from(rowMap.values())
    .map((row) => ({
      ...row,
      entries: row.entries.sort((a, b) => CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size)),
      complete: CUT_BED_SIZE_ORDER.every((size) => {
        const entry = row.entries.find((item) => item.size === size);
        const baseCell = CUT_BED_ALL_CELLS.find((item) => item.rowId === row.rowId && item.size === size);
        return Boolean(entry && baseCell && entry.assignedQuantity === baseCell.quantity);
      }),
    }))
    .sort((a, b) => Number(a.rowId) - Number(b.rowId));

  return {
    rows,
    totalQuantity: workerCells.reduce((sum, cell) => sum + cell.assignedQuantity, 0),
    bundleCount: workerCells.length,
    wholeMatches: rows.filter((row) => row.complete).map((row) => row.rowId),
    partialMatches: rows
      .filter((row) => !row.complete)
      .map((row) => ({
        rowId: row.rowId,
        sizes: row.entries.map((entry) => ({
          size: entry.size,
          isSplit: entry.isSplit,
        })),
      })),
  };
}

function CutBedSummaryCardV3({
  worker,
  allocations,
  onUndo,
  canUndo,
}: {
  worker: CutBedWorker;
  allocations: CutBedAllocations;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const breakdown = getCutBedWorkerBreakdownV3(allocations, worker.id);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-gray-900">{worker.name}</span>
              <span className="text-sm text-gray-400">{breakdown.bundleCount} 扎</span>
              <span className="text-lg font-black text-red-500">{breakdown.totalQuantity}</span>
              <span className="text-sm text-gray-400">件</span>
              {breakdown.wholeMatches.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                  <span className="text-gray-400">整匹：</span>
                  <span className="text-sm font-semibold text-gray-600">{breakdown.wholeMatches.join("，")}</span>
                </span>
              )}
            </div>
            {breakdown.partialMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                {breakdown.partialMatches.map((row) => (
                  <span key={row.rowId} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                    <span className="text-sm font-semibold text-gray-600">{row.rowId}匹：</span>
                    <span className="flex flex-wrap items-center gap-0.5">
                      {row.sizes.map((size, idx) => (
                        <span key={`${row.rowId}-${size.size}`} className={size.isSplit ? "font-semibold text-orange-500" : "text-gray-500"}>
                          {idx > 0 ? "," : ""}{size.size}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
              !canUndo
                ? "bg-gray-100 text-gray-300"
                : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700"
            }`}
          >
            撤销
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 py-2.5">
        {breakdown.rows.length > 0 ? (
          <div className="space-y-2">
            {breakdown.rows.map((row) => (
              <div key={row.rowId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5">
                  <span className="text-2xl font-black text-red-500">{row.rowId}</span>
                  <span className="text-sm text-gray-500">匹</span>
                  <span className="text-sm font-semibold text-gray-600">{row.color}</span>
                  <span className="ml-auto text-sm text-gray-500">{row.total} 件</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
                  {row.entries.map((entry) => {
                    const zhaNo = CUT_BED_SIZE_ORDER.indexOf(entry.size) + 1;
                    return (
                      <div key={entry.key} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                          <span className="text-gray-700">{zhaNo}</span>扎
                        </span>
                        <span className={`text-lg font-black leading-none ${entry.isSplit ? "text-orange-500" : "text-gray-800"}`}>
                          {entry.size}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          <span className="text-gray-700">{entry.assignedQuantity}</span>件
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-400">还没有分配数量</div>
        )}
      </div>
    </div>
  );
}

function ThemeElevenV3() {
  const workers: CutBedWorker[] = [
    { id: "w1", name: "张三", color: "#EF4444" },
    { id: "w2", name: "李四", color: "#10B981" },
    { id: "w3", name: "王五", color: "#3B82F6" },
    { id: "w4", name: "赵前", color: "#F59E0B" },
    { id: "w5", name: "钱风中", color: "#8B5CF6" },
    { id: "w6", name: "刘太已", color: "#06B6D4" },
  ];
  const processOptions = PROCESSES.map((name, index) => ({
    id: `cut-bed-proc-v3-${index + 1}`,
    index: index + 1,
    name,
  }));

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [selectedProcessId, setSelectedProcessId] = useState(processOptions[0].id);
  const [isProcessDrawerOpen, setIsProcessDrawerOpen] = useState(false);
  const [allocations, setAllocations] = useState<CutBedAllocations>({});
  const [history, setHistory] = useState<CutBedAllocations[]>([]);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [draftAllocation, setDraftAllocation] = useState<Record<string, string>>({});
  const processTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<string | null>(null);

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const editingCell = editingCellKey ? CUT_BED_ALL_CELLS.find((cell) => cell.key === editingCellKey) ?? null : null;
  const editingAssignedTotal = Object.values(draftAllocation).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  const editingRemaining = editingCell ? editingCell.quantity - editingAssignedTotal : 0;

  useEffect(() => {
    const index = processOptions.findIndex((process) => process.id === selectedProcessId);
    if (index >= 0) {
      processTabRefs.current[index]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedProcessId]);

  const pushHistory = () => {
    setHistory((current) => [...current, cloneCutBedAllocations(allocations)]);
  };

  const applyCellAllocation = (cellKey: string, workerMap: Record<string, number>) => {
    pushHistory();
    setAllocations((current) => {
      const next = cloneCutBedAllocations(current);
      const cleaned = Object.fromEntries(Object.entries(workerMap).filter(([, qty]) => qty > 0));
      if (Object.keys(cleaned).length === 0) {
        delete next[cellKey];
      } else {
        next[cellKey] = cleaned;
      }
      return next;
    });
  };

  const handleCellAssign = (cellKey: string) => {
    if (longPressTriggeredRef.current === cellKey) {
      longPressTriggeredRef.current = null;
      return;
    }
    const cell = CUT_BED_ALL_CELLS.find((item) => item.key === cellKey);
    if (!cell) return;

    const currentMap = getCellWorkerMap(allocations, cellKey);
    const selectedQty = currentMap[selectedWorkerId] ?? 0;
    const isOnlySelectedOwner =
      Object.keys(currentMap).length === 1 && selectedQty === cell.quantity;

    if (isOnlySelectedOwner) {
      applyCellAllocation(cellKey, {});
      return;
    }

    applyCellAllocation(cellKey, { [selectedWorkerId]: cell.quantity });
  };

  const handleRowAssign = (rowId: string) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.rowId === rowId && getCellAssignedTotal(allocations, cell.key) === 0)
      .map((cell) => ({ cellKey: cell.key, next: { [selectedWorkerId]: cell.quantity } }));

    if (changes.length === 0) return;
    pushHistory();
    setAllocations((current) => {
      const next = cloneCutBedAllocations(current);
      changes.forEach((change) => {
        next[change.cellKey] = change.next;
      });
      return next;
    });
  };

  const handleColumnAssign = (size: CutBedSize) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.size === size && getCellAssignedTotal(allocations, cell.key) === 0)
      .map((cell) => ({ cellKey: cell.key, next: { [selectedWorkerId]: cell.quantity } }));

    if (changes.length === 0) return;
    pushHistory();
    setAllocations((current) => {
      const next = cloneCutBedAllocations(current);
      changes.forEach((change) => {
        next[change.cellKey] = change.next;
      });
      return next;
    });
  };

  const handleUndo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setAllocations(previous);
    setHistory((current) => current.slice(0, -1));
  };

  const handleLongPressStart = (cellKey: string) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      const currentMap = getCellWorkerMap(allocations, cellKey);
      const nextDraft = Object.fromEntries(workers.map((worker) => [worker.id, String(currentMap[worker.id] ?? 0)]));
      setDraftAllocation(nextDraft);
      setEditingCellKey(cellKey);
      longPressTriggeredRef.current = cellKey;
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-stone-50">
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex w-max gap-2 pr-2">
              {processOptions.map((process, index) => {
                const isActive = process.id === selectedProcessId;
                return (
                  <button
                    key={process.id}
                    ref={(el) => { processTabRefs.current[index] = el; }}
                    onClick={() => setSelectedProcessId(process.id)}
                    className={`cursor-pointer active:scale-95 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] font-black opacity-70">{process.index}.</span>
                    <span>{process.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setIsProcessDrawerOpen(true)}
            className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="7" y1="12" x2="20" y2="12" />
              <line x1="10" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {workers.map((worker) => {
              const isSelected = worker.id === selectedWorkerId;
              const ownedQuantity = getWorkerOwnedQuantity(allocations, worker.id);

              return (
                <button
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`relative overflow-hidden cursor-pointer active:scale-95 whitespace-nowrap rounded-2xl border px-4 py-2 text-center transition-all hover:bg-slate-50 ${
                    isSelected ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={isSelected ? { background: worker.color } : undefined}
                >
                  {!isSelected && (
                    <span
                      className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
                      style={{ background: worker.color }}
                    />
                  )}
                  <div className="text-sm font-black">{worker.name}</div>
                  <div className={ownedQuantity > 0 ? "text-[12px] font-black text-[#FF6600]" : "text-[12px] font-medium text-gray-400"}>
                    {ownedQuantity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {false && (
        <div className="shrink-0 border-b border-slate-200 bg-white/95 px-3 py-1.5 backdrop-blur">
          <div ref={compactHeaderScrollRef} className="overflow-x-hidden">
            <div className="flex min-w-max items-center rounded-2xl bg-slate-900 px-2 py-1 text-[10px] font-black text-white shadow-sm">
              <span className="flex w-[48px] shrink-0 items-center justify-center text-white/65">尺码</span>
              {CUT_BED_SIZE_ORDER.map((size) => (
                <span
                  key={`compact-${size}`}
                  className="inline-flex h-6 w-[52px] shrink-0 items-center justify-center rounded-xl text-[11px] font-black text-white/90"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={contentScrollRef} onScroll={handleContentScroll} className="min-h-0 flex-1 overflow-y-auto">
        <div
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="overflow-x-auto border-y border-slate-200 bg-white shadow-sm [&_thead]:sticky [&_thead]:top-0 [&_thead]:z-30 [&_thead_th>div]:min-h-[30px] [&_thead_th>div]:flex-row [&_thead_th>div]:items-center [&_thead_th>div]:justify-center [&_thead_th>div]:text-[11px] [&_thead_th>div>span:last-child]:hidden [&_thead_th_button]:min-h-[30px] [&_thead_th_button]:text-[11px]"
        >
          <table className="min-w-max border-separate border-spacing-0 text-center">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                  <div className="flex min-h-[30px] w-[48px] items-center justify-center text-[11px] font-bold text-white">
                    <span>匹号</span>
                    <span className="text-[10px] font-medium text-white/70">颜色</span>
                  </div>
                </th>
                {CUT_BED_SIZE_ORDER.map((size) => (
                  <th key={size} className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                    <button
                      onClick={() => handleColumnAssign(size)}
                      className="flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700"
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUT_BED_TABLE_DATA.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-0 py-0">
                    <button
                      onClick={() => handleRowAssign(row.id)}
                      className={`flex min-h-11 w-[48px] cursor-pointer items-center justify-center px-1 transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-black text-slate-900">{row.id}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-slate-400">{row.color}</span>
                      </span>
                    </button>
                  </td>
                  {CUT_BED_SIZE_ORDER.map((size) => {
                    const cellKey = `${row.id}__${size}`;
                    const workerMap = getCellWorkerMap(allocations, cellKey);
                    const ownerIds = Object.keys(workerMap).filter((workerId) => workerMap[workerId] > 0);
                    const owner = ownerIds.length === 1 ? workers.find((worker) => worker.id === ownerIds[0]) : undefined;
                    const isSelectedOwner = ownerIds.length === 1 && ownerIds[0] === selectedWorkerId;
                    const quantity = row.sizes[size];
                    const isSplit = ownerIds.length > 1;

                    return (
                      <td key={cellKey} className="border-b border-r border-slate-200 px-0 py-0">
                        <button
                          onClick={() => handleCellAssign(cellKey)}
                          onPointerDown={() => handleLongPressStart(cellKey)}
                          onPointerUp={clearLongPress}
                          onPointerLeave={clearLongPress}
                          onPointerCancel={clearLongPress}
                          className={`relative flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-sm transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                            isSplit
                              ? "bg-orange-50 text-orange-600"
                              : owner
                                ? isSelectedOwner
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-slate-50 text-slate-400"
                                : "bg-white text-slate-700"
                          } ${isSelectedOwner ? "ring-1 ring-inset ring-slate-300" : ""}`}
                        >
                          {ownerIds.length > 0 && (
                            <span
                              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                              style={{ background: (owner ?? workers.find((worker) => worker.id === ownerIds[0]))?.color }}
                            >
                              {(owner ?? workers.find((worker) => worker.id === ownerIds[0]))?.name.slice(0, 1)}
                            </span>
                          )}
                          <span className={ownerIds.length > 0 ? "font-medium" : "font-semibold"}>{quantity}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-3">
          <CutBedSummaryCardV3 worker={selectedWorker} allocations={allocations} onUndo={handleUndo} canUndo={history.length > 0} />
        </div>
      </div>

      {isQuickAllocateDrawerOpen && (
        <div className="absolute inset-0 z-[65] flex items-end bg-black/35">
          <button
            onClick={() => setIsQuickAllocateDrawerOpen(false)}
            className="absolute inset-0 cursor-default"
            aria-hidden="true"
          />
          <div className="relative flex max-h-[78%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-black text-slate-900">快速分配</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {selectedProcess.index}. {selectedProcess.name} · 已分配 {processAssignedTotal} / {CUT_BED_TOTAL_QUANTITY}
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickAllocateDrawerOpen(false)}
                  className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="text-sm font-black text-slate-900">数量平分</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">适合首轮分货或需要快速拉平当前工序数量时使用。</div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={balanceRule}
                    onChange={(e) => setBalanceRule(e.target.value as QuickBalanceRule)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400"
                  >
                    {QUICK_BALANCE_RULE_OPTIONS.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleQuickAllocate("balance")}
                    className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 active:bg-emerald-700"
                  >
                    数量平分
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">{balanceRuleMeta.description}</div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                <div className="text-sm font-black text-slate-900">AI平分</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">适合结合工序特征、颜色尺码和工人负荷做更贴近现场的自动分配。</div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={aiRule}
                    onChange={(e) => setAiRule(e.target.value as QuickAiRule)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-sky-400"
                  >
                    {QUICK_AI_RULE_OPTIONS.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleQuickAllocate("ai")}
                    className="shrink-0 cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 active:bg-slate-700"
                  >
                    AI平分
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">{aiRuleMeta.description}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-black text-slate-900">服装工序常用策略</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["按颜色集中", "按尺码集中", "按工人负荷优先", "按熟练度优先"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">
                  上述方法已包含在 AI 下拉规则中，点击后会直接回写到当前工序分配页，可继续手动微调。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {allocatingTask && (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-slate-950/72 px-6 text-center text-white backdrop-blur-sm">
          <div className="relative h-16 w-16">
            <span className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <span className="absolute inset-3 rounded-full bg-white/10" />
          </div>
          <div>
            <div className="text-lg font-black">{allocatingTask.title}</div>
            <div className="mt-2 text-sm font-medium text-white/80">{allocatingTask.description}</div>
          </div>
          <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-[11px] font-medium text-white/70">
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">分析规则</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">计算数量</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">回写结果</span>
          </div>
        </div>
      )}

      {editingCell && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-3">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="text-base font-black text-slate-900">修改分配数量</div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                {editingCell.rowId} / {editingCell.color} / {editingCell.size} / 总数 {editingCell.quantity}
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              {workers.map((worker) => (
                <label key={worker.id} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-bold text-slate-700">{worker.name}</span>
                  <input
                    type="number"
                    min={0}
                    className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                    value={draftAllocation[worker.id] ?? "0"}
                    onChange={(e) => setDraftAllocation((current) => ({ ...current, [worker.id]: e.target.value }))}
                  />
                </label>
              ))}
              <div className={`text-xs font-medium ${editingRemaining < 0 ? "text-red-500" : "text-slate-500"}`}>
                剩余可分配：{editingRemaining}
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-4">
              <button
                onClick={() => setEditingCellKey(null)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!editingCell || editingRemaining < 0) return;
                  const nextMap = Object.fromEntries(
                    workers
                      .map((worker) => [worker.id, Math.max(0, Math.min(editingCell.quantity, Number(draftAllocation[worker.id] ?? 0) || 0))] as const)
                      .filter(([, qty]) => qty > 0)
                  );
                  pushHistory();
                  setAllocations((current) => {
                    const next = cloneCutBedAllocations(current);
                    if (Object.keys(nextMap).length === 0) {
                      delete next[editingCell.key];
                    } else {
                      next[editingCell.key] = nextMap;
                    }
                    return next;
                  });
                  setEditingCellKey(null);
                }}
                disabled={editingRemaining < 0}
                className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${
                  editingRemaining < 0 ? "bg-slate-300" : "bg-slate-900 hover:bg-slate-800 active:bg-slate-700"
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/35">
          <button
            onClick={() => setIsProcessDrawerOpen(false)}
            className="flex-1 cursor-default"
            aria-hidden="true"
          />
          <div className="flex h-full w-[280px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="text-base font-black text-slate-900">选择工序</div>
              <button
                onClick={() => setIsProcessDrawerOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-2">
                {processOptions.map((process) => {
                  const isActive = process.id === selectedProcessId;
                  return (
                    <button
                      key={process.id}
                      onClick={() => {
                        setSelectedProcessId(process.id);
                        setIsProcessDrawerOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:bg-slate-50 active:scale-[0.99] ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {process.index}
                      </span>
                      <span className="text-sm font-bold">{process.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type CutBedAllocationsV4 = Record<string, Record<string, number>>;

function cloneCutBedAllocationsV4(allocations: CutBedAllocationsV4) {
  return Object.fromEntries(Object.entries(allocations).map(([key, value]) => [key, { ...value }]));
}

function getCutBedCellOwnersV4(allocations: CutBedAllocationsV4, cellKey: string) {
  return Object.entries(allocations[cellKey] ?? {})
    .filter(([, qty]) => qty > 0)
    .map(([workerId]) => workerId);
}

function getCutBedCellOwnerQtyV4(allocations: CutBedAllocationsV4, cellKey: string, workerId: string) {
  return allocations[cellKey]?.[workerId] ?? 0;
}

function getCutBedWorkerAssignedTotalV4(allocations: CutBedAllocationsV4, workerId: string) {
  return Object.values(allocations).reduce((sum, workerMap) => sum + (workerMap[workerId] ?? 0), 0);
}

function getCutBedBreakdownV4(allocations: CutBedAllocationsV4, workerId: string) {
  const selectedEntries = CUT_BED_ALL_CELLS
    .map((cell) => ({
      ...cell,
      assignedQuantity: getCutBedCellOwnerQtyV4(allocations, cell.key, workerId),
      isSplit: getCutBedCellOwnersV4(allocations, cell.key).length > 1,
    }))
    .filter((cell) => cell.assignedQuantity > 0);

  const rowMap = new Map<string, { rowId: string; color: string; entries: typeof selectedEntries; total: number }>();
  selectedEntries.forEach((entry) => {
    if (!rowMap.has(entry.rowId)) {
      rowMap.set(entry.rowId, { rowId: entry.rowId, color: entry.color, entries: [], total: 0 });
    }
    const rec = rowMap.get(entry.rowId)!;
    rec.entries.push(entry);
    rec.total += entry.assignedQuantity;
  });

  const rows = Array.from(rowMap.values())
    .map((row) => ({
      ...row,
      entries: row.entries.sort((a, b) => CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size)),
      complete: CUT_BED_SIZE_ORDER.every((size) => {
        const baseCell = CUT_BED_ALL_CELLS.find((cell) => cell.rowId === row.rowId && cell.size === size);
        const assigned = row.entries.find((entry) => entry.size === size);
        return Boolean(baseCell && assigned && assigned.assignedQuantity === baseCell.quantity);
      }),
    }))
    .sort((a, b) => Number(a.rowId) - Number(b.rowId));

  return {
    rows,
    totalQuantity: selectedEntries.reduce((sum, entry) => sum + entry.assignedQuantity, 0),
    bundleCount: selectedEntries.length,
    wholeMatches: rows.filter((row) => row.complete).map((row) => row.rowId),
    partialMatches: rows
      .filter((row) => !row.complete)
      .map((row) => ({
        rowId: row.rowId,
        sizes: row.entries.map((entry) => ({ size: entry.size, isSplit: entry.isSplit })),
      })),
  };
}

function SplitOwnerDotV4({ colors }: { colors: string[] }) {
  if (colors.length === 0) return null;
  if (colors.length === 1) {
    return <span className="absolute right-1 top-1 h-4 w-4 rounded-full" style={{ background: colors[0] }} />;
  }

  const size = 16;
  const r = size / 2;
  const cx = r;
  const cy = r;
  const slices = colors.map((color, index) => {
    const start = (index / colors.length) * Math.PI * 2 - Math.PI / 2;
    const end = ((index + 1) / colors.length) * Math.PI * 2 - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const largeArc = end - start > Math.PI ? 1 : 0;
    return { color, d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z` };
  });

  return (
    <span className="absolute right-1 top-1 h-4 w-4 overflow-hidden rounded-full border border-white/80">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, index) => (
          <path key={index} d={slice.d} fill={slice.color} />
        ))}
      </svg>
    </span>
  );
}

function CutBedSummaryCardV4({
  worker,
  allocations,
  onUndo,
  canUndo,
}: {
  worker: CutBedWorker;
  allocations: CutBedAllocationsV4;
  onUndo: () => void;
  canUndo: boolean;
}) {
  const breakdown = getCutBedBreakdownV4(allocations, worker.id);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-gray-900">{worker.name}</span>
              <span className="text-sm text-gray-400">{breakdown.bundleCount} 扎</span>
              <span className="text-lg font-black text-red-500">{breakdown.totalQuantity}</span>
              <span className="text-sm text-gray-400">件</span>
            </div>
            {breakdown.wholeMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                  <span className="text-gray-400">整匹：</span>
                  <span className="text-sm font-semibold text-gray-600">{breakdown.wholeMatches.join("，")}</span>
                </span>
              </div>
            )}
            {breakdown.partialMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                {breakdown.partialMatches.map((row) => (
                  <span key={row.rowId} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                    <span className="text-sm font-semibold text-gray-600">{row.rowId}匹：</span>
                    <span className="flex flex-wrap items-center gap-0.5">
                      {row.sizes.map((size, idx) => (
                        <span key={`${row.rowId}-${size.size}`} className={size.isSplit ? "font-semibold text-orange-500" : "text-gray-500"}>
                          {idx > 0 ? "," : ""}{size.size}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onUndo}
            onPointerDown={(event) => {
              const button = event.currentTarget;
              const timer = window.setTimeout(() => {
                if (window.confirm("是否清除当前工序并重新分配？")) {
                  onUndo();
                }
              }, 500);
              const clear = () => {
                window.clearTimeout(timer);
                button.removeEventListener("pointerup", clear);
                button.removeEventListener("pointerleave", clear);
                button.removeEventListener("pointercancel", clear);
              };
              button.addEventListener("pointerup", clear);
              button.addEventListener("pointerleave", clear);
              button.addEventListener("pointercancel", clear);
            }}
            disabled={!canUndo}
            className={`shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold transition-all active:scale-95 ${
              !canUndo
                ? "bg-gray-100 text-gray-300"
                : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-700"
            }`}
          >
            撤销
          </button>
        </div>
      </div>

      <div className="border-t border-gray-100 px-3 py-2.5">
        {breakdown.rows.length > 0 ? (
          <div className="space-y-2">
            {breakdown.rows.map((row) => (
              <div key={row.rowId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5">
                  <span className="text-2xl font-black text-red-500">{row.rowId}</span>
                  <span className="text-sm text-gray-500">匹</span>
                  <span className="text-sm font-semibold text-gray-600">{row.color}</span>
                  <span className="ml-auto text-sm text-gray-500">{row.total} 件</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
                  {row.entries.map((entry) => {
                    const zhaNo = CUT_BED_SIZE_ORDER.indexOf(entry.size) + 1;
                    return (
                      <div key={entry.key} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                          <span className="text-gray-700">{zhaNo}</span>扎
                        </span>
                        <span className={`text-lg font-black leading-none ${entry.isSplit ? "text-orange-500" : "text-gray-800"}`}>
                          {entry.size}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          <span className="text-gray-700">{entry.assignedQuantity}</span>件
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-400">还没有分配数量</div>
        )}
      </div>
    </div>
  );
}

function ThemeElevenV4() {
  const workers: CutBedWorker[] = [
    { id: "w1", name: "张三", color: "#EF4444" },
    { id: "w2", name: "李四", color: "#10B981" },
    { id: "w3", name: "王五", color: "#3B82F6" },
    { id: "w4", name: "赵前", color: "#F59E0B" },
    { id: "w5", name: "钱风中", color: "#8B5CF6" },
    { id: "w6", name: "刘太已", color: "#06B6D4" },
  ];
  const processOptions = PROCESSES.map((name, index) => ({
    id: `cut-bed-proc-v4-${index + 1}`,
    index: index + 1,
    name,
  }));

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [selectedProcessId, setSelectedProcessId] = useState(processOptions[0].id);
  const [isProcessDrawerOpen, setIsProcessDrawerOpen] = useState(false);
  const [allocations, setAllocations] = useState<CutBedAllocationsV4>({});
  const [history, setHistory] = useState<CutBedAllocationsV4[]>([]);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [draftAllocation, setDraftAllocation] = useState<Record<string, string>>({});
  const processTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<string | null>(null);

  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const editingCell = editingCellKey ? CUT_BED_ALL_CELLS.find((cell) => cell.key === editingCellKey) ?? null : null;
  const editingAssignedTotal = Object.values(draftAllocation).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  const editingRemaining = editingCell ? editingCell.quantity - editingAssignedTotal : 0;

  useEffect(() => {
    const index = processOptions.findIndex((process) => process.id === selectedProcessId);
    if (index >= 0) {
      processTabRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedProcessId]);

  const pushHistory = () => {
    setHistory((current) => [...current, cloneCutBedAllocationsV4(allocations)]);
  };

  const setCellAllocations = (cellKey: string, workerMap: Record<string, number>) => {
    setAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      const cleaned = Object.fromEntries(Object.entries(workerMap).filter(([, qty]) => qty > 0));
      if (Object.keys(cleaned).length === 0) {
        delete next[cellKey];
      } else {
        next[cellKey] = cleaned;
      }
      return next;
    });
  };

  const handleCellAssign = (cellKey: string) => {
    if (longPressTriggeredRef.current === cellKey) {
      longPressTriggeredRef.current = null;
      return;
    }

    const cell = CUT_BED_ALL_CELLS.find((item) => item.key === cellKey);
    if (!cell) return;

    const ownerIds = getCutBedCellOwnersV4(allocations, cellKey);
    const selectedQty = getCutBedCellOwnerQtyV4(allocations, cellKey, selectedWorkerId);
    const isOnlySelectedOwner = ownerIds.length === 1 && selectedQty === cell.quantity;

    pushHistory();
    if (isOnlySelectedOwner) {
      setCellAllocations(cellKey, {});
    } else {
      setCellAllocations(cellKey, { [selectedWorkerId]: cell.quantity });
    }
  };

  const handleRowAssign = (rowId: string) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.rowId === rowId && getCutBedCellOwnersV4(allocations, cell.key).length === 0)
      .map((cell) => [cell.key, { [selectedWorkerId]: cell.quantity }] as const);
    if (changes.length === 0) return;
    pushHistory();
    setAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      changes.forEach(([cellKey, workerMap]) => {
        next[cellKey] = workerMap;
      });
      return next;
    });
  };

  const handleColumnAssign = (size: CutBedSize) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.size === size && getCutBedCellOwnersV4(allocations, cell.key).length === 0)
      .map((cell) => [cell.key, { [selectedWorkerId]: cell.quantity }] as const);
    if (changes.length === 0) return;
    pushHistory();
    setAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      changes.forEach(([cellKey, workerMap]) => {
        next[cellKey] = workerMap;
      });
      return next;
    });
  };

  const handleUndo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setAllocations(previous);
    setHistory((current) => current.slice(0, -1));
  };

  const handleLongPressStart = (cellKey: string) => {
    clearLongPress();
    longPressTimerRef.current = window.setTimeout(() => {
      const currentMap = allocations[cellKey] ?? {};
      setDraftAllocation(Object.fromEntries(workers.map((worker) => [worker.id, String(currentMap[worker.id] ?? 0)])));
      setEditingCellKey(cellKey);
      longPressTriggeredRef.current = cellKey;
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-stone-50">
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex w-max gap-2 pr-2">
              {processOptions.map((process, index) => {
                const isActive = process.id === selectedProcessId;
                return (
                  <button
                    key={process.id}
                    ref={(el) => { processTabRefs.current[index] = el; }}
                    onClick={() => setSelectedProcessId(process.id)}
                    className={`cursor-pointer active:scale-95 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] font-black opacity-70">{process.index}.</span>
                    <span>{process.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setIsProcessDrawerOpen(true)}
            className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="7" y1="12" x2="20" y2="12" />
              <line x1="10" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {workers.map((worker) => {
              const isSelected = worker.id === selectedWorkerId;
              const ownedQuantity = getCutBedWorkerAssignedTotalV4(allocations, worker.id);
              return (
                <button
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`relative flex min-w-[76px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border px-3 py-2 text-center transition-all hover:bg-slate-50 active:scale-95 ${
                    isSelected ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={isSelected ? { background: worker.color } : undefined}
                >
                  {!isSelected && (
                    <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: worker.color }} />
                  )}
                  <div className="text-sm font-black">{worker.name}</div>
                  <div
                    className={`mt-1 text-[12px] ${
                      ownedQuantity > 0
                        ? isSelected
                          ? "rounded-full bg-white/90 px-2 font-black text-[#FF6600]"
                          : "font-black text-[#FF6600]"
                        : "font-medium text-gray-400"
                    }`}
                  >
                    {ownedQuantity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div ref={contentScrollRef} className="min-h-0 flex-1 flex flex-col">
        <div ref={tableScrollRef} onScroll={handleTableScroll} className="min-h-0 flex-1 overflow-auto border-y border-slate-200 bg-white shadow-sm">
          <table className="min-w-max border-separate border-spacing-0 text-center">
            <thead className="sticky top-0 z-30">
              <tr>
                <th className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                  <div className="flex min-h-[30px] w-[48px] items-center justify-center text-[11px] font-bold text-white">
                    <span>匹号</span>
                    <span className="text-[10px] font-medium text-white/70">颜色</span>
                  </div>
                </th>
                {CUT_BED_SIZE_ORDER.map((size) => (
                  <th key={size} className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                    <button
                      onClick={() => handleColumnAssign(size)}
                      className="flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700"
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUT_BED_TABLE_DATA.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-0 py-0">
                    <button
                      onClick={() => handleRowAssign(row.id)}
                      className={`flex min-h-11 w-[48px] cursor-pointer items-center justify-center px-1 transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-black text-slate-900">{row.id}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-slate-400">{row.color}</span>
                      </span>
                    </button>
                  </td>
                  {CUT_BED_SIZE_ORDER.map((size) => {
                    const cellKey = `${row.id}__${size}`;
                    const ownerIds = getCutBedCellOwnersV4(allocations, cellKey);
                    const owner = ownerIds.length === 1 ? workers.find((worker) => worker.id === ownerIds[0]) : undefined;
                    const isSelectedOwner = ownerIds.length === 1 && ownerIds[0] === selectedWorkerId;
                    const quantity = row.sizes[size];
                    const isSplit = ownerIds.length > 1;
                    const splitColors = ownerIds
                      .map((workerId) => workers.find((worker) => worker.id === workerId)?.color)
                      .filter((color): color is string => Boolean(color));

                    return (
                      <td key={cellKey} className="border-b border-r border-slate-200 px-0 py-0">
                        <button
                          onClick={() => handleCellAssign(cellKey)}
                          onPointerDown={() => handleLongPressStart(cellKey)}
                          onPointerUp={clearLongPress}
                          onPointerLeave={clearLongPress}
                          onPointerCancel={clearLongPress}
                          className={`relative flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-sm transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                            isSplit
                              ? "bg-orange-50 text-slate-600"
                              : owner
                                ? isSelectedOwner
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-slate-50 text-slate-400"
                                : "bg-white text-slate-700"
                          } ${isSelectedOwner ? "ring-1 ring-inset ring-slate-300" : ""}`}
                        >
                          {isSplit ? (
                            <SplitOwnerDotV4 colors={splitColors} />
                          ) : owner ? (
                            <span
                              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                              style={{ background: owner.color }}
                            >
                              {owner.name.slice(0, 1)}
                            </span>
                          ) : null}
                          <span className={isSplit ? "font-semibold text-blue-600" : ownerIds.length > 0 ? "font-medium" : "font-semibold"}>
                            {quantity}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-3 py-3">
          <CutBedSummaryCardV4 worker={selectedWorker} allocations={allocations} onUndo={handleUndo} canUndo={history.length > 0} />
        </div>
      </div>

      {editingCell && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-3">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="text-base font-black text-slate-900">修改分配数量</div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                {editingCell.rowId} / {editingCell.color} / {editingCell.size} / 总数 {editingCell.quantity}
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              {workers.map((worker) => (
                <label key={worker.id} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-bold text-slate-700">{worker.name}</span>
                  <input
                    type="number"
                    min={0}
                    className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                    value={draftAllocation[worker.id] ?? "0"}
                    onChange={(e) => setDraftAllocation((current) => ({ ...current, [worker.id]: e.target.value }))}
                  />
                </label>
              ))}
              <div className={`text-xs font-medium ${editingRemaining < 0 ? "text-red-500" : "text-slate-500"}`}>
                剩余可分配：{editingRemaining}
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-4">
              <button
                onClick={() => setEditingCellKey(null)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!editingCell || editingRemaining < 0) return;
                  const nextMap = Object.fromEntries(
                    workers
                      .map((worker) => [worker.id, Math.max(0, Math.min(editingCell.quantity, Number(draftAllocation[worker.id] ?? 0) || 0))] as const)
                      .filter(([, qty]) => qty > 0)
                  );
                  pushHistory();
                  setCellAllocations(editingCell.key, nextMap);
                  setEditingCellKey(null);
                }}
                disabled={editingRemaining < 0}
                className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${
                  editingRemaining < 0 ? "bg-slate-300" : "bg-slate-900 hover:bg-slate-800 active:bg-slate-700"
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/35">
          <button onClick={() => setIsProcessDrawerOpen(false)} className="flex-1 cursor-default" aria-hidden="true" />
          <div className="flex h-full w-[280px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="text-base font-black text-slate-900">选择工序</div>
              <button
                onClick={() => setIsProcessDrawerOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-2">
                {processOptions.map((process) => {
                  const isActive = process.id === selectedProcessId;
                  return (
                    <button
                      key={process.id}
                      onClick={() => {
                        setSelectedProcessId(process.id);
                        setIsProcessDrawerOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:bg-slate-50 active:scale-[0.99] ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {process.index}
                      </span>
                      <span className="text-sm font-bold">{process.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CutBedSummaryCardV5({
  worker,
  allocations,
  onUndo,
  onReset,
  canUndo,
}: {
  worker: CutBedWorker;
  allocations: CutBedAllocationsV4;
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}) {
  const breakdown = getCutBedBreakdownV4(allocations, worker.id);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-black text-gray-900">{worker.name}</span>
              <span className="text-sm text-gray-400">{breakdown.bundleCount} 扎</span>
              <span className="text-lg font-black text-red-500">{breakdown.totalQuantity}</span>
              <span className="text-sm text-gray-400">件</span>
              {breakdown.wholeMatches.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500">
                  <span className="text-gray-400">整匹：</span>
                  <span className="text-sm font-semibold text-gray-600">{breakdown.wholeMatches.join("，")}</span>
                </span>
              )}
            </div>
            {breakdown.partialMatches.length > 0 && (
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                {breakdown.partialMatches.map((row) => (
                  <span key={row.rowId} className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-0.5">
                    <span className="text-sm font-semibold text-gray-600">{row.rowId}匹：</span>
                    <span className="flex flex-wrap items-center gap-0.5">
                      {row.sizes.map((size, idx) => (
                        <span key={`${row.rowId}-${size.size}`} className={size.isSplit ? "font-black text-blue-600" : "text-gray-500"}>
                          {idx > 0 ? "," : ""}{size.size}
                        </span>
                      ))}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button hidden
            onClick={onUndo}
            onPointerDown={(event) => {
              const button = event.currentTarget;
              const timer = window.setTimeout(() => {
                if (window.confirm("是否清除重新分配并恢复当前工序初始状态？")) {
                  onReset();
                }
              }, 500);
              const clear = () => {
                window.clearTimeout(timer);
                button.removeEventListener("pointerup", clear);
                button.removeEventListener("pointerleave", clear);
                button.removeEventListener("pointercancel", clear);
              };
              button.addEventListener("pointerup", clear);
              button.addEventListener("pointerleave", clear);
              button.addEventListener("pointercancel", clear);
            }}
            disabled={!canUndo}
            className={!canUndo ? "shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold bg-gray-100 text-gray-300" : "shrink-0 cursor-pointer rounded-xl px-3 py-2 text-sm font-bold bg-slate-900 text-white transition-all active:scale-95 hover:bg-slate-800 active:bg-slate-700"}
          >
            撤销
          </button>
        </div>
      </div>

      <div className="px-3 py-2.5">
        {breakdown.rows.length > 0 ? (
          <div className="space-y-2">
            {breakdown.rows.map((row) => (
              <div key={row.rowId} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5">
                  <span className="text-2xl font-black text-red-500">{row.rowId}</span>
                  <span className="text-sm text-gray-500">匹</span>
                  <span className="text-sm font-semibold text-gray-600">{row.color}</span>
                  <span className="ml-auto text-sm text-gray-500">{row.total} 件</span>
                </div>
                <div className="flex flex-wrap gap-2 bg-white px-3 py-2">
                  {row.entries.map((entry) => {
                    const zhaNo = CUT_BED_SIZE_ORDER.indexOf(entry.size) + 1;
                    return (
                      <div key={entry.key} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5">
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-500">
                          <span className="text-gray-700">{zhaNo}</span>扎
                        </span>
                        <span className={entry.isSplit ? "text-lg font-black leading-none text-blue-600" : "text-lg font-black leading-none text-gray-800"}>
                          {entry.size}
                        </span>
                        <span className="text-xs font-medium text-gray-400">
                          <span className="text-gray-700">{entry.assignedQuantity}</span>件
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs font-medium text-gray-400">还没有分配数量</div>
        )}
      </div>
    </div>
  );
}

type QuickBalanceRule = "per-match-even" | "cross-match-even" | "size-rotation";
type QuickAiRule = "history-data" | "color-focus" | "size-focus" | "load-priority" | "skill-priority";

const QUICK_BALANCE_RULE_OPTIONS: Array<{ value: QuickBalanceRule; label: string; description: string }> = [
  { value: "per-match-even", label: "每匹平分", description: "每匹内轮转平分，适合首轮快速开单。" },
  { value: "cross-match-even", label: "跨匹平分", description: "按当前工序全量均衡，优先保证总量接近。" },
  { value: "size-rotation", label: "按尺码轮转", description: "按尺码顺序轮转给工人，适合固定分尺码作业。" },
];

const QUICK_AI_RULE_OPTIONS: Array<{ value: QuickAiRule; label: string; description: string }> = [
  { value: "history-data", label: "按历史数据", description: "依据当前工序偏好和既往节奏，生成较均衡的拆分结果。" },
  { value: "color-focus", label: "按颜色集中", description: "同色优先集中给固定工人，减少换色切换。" },
  { value: "size-focus", label: "按尺码集中", description: "让相近尺码集中到同一工人，便于连贯作业。" },
  { value: "load-priority", label: "按工人负荷优先", description: "参考其它工序负荷，把当前工序优先分给负荷较低的工人。" },
  { value: "skill-priority", label: "按熟练度优先", description: "按当前工序熟练工优先分配，适合关键工序提速。" },
];

function getSortedCutBedCells() {
  return [...CUT_BED_ALL_CELLS].sort(
    (a, b) =>
      Number(a.rowId) - Number(b.rowId) ||
      CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size)
  );
}

function splitQuantityByWeights(total: number, workerIds: string[], weights: number[]) {
  if (total <= 0 || workerIds.length === 0) return {} as Record<string, number>;

  const normalizedWeights = workerIds.map((_, index) => Math.max(weights[index] ?? 0, 0.0001));
  const weightSum = normalizedWeights.reduce((sum, value) => sum + value, 0);
  const rawValues = normalizedWeights.map((weight) => (weight / weightSum) * total);
  const baseValues = rawValues.map((value) => Math.floor(value));
  let remainder = total - baseValues.reduce((sum, value) => sum + value, 0);

  const order = rawValues
    .map((value, index) => ({ index, fraction: value - baseValues[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < remainder; i += 1) {
    baseValues[order[i % order.length].index] += 1;
  }

  return Object.fromEntries(
    workerIds.map((workerId, index) => [workerId, baseValues[index]]).filter(([, quantity]) => quantity > 0)
  ) as Record<string, number>;
}

function buildMatchBalancedAllocations(workerIds: string[]): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};
  const globalTotals = Object.fromEntries(workerIds.map((workerId) => [workerId, 0])) as Record<string, number>;
  const rowMap = new Map<string, CutBedCell[]>();

  getSortedCutBedCells().forEach((cell) => {
    if (!rowMap.has(cell.rowId)) rowMap.set(cell.rowId, []);
    rowMap.get(cell.rowId)!.push(cell);
  });

  Array.from(rowMap.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .forEach(([, rowCells], rowIndex) => {
      const rowTotals = Object.fromEntries(workerIds.map((workerId) => [workerId, 0])) as Record<string, number>;

      rowCells.forEach((cell, cellIndex) => {
        const startIndex = (rowIndex + cellIndex) % workerIds.length;
        const rotatedWorkerIds = workerIds.map((_, index) => workerIds[(index + startIndex) % workerIds.length]);
        const targetWorkerId = rotatedWorkerIds.reduce((bestWorkerId, workerId) => {
          if (rowTotals[workerId] !== rowTotals[bestWorkerId]) {
            return rowTotals[workerId] < rowTotals[bestWorkerId] ? workerId : bestWorkerId;
          }
          if (globalTotals[workerId] !== globalTotals[bestWorkerId]) {
            return globalTotals[workerId] < globalTotals[bestWorkerId] ? workerId : bestWorkerId;
          }
          return workerId;
        }, rotatedWorkerIds[0]);

        result[cell.key] = { [targetWorkerId]: cell.quantity };
        rowTotals[targetWorkerId] += cell.quantity;
        globalTotals[targetWorkerId] += cell.quantity;
      });
    });

  return result;
}

function buildGlobalBalancedAllocations(workerIds: string[], initialTotals?: Record<string, number>): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};
  const totals = Object.fromEntries(
    workerIds.map((workerId) => [workerId, initialTotals?.[workerId] ?? 0])
  ) as Record<string, number>;

  [...CUT_BED_ALL_CELLS]
    .sort(
      (a, b) =>
        b.quantity - a.quantity ||
        Number(a.rowId) - Number(b.rowId) ||
        CUT_BED_SIZE_ORDER.indexOf(a.size) - CUT_BED_SIZE_ORDER.indexOf(b.size)
    )
    .forEach((cell, cellIndex) => {
      const rotatedWorkerIds = workerIds.map((_, index) => workerIds[(index + cellIndex) % workerIds.length]);
      const targetWorkerId = rotatedWorkerIds.reduce((bestWorkerId, workerId) => {
        if (totals[workerId] !== totals[bestWorkerId]) {
          return totals[workerId] < totals[bestWorkerId] ? workerId : bestWorkerId;
        }
        return workerId;
      }, rotatedWorkerIds[0]);

      result[cell.key] = { [targetWorkerId]: cell.quantity };
      totals[targetWorkerId] += cell.quantity;
    });

  return result;
}

function buildSizeRotationAllocations(workerIds: string[]): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};

  getSortedCutBedCells().forEach((cell) => {
    const sizeIndex = CUT_BED_SIZE_ORDER.indexOf(cell.size);
    const targetWorkerId = workerIds[sizeIndex % workerIds.length];
    result[cell.key] = { [targetWorkerId]: cell.quantity };
  });

  return result;
}

function buildHistoryDrivenAllocations(workerIds: string[], processIndex: number): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};

  getSortedCutBedCells().forEach((cell) => {
    const rowNumber = Number(cell.rowId);
    const sizeIndex = CUT_BED_SIZE_ORDER.indexOf(cell.size);
    const baseIndex = (processIndex + rowNumber + sizeIndex) % workerIds.length;
    const preferredWorkerIds = Array.from(
      new Set([
        workerIds[baseIndex],
        workerIds[(baseIndex + 2) % workerIds.length],
        workerIds[(baseIndex + 4) % workerIds.length],
      ])
    );
    const activeWorkerIds =
      cell.quantity >= 24 ? preferredWorkerIds.slice(0, 3) : cell.quantity >= 18 ? preferredWorkerIds.slice(0, 2) : preferredWorkerIds.slice(0, 1);
    const weights = activeWorkerIds.length === 3 ? [0.5, 0.3, 0.2] : activeWorkerIds.length === 2 ? [0.65, 0.35] : [1];

    result[cell.key] = splitQuantityByWeights(cell.quantity, activeWorkerIds, weights);
  });

  return result;
}

function buildColorFocusedAllocations(workerIds: string[]): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};
  const colorOrder = Array.from(new Set(CUT_BED_TABLE_DATA.map((row) => row.color)));
  const colorOwnerMap = new Map(
    colorOrder.map((color, index) => [
      color,
      Array.from(new Set([workerIds[index % workerIds.length], workerIds[(index + 3) % workerIds.length]])),
    ])
  );

  getSortedCutBedCells().forEach((cell) => {
    const ownerIds = colorOwnerMap.get(cell.color) ?? [workerIds[0]];
    const activeWorkerIds = cell.quantity >= 20 ? ownerIds.slice(0, 2) : ownerIds.slice(0, 1);
    const weights = activeWorkerIds.length > 1 ? [0.75, 0.25] : [1];

    result[cell.key] = splitQuantityByWeights(cell.quantity, activeWorkerIds, weights);
  });

  return result;
}

function buildSizeFocusedAllocations(workerIds: string[]): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};

  getSortedCutBedCells().forEach((cell) => {
    const sizeIndex = CUT_BED_SIZE_ORDER.indexOf(cell.size);
    const preferredWorkerIds = Array.from(
      new Set([workerIds[sizeIndex % workerIds.length], workerIds[(sizeIndex + 1) % workerIds.length]])
    );
    const activeWorkerIds = cell.quantity >= 20 ? preferredWorkerIds.slice(0, 2) : preferredWorkerIds.slice(0, 1);
    const weights = activeWorkerIds.length > 1 ? [0.7, 0.3] : [1];

    result[cell.key] = splitQuantityByWeights(cell.quantity, activeWorkerIds, weights);
  });

  return result;
}

function buildSkillPriorityAllocations(workerIds: string[], processIndex: number): CutBedAllocationsV4 {
  const result: CutBedAllocationsV4 = {};
  const rankedWorkerIds = workerIds.map((_, index) => workerIds[(processIndex - 1 + index) % workerIds.length]);

  getSortedCutBedCells().forEach((cell, cellIndex) => {
    const preferredWorkerIds = cell.quantity >= 20 ? rankedWorkerIds.slice(0, 3) : rankedWorkerIds.slice(0, 2);
    const rotatedWorkerIds = preferredWorkerIds.map(
      (_, index) => preferredWorkerIds[(index + cellIndex) % preferredWorkerIds.length]
    );
    const weights = rotatedWorkerIds.length === 3 ? [0.5, 0.3, 0.2] : [0.7, 0.3];

    result[cell.key] = splitQuantityByWeights(cell.quantity, rotatedWorkerIds, weights);
  });

  return result;
}

function ThemeElevenV5() {
  const workers: CutBedWorker[] = [
    { id: "w1", name: "张三", color: "#EF4444" },
    { id: "w2", name: "李四", color: "#10B981" },
    { id: "w3", name: "王五", color: "#3B82F6" },
    { id: "w4", name: "赵前", color: "#F59E0B" },
    { id: "w5", name: "钱风中", color: "#8B5CF6" },
    { id: "w6", name: "刘太已", color: "#06B6D4" },
  ];
  const processOptions = PROCESSES.map((name, index) => ({
    id: `cut-bed-proc-v5-${index + 1}`,
    index: index + 1,
    name,
  }));

  const makeEmptyAllocations = () =>
    Object.fromEntries(processOptions.map((process) => [process.id, {} as CutBedAllocationsV4]));

  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0].id);
  const [selectedProcessId, setSelectedProcessId] = useState(processOptions[0].id);
  const [isProcessDrawerOpen, setIsProcessDrawerOpen] = useState(false);
  const [isQuickAllocateDrawerOpen, setIsQuickAllocateDrawerOpen] = useState(false);
  const [showCompactSizeHeader, setShowCompactSizeHeader] = useState(false);
  const [balanceRule, setBalanceRule] = useState<QuickBalanceRule>("per-match-even");
  const [aiRule, setAiRule] = useState<QuickAiRule>("history-data");
  const [allocatingTask, setAllocatingTask] = useState<{ title: string; description: string } | null>(null);
  const [processAllocations, setProcessAllocations] = useState<Record<string, CutBedAllocationsV4>>(makeEmptyAllocations);
  const [processHistories, setProcessHistories] = useState<Record<string, CutBedAllocationsV4[]>>(
    () => Object.fromEntries(processOptions.map((process) => [process.id, [] as CutBedAllocationsV4[]]))
  );
  const [savedProcessAllocations, setSavedProcessAllocations] = useState<Record<string, CutBedAllocationsV4>>(makeEmptyAllocations);
  const [editingCellKey, setEditingCellKey] = useState<string | null>(null);
  const [draftAllocation, setDraftAllocation] = useState<Record<string, string>>({});
  const processTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef<string | null>(null);
  const quickAllocateTimerRef = useRef<number | null>(null);
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const compactHeaderScrollRef = useRef<HTMLDivElement | null>(null);

  const allocations = processAllocations[selectedProcessId] ?? {};
  const history = processHistories[selectedProcessId] ?? [];
  const savedAllocations = savedProcessAllocations[selectedProcessId] ?? {};
  const selectedProcess = processOptions.find((process) => process.id === selectedProcessId) ?? processOptions[0];
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId) ?? workers[0];
  const balanceRuleMeta = QUICK_BALANCE_RULE_OPTIONS.find((rule) => rule.value === balanceRule) ?? QUICK_BALANCE_RULE_OPTIONS[0];
  const aiRuleMeta = QUICK_AI_RULE_OPTIONS.find((rule) => rule.value === aiRule) ?? QUICK_AI_RULE_OPTIONS[0];
  const processAssignedTotal = Object.values(allocations).reduce(
    (sum, workerMap) => sum + Object.values(workerMap).reduce((inner, qty) => inner + qty, 0),
    0
  );
  const processPct = CUT_BED_TOTAL_QUANTITY === 0 ? 0 : Math.round((processAssignedTotal / CUT_BED_TOTAL_QUANTITY) * 100);
  const editingCell = editingCellKey ? CUT_BED_ALL_CELLS.find((cell) => cell.key === editingCellKey) ?? null : null;
  const editingAssignedTotal = Object.values(draftAllocation).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  const editingRemaining = editingCell ? editingCell.quantity - editingAssignedTotal : 0;

  const serializeAllocations = (value: CutBedAllocationsV4) =>
    JSON.stringify(
      Object.keys(value)
        .sort()
        .map((key) => [key, Object.entries(value[key]).sort(([a], [b]) => a.localeCompare(b))])
    );

  const isDirty = serializeAllocations(allocations) !== serializeAllocations(savedAllocations);

  useEffect(() => {
    const index = processOptions.findIndex((process) => process.id === selectedProcessId);
    if (index >= 0) {
      processTabRefs.current[index]?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selectedProcessId]);

  useEffect(() => {
    return () => {
      if (quickAllocateTimerRef.current) {
        window.clearTimeout(quickAllocateTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (showCompactSizeHeader && compactHeaderScrollRef.current && tableScrollRef.current) {
      compactHeaderScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  }, [showCompactSizeHeader]);

  const pushHistory = () => {
    setProcessHistories((current) => ({
      ...current,
      [selectedProcessId]: [...(current[selectedProcessId] ?? []), cloneCutBedAllocationsV4(allocations)],
    }));
  };

  const setCurrentAllocations = (nextAllocations: CutBedAllocationsV4) => {
    setProcessAllocations((current) => ({ ...current, [selectedProcessId]: nextAllocations }));
  };

  const setCellAllocations = (cellKey: string, workerMap: Record<string, number>) => {
    setProcessAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      const processState = cloneCutBedAllocationsV4(next[selectedProcessId] ?? {});
      const cleaned = Object.fromEntries(Object.entries(workerMap).filter(([, qty]) => qty > 0));
      if (Object.keys(cleaned).length === 0) {
        delete processState[cellKey];
      } else {
        processState[cellKey] = cleaned;
      }
      next[selectedProcessId] = processState;
      return next;
    });
  };

  const attemptSelectProcess = (nextProcessId: string) => {
    if (nextProcessId === selectedProcessId) return;
    if (isDirty && !window.confirm("当前工序分配未保存，是否离开此页面？")) return;
    setSelectedProcessId(nextProcessId);
    setSelectedWorkerId(workers[0].id);
    setIsQuickAllocateDrawerOpen(false);
    setEditingCellKey(null);
  };

  const buildOtherProcessLoadTotals = () =>
    Object.fromEntries(
      workers.map((worker) => [
        worker.id,
        Object.entries(processAllocations).reduce((sum, [processId, processAllocation]) => {
          if (processId === selectedProcessId) return sum;
          return sum + getCutBedWorkerAssignedTotalV4(processAllocation, worker.id);
        }, 0),
      ])
    ) as Record<string, number>;

  const buildQuickAllocations = (mode: "balance" | "ai") => {
    const workerIds = workers.map((worker) => worker.id);

    if (mode === "balance") {
      switch (balanceRule) {
        case "cross-match-even":
          return buildGlobalBalancedAllocations(workerIds);
        case "size-rotation":
          return buildSizeRotationAllocations(workerIds);
        case "per-match-even":
        default:
          return buildMatchBalancedAllocations(workerIds);
      }
    }

    switch (aiRule) {
      case "color-focus":
        return buildColorFocusedAllocations(workerIds);
      case "size-focus":
        return buildSizeFocusedAllocations(workerIds);
      case "load-priority":
        return buildGlobalBalancedAllocations(workerIds, buildOtherProcessLoadTotals());
      case "skill-priority":
        return buildSkillPriorityAllocations(workerIds, selectedProcess.index);
      case "history-data":
      default:
        return buildHistoryDrivenAllocations(workerIds, selectedProcess.index);
    }
  };

  const handleQuickAllocate = (mode: "balance" | "ai") => {
    const activeRule = mode === "balance" ? balanceRuleMeta : aiRuleMeta;
    const nextAllocations = buildQuickAllocations(mode);

    if (quickAllocateTimerRef.current) {
      window.clearTimeout(quickAllocateTimerRef.current);
    }

    setIsQuickAllocateDrawerOpen(false);
    setIsProcessDrawerOpen(false);
    setEditingCellKey(null);
    setAllocatingTask({
      title: `${mode === "balance" ? "数量平分" : "AI平分"} · ${activeRule.label}`,
      description: `${selectedProcess.name}正在按“${activeRule.label}”规则生成分配结果，完成后将自动回写到当前工序。`,
    });

    quickAllocateTimerRef.current = window.setTimeout(() => {
      pushHistory();
      setCurrentAllocations(nextAllocations);
      setAllocatingTask(null);
      quickAllocateTimerRef.current = null;
    }, 1400);
  };

  const handleCellAssign = (cellKey: string) => {
    if (longPressTriggeredRef.current === cellKey) {
      longPressTriggeredRef.current = null;
      return;
    }
    const cell = CUT_BED_ALL_CELLS.find((item) => item.key === cellKey);
    if (!cell) return;
    const ownerIds = getCutBedCellOwnersV4(allocations, cellKey);
    const selectedQty = getCutBedCellOwnerQtyV4(allocations, cellKey, selectedWorkerId);
    const isOnlySelectedOwner = ownerIds.length === 1 && selectedQty === cell.quantity;
    pushHistory();
    if (isOnlySelectedOwner) {
      setCellAllocations(cellKey, {});
    } else {
      setCellAllocations(cellKey, { [selectedWorkerId]: cell.quantity });
    }
  };

  const handleRowAssign = (rowId: string) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.rowId === rowId && getCutBedCellOwnersV4(allocations, cell.key).length === 0)
      .map((cell) => [cell.key, { [selectedWorkerId]: cell.quantity }] as const);
    if (changes.length === 0) return;
    pushHistory();
    setProcessAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      const processState = cloneCutBedAllocationsV4(next[selectedProcessId] ?? {});
      changes.forEach(([cellKey, workerMap]) => {
        processState[cellKey] = workerMap;
      });
      next[selectedProcessId] = processState;
      return next;
    });
  };

  const handleColumnAssign = (size: CutBedSize) => {
    const changes = CUT_BED_ALL_CELLS
      .filter((cell) => cell.size === size && getCutBedCellOwnersV4(allocations, cell.key).length === 0)
      .map((cell) => [cell.key, { [selectedWorkerId]: cell.quantity }] as const);
    if (changes.length === 0) return;
    pushHistory();
    setProcessAllocations((current) => {
      const next = cloneCutBedAllocationsV4(current);
      const processState = cloneCutBedAllocationsV4(next[selectedProcessId] ?? {});
      changes.forEach(([cellKey, workerMap]) => {
        processState[cellKey] = workerMap;
      });
      next[selectedProcessId] = processState;
      return next;
    });
  };

  const handleUndo = () => {
    const previous = history[history.length - 1];
    if (!previous) return;
    setCurrentAllocations(previous);
    setProcessHistories((current) => ({ ...current, [selectedProcessId]: (current[selectedProcessId] ?? []).slice(0, -1) }));
  };

  const handleReset = () => {
    setCurrentAllocations({});
    setProcessHistories((current) => ({ ...current, [selectedProcessId]: [] }));
    setSavedProcessAllocations((current) => ({ ...current, [selectedProcessId]: {} }));
  };

  const handleSave = () => {
    setSavedProcessAllocations((current) => ({ ...current, [selectedProcessId]: cloneCutBedAllocationsV4(allocations) }));
  };

  const handleLongPressStart = (cellKey: string) => {
    if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = window.setTimeout(() => {
      const currentMap = allocations[cellKey] ?? {};
      setDraftAllocation(Object.fromEntries(workers.map((worker) => [worker.id, String(currentMap[worker.id] ?? 0)])));
      setEditingCellKey(cellKey);
      longPressTriggeredRef.current = cellKey;
    }, 450);
  };

  const clearLongPress = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContentScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const shouldShow = event.currentTarget.scrollTop > 40;
    setShowCompactSizeHeader((current) => (current === shouldShow ? current : shouldShow));
  };

  const handleTableScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (compactHeaderScrollRef.current) {
      compactHeaderScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  return (
    <div data-theme-eleven-v5 className="relative flex h-full flex-col overflow-hidden bg-stone-50">
      <style>{`
        [data-theme-eleven-v5] thead {
          position: sticky;
          top: 0;
          z-index: 30;
        }

        [data-theme-eleven-v5] thead th {
          position: sticky;
          top: 0;
          z-index: 35;
          background: #0f172a;
        }

        [data-theme-eleven-v5] thead th > div {
          min-height: 30px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          font-size: 11px;
        }

        [data-theme-eleven-v5] thead th > div > span:last-child {
          display: none;
        }

        [data-theme-eleven-v5] thead th button {
          min-height: 30px;
          font-size: 11px;
        }
      `}</style>
      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 px-3 py-3">
          <div className="min-w-0 flex-1 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            <div className="flex w-max gap-2 pr-2">
              {processOptions.map((process, index) => {
                const isActive = process.id === selectedProcessId;
                return (
                  <button
                    key={process.id}
                    ref={(el) => { processTabRefs.current[index] = el; }}
                    onClick={() => attemptSelectProcess(process.id)}
                    className={`cursor-pointer active:scale-95 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] font-black opacity-70">{process.index}.</span>
                    <span>{process.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <button
            onClick={() => setIsProcessDrawerOpen(true)}
            className="shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-2 text-slate-600 transition-all hover:bg-slate-50 active:scale-95 active:bg-slate-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="7" y1="12" x2="20" y2="12" />
              <line x1="10" y1="17" x2="20" y2="17" />
            </svg>
          </button>
        </div>

        <div className="border-t border-slate-100 px-3 py-3">
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {workers.map((worker) => {
              const isSelected = worker.id === selectedWorkerId;
              const ownedQuantity = getCutBedWorkerAssignedTotalV4(allocations, worker.id);
              return (
                <button
                  key={worker.id}
                  onClick={() => setSelectedWorkerId(worker.id)}
                  className={`relative flex min-w-[76px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border px-3 py-2 text-center transition-all hover:bg-slate-50 active:scale-95 ${
                    isSelected ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={isSelected ? { background: worker.color } : undefined}
                >
                  {!isSelected && (
                    <span className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: worker.color }} />
                  )}
                  <div className="w-full text-center text-sm font-black">{worker.name}</div>
                  <div
                    className={`mt-1 w-full text-center text-[12px] ${
                      ownedQuantity > 0
                        ? isSelected
                          ? "rounded-full bg-white px-2 font-black text-[#FF6600]"
                          : "font-black text-[#FF6600]"
                        : isSelected
                          ? "rounded-full bg-white/80 px-2 font-medium text-gray-400"
                          : "font-medium text-gray-400"
                    }`}
                  >
                    {ownedQuantity}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {false && (
        <div className="shrink-0 border-b border-slate-200 bg-white/96 px-3 py-1 backdrop-blur">
          <div ref={compactHeaderScrollRef} className="overflow-x-hidden">
            <div className="flex min-w-max items-center rounded-xl bg-slate-900 px-1 py-1 text-[10px] font-black text-white shadow-sm">
              <span className="inline-flex w-[48px] shrink-0 items-center justify-center text-white/60">尺码</span>
              {CUT_BED_SIZE_ORDER.map((size) => (
                <span
                  key={`compact-${size}`}
                  className="inline-flex w-[52px] shrink-0 items-center justify-center text-[11px] text-white/90"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={contentScrollRef} className="min-h-0 flex-1 flex flex-col">
        <div ref={tableScrollRef} onScroll={handleTableScroll} className="min-h-0 flex-1 overflow-auto border-y border-slate-200 bg-white shadow-sm">
          <table className="min-w-max border-separate border-spacing-0 text-center">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-40 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                  <div className="flex min-h-[30px] w-[48px] items-center justify-center text-[11px] font-bold text-white">
                    <span>匹号</span>
                    <span className="text-[10px] font-medium text-white/70">颜色</span>
                  </div>
                </th>
                {CUT_BED_SIZE_ORDER.map((size) => (
                  <th key={size} className="sticky top-0 z-30 border-b border-r border-slate-200 bg-slate-900 px-0 py-0">
                    <button
                      onClick={() => handleColumnAssign(size)}
                      className="flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-xs font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] active:bg-slate-700"
                    >
                      {size}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUT_BED_TABLE_DATA.map((row, rowIndex) => (
                <tr key={row.id}>
                  <td className="sticky left-0 z-20 border-b border-r border-slate-200 bg-white px-0 py-0">
                    <button
                      onClick={() => handleRowAssign(row.id)}
                      className={`flex min-h-11 w-[48px] cursor-pointer items-center justify-center px-1 transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span className="text-sm font-black text-slate-900">{row.id}</span>
                        <span className="mt-0.5 text-[10px] font-medium text-slate-400">{row.color}</span>
                      </span>
                    </button>
                  </td>
                  {CUT_BED_SIZE_ORDER.map((size) => {
                    const cellKey = `${row.id}__${size}`;
                    const ownerIds = getCutBedCellOwnersV4(allocations, cellKey);
                    const owner = ownerIds.length === 1 ? workers.find((worker) => worker.id === ownerIds[0]) : undefined;
                    const isSelectedOwner = ownerIds.length === 1 && ownerIds[0] === selectedWorkerId;
                    const quantity = row.sizes[size];
                    const isSplit = ownerIds.length > 1;
                    const splitColors = ownerIds
                      .map((workerId) => workers.find((worker) => worker.id === workerId)?.color)
                      .filter((color): color is string => Boolean(color));

                    return (
                      <td key={cellKey} className="border-b border-r border-slate-200 px-0 py-0">
                        <button
                          onClick={() => handleCellAssign(cellKey)}
                          onPointerDown={() => handleLongPressStart(cellKey)}
                          onPointerUp={clearLongPress}
                          onPointerLeave={clearLongPress}
                          onPointerCancel={clearLongPress}
                          className={`relative flex min-h-11 w-[52px] cursor-pointer items-center justify-center text-sm transition-all hover:bg-slate-100 active:scale-[0.98] active:bg-slate-200 ${
                            isSplit
                              ? "bg-orange-50 text-slate-600"
                              : owner
                                ? isSelectedOwner
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-slate-50 text-slate-400"
                                : "bg-white text-slate-700"
                          } ${isSelectedOwner ? "ring-1 ring-inset ring-slate-300" : ""}`}
                        >
                          {isSplit ? (
                            <SplitOwnerDotV4 colors={splitColors} />
                          ) : owner ? (
                            <span
                              className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-black text-white"
                              style={{ background: owner.color }}
                            >
                              {owner.name.slice(0, 1)}
                            </span>
                          ) : null}
                          <span className={isSplit ? "font-black text-blue-600" : ownerIds.length > 0 ? "font-medium" : "font-semibold"}>
                            {quantity}
                          </span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-slate-100 px-3 py-3">
            <CutBedSummaryCardV5
              worker={selectedWorker}
              allocations={allocations}
              onUndo={handleUndo}
              onReset={handleReset}
              canUndo={history.length > 0}
            />
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 active:bg-emerald-700"
          >
            保存
          </button>
          <button
            onClick={handleUndo}
            onPointerDown={(event) => {
              const button = event.currentTarget;
              const timer = window.setTimeout(() => {
                if (window.confirm("鏄惁娓呴櫎閲嶆柊鍒嗛厤骞舵仮澶嶅綋鍓嶅伐搴忓垵濮嬬姸鎬侊紵")) {
                  handleReset();
                }
              }, 500);
              const clear = () => {
                window.clearTimeout(timer);
                button.removeEventListener("pointerup", clear);
                button.removeEventListener("pointerleave", clear);
                button.removeEventListener("pointercancel", clear);
              };
              button.addEventListener("pointerup", clear);
              button.addEventListener("pointerleave", clear);
              button.addEventListener("pointercancel", clear);
            }}
            disabled={history.length === 0}
            className={`shrink-0 cursor-pointer rounded-xl border px-3 py-2 text-xs font-medium transition-all active:scale-95 ${
              history.length === 0
                ? "border-slate-200 bg-slate-100 text-slate-300"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:bg-slate-100"
            }`}
          >
            撤销
          </button>
          <div className="min-w-0 flex-1 text-center leading-tight">
            <div className="text-base font-black text-[#FF6600]">已分配 {processAssignedTotal} 件</div>
            <div className="text-[11px] font-medium text-gray-400">总件数 {CUT_BED_TOTAL_QUANTITY} 件</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsProcessDrawerOpen(false);
              setIsQuickAllocateDrawerOpen(true);
            }}
            className="shrink-0 cursor-pointer rounded-full transition-transform active:scale-95"
            aria-label="打开快速分配"
            title="快速分配"
          >
            <ProgressRing pct={processPct} />
          </button>
        </div>
      </div>

      {false && (
        <div className="pointer-events-none absolute left-3 right-3 top-[126px] z-30">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/96 shadow-sm backdrop-blur">
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 text-[10px] font-black text-white">
              <span className="inline-flex h-6 min-w-[42px] items-center justify-center rounded-xl bg-white/10 px-2 text-white/70">
                尺码
              </span>
              {CUT_BED_SIZE_ORDER.map((size) => (
                <span
                  key={`overlay-${size}`}
                  className="inline-flex h-6 min-w-[32px] items-center justify-center rounded-xl bg-white/10 px-1.5 text-[11px] text-white/90"
                >
                  {size}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {isQuickAllocateDrawerOpen && (
        <div className="absolute inset-0 z-[65] flex items-end bg-black/35">
          <button
            onClick={() => setIsQuickAllocateDrawerOpen(false)}
            className="absolute inset-0 cursor-default"
            aria-hidden="true"
          />
          <div className="relative flex max-h-[78%] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-base font-black text-slate-900">快速分配</div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {selectedProcess.index}. {selectedProcess.name} · 已分配 {processAssignedTotal} / {CUT_BED_TOTAL_QUANTITY}
                  </div>
                </div>
                <button
                  onClick={() => setIsQuickAllocateDrawerOpen(false)}
                  className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="text-sm font-black text-slate-900">数量平分</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">适合首轮分货或需要快速拉平当前工序数量时使用。</div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={balanceRule}
                    onChange={(e) => setBalanceRule(e.target.value as QuickBalanceRule)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-emerald-400"
                  >
                    {QUICK_BALANCE_RULE_OPTIONS.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleQuickAllocate("balance")}
                    className="shrink-0 cursor-pointer rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 active:bg-emerald-700"
                  >
                    数量平分
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">{balanceRuleMeta.description}</div>
              </div>

              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                <div className="text-sm font-black text-slate-900">AI平分</div>
                <div className="mt-1 text-[11px] font-medium text-slate-500">适合结合工序特征、颜色尺码和工人负荷做更贴近现场的自动分配。</div>
                <div className="mt-3 flex items-center gap-2">
                  <select
                    value={aiRule}
                    onChange={(e) => setAiRule(e.target.value as QuickAiRule)}
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-sky-400"
                  >
                    {QUICK_AI_RULE_OPTIONS.map((rule) => (
                      <option key={rule.value} value={rule.value}>
                        {rule.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleQuickAllocate("ai")}
                    className="shrink-0 cursor-pointer rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 active:bg-slate-700"
                  >
                    AI平分
                  </button>
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">{aiRuleMeta.description}</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-black text-slate-900">服装工序常用策略</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["按颜色集中", "按尺码集中", "按工人负荷优先", "按熟练度优先"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-500"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-[11px] font-medium text-slate-400">
                  上述方法已包含在 AI 下拉规则中，点击后会直接回写到当前工序分配页，可继续手动微调。
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {allocatingTask && (
        <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-slate-950/72 px-6 text-center text-white backdrop-blur-sm">
          <div className="relative h-16 w-16">
            <span className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
            <span className="absolute inset-3 rounded-full bg-white/10" />
          </div>
          <div>
            <div className="text-lg font-black">{allocatingTask.title}</div>
            <div className="mt-2 text-sm font-medium text-white/80">{allocatingTask.description}</div>
          </div>
          <div className="grid w-full max-w-xs grid-cols-3 gap-2 text-[11px] font-medium text-white/70">
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">分析规则</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">计算数量</span>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1">回写结果</span>
          </div>
        </div>
      )}

      {editingCell && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/35 px-3 pb-3">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 px-4 py-4">
              <div className="text-base font-black text-slate-900">修改分配数量</div>
              <div className="mt-1 text-xs font-medium text-slate-500">
                {editingCell.rowId} / {editingCell.color} / {editingCell.size} / 总数 {editingCell.quantity}
              </div>
            </div>
            <div className="space-y-3 px-4 py-4">
              {workers.map((worker) => (
                <label key={worker.id} className="flex items-center gap-3">
                  <span className="w-16 text-sm font-bold text-slate-700">{worker.name}</span>
                  <input
                    type="number"
                    min={0}
                    className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 outline-none focus:border-slate-400"
                    value={draftAllocation[worker.id] ?? "0"}
                    onChange={(e) => setDraftAllocation((current) => ({ ...current, [worker.id]: e.target.value }))}
                  />
                </label>
              ))}
              <div className={`text-xs font-medium ${editingRemaining < 0 ? "text-red-500" : "text-slate-500"}`}>
                剩余可分配：{editingRemaining}
              </div>
            </div>
            <div className="flex gap-2 border-t border-slate-100 px-4 py-4">
              <button
                onClick={() => setEditingCellKey(null)}
                className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (!editingCell || editingRemaining < 0) return;
                  const nextMap = Object.fromEntries(
                    workers
                      .map((worker) => [worker.id, Math.max(0, Math.min(editingCell.quantity, Number(draftAllocation[worker.id] ?? 0) || 0))] as const)
                      .filter(([, qty]) => qty > 0)
                  );
                  pushHistory();
                  setCellAllocations(editingCell.key, nextMap);
                  setEditingCellKey(null);
                }}
                disabled={editingRemaining < 0}
                className={`flex-1 cursor-pointer rounded-xl py-2.5 text-sm font-bold text-white transition-all active:scale-95 ${
                  editingRemaining < 0 ? "bg-slate-300" : "bg-slate-900 hover:bg-slate-800 active:bg-slate-700"
                }`}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessDrawerOpen && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/35">
          <button onClick={() => setIsProcessDrawerOpen(false)} className="flex-1 cursor-default" aria-hidden="true" />
          <div className="flex h-full w-[280px] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div className="text-base font-black text-slate-900">选择工序</div>
              <button
                onClick={() => setIsProcessDrawerOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition-all hover:bg-slate-100 active:scale-95"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="space-y-2">
                {processOptions.map((process) => {
                  const isActive = process.id === selectedProcessId;
                  return (
                    <button
                      key={process.id}
                      onClick={() => {
                        attemptSelectProcess(process.id);
                        setIsProcessDrawerOpen(false);
                      }}
                      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-left transition-all hover:bg-slate-50 active:scale-[0.99] ${
                        isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
                      }`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                        {process.index}
                      </span>
                      <span className="text-sm font-bold">{process.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const THEME_LIST = [
  { id: 1, label: "方案一", desc: "折叠卡片" },
  { id: 2, label: "方案二", desc: "标签切换" },
  { id: 3, label: "方案三", desc: "抽屉弹出" },
  { id: 4, label: "方案四", desc: "时间轴" },
  { id: 5, label: "方案五", desc: "超大字" },
  { id: 6, label: "方案六", desc: "翻页工序" },
  { id: 7, label: "方案七", desc: "进度看板" },
  { id: 8, label: "方案八", desc: "以人为轴" },
  { id: 9, label: "方案九", desc: "颜色筛选" },
  { id: 10, label: "方案十", desc: "手套模式" },
  { id: 11, label: "方案十一", desc: "裁床分配" },
];

export default function Page() {
  const [active, setActive] = useState(1);
  const visibleThemes = THEME_LIST.filter((theme) => theme.id === 1 || theme.id === 11);
  return (
    <main className="min-h-screen bg-gray-200 flex flex-col items-center py-4 px-2">
      <h1 className="text-base font-bold text-gray-600 mb-2">工序分货 — 11套交互方案对比</h1>
      <div className="flex gap-1.5 mb-3 flex-wrap justify-center">
        {visibleThemes.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${active === t.id ? "bg-blue-600 text-white border-blue-600 shadow" : "bg-white text-gray-600 border-gray-300"}`}
          >
            {t.label} <span className="text-xs opacity-70">{t.desc}</span>
          </button>
        ))}
      </div>
      <div
        className="w-full rounded-2xl shadow-2xl overflow-hidden border-4 border-gray-800 relative"
        style={{ width: 390, height: 844, flexShrink: 0 }}
      >
        {active === 1 && <ThemeOne onOpenSchemeEleven={() => setActive(11)} />}
        {active === 2 && <ThemeTwo />}
        {active === 3 && <ThemeThree />}
        {active === 4 && <ThemeFour />}
        {active === 5 && <ThemeFive />}
        {active === 6 && <ThemeSix />}
        {active === 7 && <ThemeSeven />}
        {active === 8 && <ThemeEight />}
        {active === 9 && <ThemeNine />}
        {active === 10 && <ThemeTen />}
        {active === 11 && <ThemeElevenV5 />}
      </div>
    </main>
  );
}
