"use client";

import { useState } from "react";
import { BATCH_ROWS, PROCESS_SECTIONS, PROCESSES, type ProcessStatus } from "./process-data";

function StatusBadge({ status }: { status: ProcessStatus }) {
  if (status === "可分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold text-white bg-emerald-500">
        可分货
      </div>
    );
  }
  if (status === "已分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold bg-amber-400 text-amber-900">
        已分货
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-medium text-gray-500 bg-gray-700">
      不可分
    </div>
  );
}

export default function ThemeTwo() {
  const [mode, setMode] = useState<"avg" | "total">("avg");

  return (
    <div className="flex flex-col bg-gray-900 text-gray-100 font-sans" style={{ minHeight: "780px" }}>
      {/* 顶部导航 */}
      <div className="bg-gray-800 px-4 py-3 flex items-center justify-between border-b border-gray-700">
        <button className="text-base font-medium text-gray-300">← 返回</button>
        <span className="text-lg font-bold text-white">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 模式切换 */}
      <div className="bg-gray-800 px-3 py-2 flex items-center gap-2 border-b border-gray-700">
        <button
          onClick={() => setMode("avg")}
          className={`flex-1 py-2 rounded text-base font-bold transition-all ${mode === "avg" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-400"}`}
        >
          平均分配
        </button>
        <button
          onClick={() => setMode("total")}
          className={`flex-1 py-2 rounded text-base font-bold transition-all ${mode === "total" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-400"}`}
        >
          填总数
        </button>
        <div className="flex gap-1 ml-auto">
          <button className="px-3 py-2 rounded bg-gray-700 text-gray-300 text-sm">清除</button>
          <button className="px-3 py-2 rounded bg-blue-600 text-white text-sm font-bold">按扎号排序</button>
        </div>
      </div>

      {/* 批次+工序横向滚动 */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center px-3 py-1.5 bg-gray-750 border-b border-gray-700">
          <div className="w-20 text-sm font-bold text-gray-400">匹号/尺码</div>
          <div className="w-12 text-sm font-bold text-gray-400 text-center">总数</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p) => (
                <div key={p} className="w-16 text-sm font-bold text-gray-400 text-center flex-shrink-0">{p}</div>
              ))}
            </div>
          </div>
        </div>
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 py-2 border-b border-gray-700 ${i % 2 === 0 ? "bg-gray-800" : "bg-gray-850"}`}>
            <div className="w-20">
              <span className="text-amber-400 text-lg font-black">{row.matchNo}</span>
              <div className="text-xs text-gray-500">{row.colorSize}</div>
            </div>
            <div className="w-12 text-center text-base font-bold text-white">{row.total}</div>
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
                {row.processStatuses.map((s, j) => (
                  <StatusBadge key={j} status={s} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 工序明细 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20 space-y-3">
        {PROCESS_SECTIONS.map((section, si) => (
          <div key={si} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
            <div className="bg-gray-750 px-3 py-2 border-b border-gray-600 flex items-center">
              <span className="text-base font-black text-emerald-400">工序：{section.processName}</span>
              <span className="ml-2 text-sm text-gray-400">（{section.totalBundles} 扎 {section.totalPieces} 件）</span>
            </div>
            {section.workers.map((worker, wi) => (
              <div key={wi} className="px-3 py-2 border-b border-gray-700 last:border-0">
                <div className="text-sm font-bold text-amber-400 mb-1.5">
                  {worker.name}（{worker.bundles} 扎 <span className="text-red-400 text-base">{worker.pieces}</span> 件）
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {worker.items.map((item, ii) => (
                    <div key={ii} className="bg-gray-700 rounded px-1.5 py-1 text-sm">
                      <span className="text-amber-400 font-bold">{item.no}</span>
                      <span className="text-gray-400">({ii + 1}).{item.color}:{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部保存 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-emerald-600 text-white text-lg font-black rounded-lg shadow mr-3">
          保存
        </button>
        <div className="text-sm text-gray-400 text-right">
          已录中：共 <span className="text-amber-400 font-bold text-base">5</span> 扎{" "}
          <span className="text-amber-400 font-bold text-base">40</span> 件
        </div>
      </div>
    </div>
  );
}
