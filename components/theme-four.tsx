"use client";

import { useState } from "react";
import { BATCH_ROWS, PROCESS_SECTIONS, PROCESSES, type ProcessStatus } from "./process-data";

function StatusBadge({ status }: { status: ProcessStatus }) {
  if (status === "可分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold text-white bg-blue-600">
        可分货
      </div>
    );
  }
  if (status === "已分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold text-blue-800 bg-blue-200">
        已分货
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-medium text-gray-400 bg-gray-100 border border-dashed border-gray-300">
      不可分
    </div>
  );
}

export default function ThemeFour() {
  const [mode, setMode] = useState<"avg" | "total">("avg");

  return (
    <div className="flex flex-col bg-white font-sans" style={{ minHeight: "780px" }}>
      {/* 顶部导航 */}
      <div className="bg-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-bold tracking-wider">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 模式切换 */}
      <div className="bg-blue-50 px-3 py-2 flex items-center gap-2 border-b border-blue-200">
        <button
          onClick={() => setMode("avg")}
          className={`flex-1 py-2.5 rounded text-base font-bold transition-all ${mode === "avg" ? "bg-blue-700 text-white shadow" : "bg-white text-blue-500 border border-blue-200"}`}
        >
          平均分配
        </button>
        <button
          onClick={() => setMode("total")}
          className={`flex-1 py-2.5 rounded text-base font-bold transition-all ${mode === "total" ? "bg-blue-700 text-white shadow" : "bg-white text-blue-500 border border-blue-200"}`}
        >
          填总数
        </button>
        <div className="flex gap-1 ml-1">
          <button className="px-2 py-2 rounded bg-white text-gray-600 text-sm border border-gray-300">清除</button>
          <button className="px-2 py-2 rounded bg-blue-700 text-white text-sm font-bold">按扎号排序</button>
        </div>
      </div>

      {/* 批次表格 */}
      <div className="border-b-2 border-blue-200">
        <div className="flex items-center px-3 py-2 bg-blue-700">
          <div className="w-20 text-sm font-bold text-blue-100">匹号/尺码</div>
          <div className="w-12 text-sm font-bold text-blue-100 text-center">总数</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p) => (
                <div key={p} className="w-16 text-sm font-bold text-blue-100 text-center flex-shrink-0">{p}</div>
              ))}
            </div>
          </div>
        </div>
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 py-2.5 border-b border-blue-100 ${i % 2 === 0 ? "bg-white" : "bg-blue-50"}`}>
            <div className="w-20">
              <span className="text-2xl font-black text-red-600">{row.matchNo}</span>
              <div className="text-xs text-gray-400">{row.colorSize}</div>
            </div>
            <div className="w-12 text-center text-xl font-black text-blue-800">{row.total}</div>
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
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20 space-y-3 bg-gray-50">
        {PROCESS_SECTIONS.map((section, si) => (
          <div key={si} className="bg-white rounded-lg overflow-hidden border-l-4 border-blue-600 shadow-sm">
            <div className="px-3 py-2 bg-blue-700 flex items-center">
              <span className="text-base font-black text-white">工序：{section.processName}</span>
              <span className="ml-2 text-sm text-blue-200">（{section.totalBundles} 扎 {section.totalPieces} 件）</span>
            </div>
            {section.workers.map((worker, wi) => (
              <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
                <div className="text-sm font-bold text-blue-700 mb-1.5">
                  {worker.name}（{worker.bundles} 扎 <span className="text-red-600 text-base font-black">{worker.pieces}</span> 件）
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {worker.items.map((item, ii) => (
                    <div key={ii} className={`rounded px-1.5 py-1 text-sm ${ii % 2 === 0 ? "bg-blue-50" : "bg-gray-50"}`}>
                      <span className="text-blue-700 font-black">{item.no}</span>
                      <span className="text-gray-500">({ii + 1}).{item.color}:{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t-2 border-blue-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-blue-700 text-white text-lg font-black rounded-lg shadow mr-3">
          保存
        </button>
        <div className="text-sm text-gray-600 text-right">
          已录中：共 <span className="text-red-600 font-black text-base">5</span> 扎{" "}
          <span className="text-red-600 font-black text-base">40</span> 件
        </div>
      </div>
    </div>
  );
}
