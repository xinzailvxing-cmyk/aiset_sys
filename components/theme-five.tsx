"use client";

import { useState } from "react";
import { BATCH_ROWS, PROCESS_SECTIONS, PROCESSES, type ProcessStatus } from "./process-data";

function StatusBadge({ status }: { status: ProcessStatus }) {
  if (status === "可分货") {
    return (
      <div className="flex-shrink-0 w-16 h-10 flex items-center justify-center rounded-lg text-base font-black text-white bg-green-600 shadow">
        可分货
      </div>
    );
  }
  if (status === "已分货") {
    return (
      <div className="flex-shrink-0 w-16 h-10 flex items-center justify-center rounded-lg text-base font-black text-white bg-red-500 shadow">
        已分货
      </div>
    );
  }
  return (
    <div className="flex-shrink-0 w-16 h-10 flex items-center justify-center rounded-lg text-base font-medium text-gray-300 bg-gray-200">
      不可分
    </div>
  );
}

export default function ThemeFive() {
  const [mode, setMode] = useState<"avg" | "total">("avg");

  return (
    <div className="flex flex-col bg-white font-sans" style={{ minHeight: "780px" }}>
      {/* 顶部导航 */}
      <div className="bg-black px-4 py-3.5 flex items-center justify-between">
        <button className="text-lg font-bold text-white">← 返回</button>
        <span className="text-xl font-black text-white tracking-wider">工序分货</span>
        <div className="w-16" />
      </div>

      {/* 模式切换 */}
      <div className="bg-gray-100 px-3 py-2.5 flex items-center gap-2 border-b-2 border-gray-300">
        <button
          onClick={() => setMode("avg")}
          className={`flex-1 py-3 rounded-lg text-lg font-black transition-all ${mode === "avg" ? "bg-black text-white shadow" : "bg-white text-gray-500 border-2 border-gray-300"}`}
        >
          平均分配
        </button>
        <button
          onClick={() => setMode("total")}
          className={`flex-1 py-3 rounded-lg text-lg font-black transition-all ${mode === "total" ? "bg-black text-white shadow" : "bg-white text-gray-500 border-2 border-gray-300"}`}
        >
          填总数
        </button>
        <div className="flex gap-1 ml-1">
          <button className="px-3 py-2.5 rounded-lg bg-white text-gray-600 text-base font-bold border-2 border-gray-300">清除</button>
          <button className="px-3 py-2.5 rounded-lg bg-black text-white text-base font-black">按扎号</button>
        </div>
      </div>

      {/* 批次表格 */}
      <div className="border-b-2 border-gray-300">
        <div className="flex items-center px-3 py-2 bg-gray-900">
          <div className="w-20 text-base font-black text-gray-300">匹号/尺码</div>
          <div className="w-14 text-base font-black text-gray-300 text-center">总数</div>
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 pl-2" style={{ minWidth: "max-content" }}>
              {PROCESSES.map((p) => (
                <div key={p} className="w-16 text-sm font-black text-gray-300 text-center flex-shrink-0">{p}</div>
              ))}
            </div>
          </div>
        </div>
        {BATCH_ROWS.map((row, i) => (
          <div key={i} className={`flex items-center px-3 py-3 border-b-2 border-gray-200 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="w-20">
              <span className="text-3xl font-black text-red-600">{row.matchNo}</span>
              <div className="text-sm text-gray-400 font-medium mt-0.5">{row.colorSize}</div>
            </div>
            <div className="w-14 text-center text-2xl font-black text-gray-900">{row.total}</div>
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
          <div key={si} className="bg-white rounded-xl overflow-hidden border-2 border-gray-900 shadow">
            <div className="px-3 py-3 bg-gray-900 flex items-center">
              <span className="text-lg font-black text-white">工序：{section.processName}</span>
              <span className="ml-2 text-base text-gray-300">（{section.totalBundles} 扎 <span className="text-green-400 font-black text-lg">{section.totalPieces}</span> 件）</span>
            </div>
            {section.workers.map((worker, wi) => (
              <div key={wi} className="px-3 py-3 border-b-2 border-gray-200 last:border-0">
                <div className="text-base font-black text-gray-800 mb-2">
                  {worker.name}
                  <span className="ml-2 text-gray-500 font-medium">{worker.bundles} 扎</span>
                  <span className="ml-1 text-red-600 font-black text-xl">{worker.pieces}</span>
                  <span className="text-gray-500 font-medium"> 件</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {worker.items.map((item, ii) => (
                    <div key={ii} className="bg-gray-100 rounded-lg px-2 py-1.5 text-center border border-gray-200">
                      <div className="text-lg font-black text-gray-900">{item.no}</div>
                      <div className="text-xs text-gray-500">{item.color}/{item.size}</div>
                      <div className="text-base font-black text-red-600">{item.qty}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* 底部 */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t-4 border-gray-900 px-4 py-2 flex items-center justify-between">
        <button className="flex-1 py-3.5 bg-black text-white text-xl font-black rounded-xl shadow-lg mr-3 tracking-widest">
          保存
        </button>
        <div className="text-base text-gray-600 font-medium text-right">
          已录中：共{" "}
          <span className="text-red-600 font-black text-2xl">5</span>{" "}
          扎{" "}
          <span className="text-red-600 font-black text-2xl">40</span>{" "}
          件
        </div>
      </div>
    </div>
  );
}
