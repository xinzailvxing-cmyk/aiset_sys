// 共享的工序分货数据模型

export interface WorkerItem {
  no: string; // 扎号
  color: string;
  size: string;
  qty: number;
}

export interface WorkerGroup {
  name: string; // 师傅名，如"好多鱼"
  bundles: number;
  pieces: number;
  items: WorkerItem[];
}

export interface ProcessSection {
  processName: string; // 工序名，如"三针"
  totalBundles: number;
  totalPieces: number;
  workers: WorkerGroup[];
}

export interface BatchRow {
  matchNo: string;    // 匹号/扎号
  colorSize: string;  // 颜色/尺码
  total: number;
  processStatuses: ProcessStatus[]; // 每道工序状态
}

export type ProcessStatus = "可分货" | "已分货" | "不可分";

// 6道工序
export const PROCESSES = ["三针", "锁边", "贴袋", "装拉链", "熨烫整理", "质检包装"];

// 批次列表数据
export const BATCH_ROWS: BatchRow[] = [
  {
    matchNo: "1(1).",
    colorSize: "1/27",
    total: 23,
    processStatuses: ["可分货", "可分货", "已分货", "不可分", "不可分", "不可分"],
  },
  {
    matchNo: "2(3).",
    colorSize: "2/27",
    total: 21,
    processStatuses: ["已分货", "已分货", "可分货", "可分货", "不可分", "不可分"],
  },
  {
    matchNo: "1(2).",
    colorSize: "1/28",
    total: 9,
    processStatuses: ["可分货", "可分货", "可分货", "不可分", "不可分", "不可分"],
  },
];

// 工序分货明细
export const PROCESS_SECTIONS: ProcessSection[] = [
  {
    processName: "三针",
    totalBundles: 16,
    totalPieces: 160,
    workers: [
      {
        name: "好多鱼",
        bundles: 8,
        pieces: 80,
        items: [
          { no: "1", color: "蓝色", size: "S", qty: 10 },
          { no: "3", color: "蓝色", size: "S", qty: 10 },
          { no: "5", color: "蓝色", size: "S", qty: 10 },
          { no: "7", color: "蓝色", size: "S", qty: 10 },
          { no: "9", color: "蓝色", size: "S", qty: 10 },
          { no: "11", color: "蓝色", size: "S", qty: 10 },
          { no: "13", color: "蓝色", size: "S", qty: 10 },
          { no: "15", color: "蓝色", size: "S", qty: 10 },
        ],
      },
      {
        name: "张师傅",
        bundles: 8,
        pieces: 80,
        items: [
          { no: "2", color: "蓝色", size: "S", qty: 10 },
          { no: "4", color: "蓝色", size: "S", qty: 10 },
          { no: "6", color: "蓝色", size: "S", qty: 10 },
          { no: "8", color: "蓝色", size: "S", qty: 10 },
          { no: "10", color: "蓝色", size: "S", qty: 10 },
          { no: "12", color: "蓝色", size: "S", qty: 10 },
          { no: "14", color: "蓝色", size: "S", qty: 10 },
          { no: "16", color: "蓝色", size: "S", qty: 10 },
        ],
      },
    ],
  },
  {
    processName: "锁边",
    totalBundles: 16,
    totalPieces: 160,
    workers: [
      {
        name: "李大姐",
        bundles: 8,
        pieces: 80,
        items: [
          { no: "1", color: "红色", size: "M", qty: 10 },
          { no: "3", color: "红色", size: "M", qty: 10 },
          { no: "5", color: "红色", size: "M", qty: 10 },
          { no: "7", color: "红色", size: "M", qty: 10 },
          { no: "9", color: "红色", size: "M", qty: 10 },
          { no: "11", color: "红色", size: "M", qty: 10 },
          { no: "13", color: "红色", size: "M", qty: 10 },
          { no: "15", color: "红色", size: "M", qty: 10 },
        ],
      },
    ],
  },
  {
    processName: "贴袋",
    totalBundles: 12,
    totalPieces: 120,
    workers: [
      {
        name: "王师傅",
        bundles: 6,
        pieces: 60,
        items: [
          { no: "1", color: "白色", size: "L", qty: 10 },
          { no: "3", color: "白色", size: "L", qty: 10 },
          { no: "5", color: "白色", size: "L", qty: 10 },
          { no: "7", color: "白色", size: "L", qty: 10 },
          { no: "9", color: "白色", size: "L", qty: 10 },
          { no: "11", color: "白色", size: "L", qty: 10 },
        ],
      },
    ],
  },
];
