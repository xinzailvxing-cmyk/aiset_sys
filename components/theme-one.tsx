"use client";

import { useState, useRef } from "react";
import { BATCH_ROWS, PROCESS_SECTIONS, PROCESSES, type ProcessStatus } from "./process-data";

function StatusBadge({ status }: { status: ProcessStatus }) {
  if (status === "可分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold text-white bg-green-500">
        可分货
      </div>
    );
  }
  if (status === "已分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-bold text-white bg-orange-400">
        已分货
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200">
      不可分
    </div>
  );
}

export default function ThemeOne() {
  const [mode, setMode] = useState<"avg" | "total">("avg");
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col h-full bg-gray-50 font-sans" style={{ minHeight: "780px" }}>
      {/* 顶部导航 */}
      <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between">
        <button className="text-base font-medium">← 返回</button>
        <span className="text-lg font-bold">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 模式切换 */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setMode("avg")}
          className={`flex-1 py-2 rounded text-base font-bold transition-all ${mode === "avg" ? "bg-green-500 text-white shadow" : "bg-gray-100 text-gray-600"}`}
        >
          平均分配
        </button>
        <button
          onClick={() => setMode("total")}
          className={`flex-1 py-2 rounded text-base font-bold transition-all ${mode === "total" ? "bg-green-500 text-white shadow" : "bg-gray-100 text-gray-600"}`}
        >
          填总数
        </button>
        <div className="flex gap-1 ml-auto">
          <button className="px-3 py-2 rounded bg-gray-100 text-gray-600 text-sm font-medium">清除</button>
          <button className="px-3 py-2 rounded bg-blue-500 text-white text-sm font-bold">按扎号排序</button>
        </div>
      </div>

      {/* 批次列表 + 工序横向滚动 */}
      <div className="bg-white border-b border-gray-200">
        {/* 表头 */}
        <div className="flex items-center px-3 py-1.5 bg-gray-100 border-b border-gray-200">
          <div className="w-20 text-sm font-bold text-gray-600">匹号/尺码</div>
          <div className="w-12 text-sm font-bold text-gray-600 text-center">总数</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p) => (
                <div key={p} className="w-16 text-sm font-bold text-gray-600 text-center flex-shrink-0">{p}</div>
              ))}
            </div>
          </div>
        </div>
        {/* 数据行 */}
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 py-2 border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="w-20">
              <span className="text-red-500 text-lg font-black">{row.matchNo}</span>
              <div className="text-xs text-gray-500">{row.colorSize}</div>
            </div>
            <div className="w-12 text-center text-base font-bold text-gray-800">{row.total}</div>
            <div className="flex-1 overflow-x-auto" ref={i === 0 ? scrollRef : undefined}>
              <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
                {row.processStatuses.map((s, j) => (
                  <StatusBadge key={j} status={s} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 工序分货明细 */}
      <div className="flex-1 overflow-y-auto px-3 pt-3 pb-20 space-y-3">
        {PROCESS_SECTIONS.map((section, si) => (
          <div key={si} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-green-50 px-3 py-2 border-b border-green-200">
              <span className="text-base font-black text-green-800">工序名：{section.processName}</span>
              <span className="ml-2 text-sm text-gray-500">（共 {section.totalBundles} 扎 {section.totalPieces} 件）</span>
            </div>
            {section.workers.map((worker, wi) => (
              <div key={wi} className="px-3 py-2 border-b border-gray-100 last:border-0">
                <div className="text-sm font-bold text-orange-500 mb-1.5">
                  {worker.name}（共 {worker.bundles} 扎 <span className="text-red-500">{worker.pieces}</span> 件）
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {worker.items.map((item, ii) => (
                    <div key={ii} className="bg-gray-50 rounded px-1.5 py-1 text-sm">
                      <span className="text-red-500 font-bold">{item.no}</span>
                      <span className="text-gray-500">({ii + 1}).{item.color}/{item.size}:{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部保存栏 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 bg-green-500 text-white text-lg font-black rounded-lg shadow mr-3">
          保存
        </button>
        <div className="text-sm text-gray-600 text-right">
          已录中：共 <span className="text-red-500 font-bold text-base">5</span> 扎{" "}
          <span className="text-red-500 font-bold text-base">40</span> 件
        </div>
      </div>
    </div>
  );
}
