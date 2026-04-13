"use client";

import { useState } from "react";
import { BATCH_ROWS, PROCESS_SECTIONS, PROCESSES, type ProcessStatus } from "./process-data";

function StatusBadge({ status }: { status: ProcessStatus }) {
  if (status === "可分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded-full text-sm font-bold text-white bg-green-500 shadow-sm">
        可分货
      </div>
    );
  }
  if (status === "已分货") {
    return (
      <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded-full text-sm font-bold text-white bg-orange-500 shadow-sm">
        已分货
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-16 h-9 flex items-center justify-center rounded-full text-sm font-medium text-orange-200 bg-orange-100 border border-orange-200">
      不可分
    </div>
  );
}

export default function ThemeThree() {
  const [mode, setMode] = useState<"avg" | "total">("avg");

  return (
    <div className="flex flex-col font-sans" style={{ minHeight: "780px", background: "#FFF8F3" }}>
      {/* 顶部导航 */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: "#FF6B35" }}>
        <button className="text-base font-medium text-white">← 返回</button>
        <span className="text-lg font-bold text-white tracking-wide">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 模式切换 */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-b-2" style={{ borderColor: "#FF6B35" }}>
        <button
          onClick={() => setMode("avg")}
          className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${mode === "avg" ? "text-white shadow" : "bg-orange-50 text-orange-400"}`}
          style={mode === "avg" ? { background: "#FF6B35" } : {}}
        >
          平均分配
        </button>
        <button
          onClick={() => setMode("total")}
          className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-all ${mode === "total" ? "text-white shadow" : "bg-orange-50 text-orange-400"}`}
          style={mode === "total" ? { background: "#FF6B35" } : {}}
        >
          填总数
        </button>
        <div className="flex gap-1 ml-1">
          <button className="px-2 py-2 rounded bg-orange-50 text-orange-500 text-sm font-medium border border-orange-200">清除</button>
          <button className="px-2 py-2 rounded text-white text-sm font-bold" style={{ background: "#FF6B35" }}>按扎号排序</button>
        </div>
      </div>

      {/* 批次+工序 */}
      <div className="bg-white border-b-2" style={{ borderColor: "#FFD5C2" }}>
        <div className="flex items-center px-3 py-1.5 bg-orange-50 border-b border-orange-100">
          <div className="w-20 text-sm font-bold text-orange-700">匹号/尺码</div>
          <div className="w-12 text-sm font-bold text-orange-700 text-center">总数</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p) => (
                <div key={p} className="w-16 text-sm font-bold text-orange-700 text-center flex-shrink-0">{p}</div>
              ))}
            </div>
          </div>
        </div>
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 py-2.5 border-b border-orange-50 ${i % 2 === 0 ? "bg-white" : "bg-orange-50/40"}`}>
            <div className="w-20">
              <span className="text-2xl font-black" style={{ color: "#FF6B35" }}>{row.matchNo}</span>
              <div className="text-xs text-gray-400 mt-0.5">{row.colorSize}</div>
            </div>
            <div className="w-12 text-center text-lg font-black text-gray-800">{row.total}</div>
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
          <div key={si} className="bg-white rounded-xl overflow-hidden shadow-sm border border-orange-100">
            <div className="px-3 py-2 flex items-center" style={{ background: "#FF6B35" }}>
              <span className="text-base font-black text-white">工序：{section.processName}</span>
              <span className="ml-2 text-sm text-orange-100">（{section.totalBundles} 扎 {section.totalPieces} 件）</span>
            </div>
            {section.workers.map((worker, wi) => (
              <div key={wi} className="px-3 py-2 border-b border-orange-50 last:border-0">
                <div className="text-sm font-bold mb-1.5" style={{ color: "#FF6B35" }}>
                  {worker.name}（{worker.bundles} 扎 <span className="text-red-500 text-base font-black">{worker.pieces}</span> 件）
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {worker.items.map((item, ii) => (
                    <div key={ii} className="bg-orange-50 rounded-lg px-1.5 py-1 text-sm border border-orange-100">
                      <span className="font-black" style={{ color: "#FF6B35" }}>{item.no}</span>
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t-2 border-orange-200 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3 text-white text-lg font-black rounded-xl shadow mr-3" style={{ background: "#FF6B35" }}>
          保存
        </button>
        <div className="text-sm text-gray-500 text-right">
          已录中：共 <span className="font-black text-base" style={{ color: "#FF6B35" }}>5</span> 扎{" "}
          <span className="font-black text-base" style={{ color: "#FF6B35" }}>40</span> 件
        </div>
      </div>
    </div>
  );
}
