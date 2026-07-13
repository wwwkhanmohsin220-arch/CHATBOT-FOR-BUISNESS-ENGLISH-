"use client";

import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

type Chunk = {
  content: string;
  source_title: string;
  distance: number;
};

type Question = {
  id: number;
  question: string;
  expected_lesson: string;
  retrieved_chunks: Chunk[];
};

export default function TunerPage() {
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchNext = async () => {
    setLoading(true);
    setComment("");
    setChunks([]);
    try {
      const res = await fetch(`${API_BASE_URL}/tuner/questions/next`);
      if (res.ok) {
        const data = await res.json();
        setCurrentQ(data);
        searchChunks(data.question);
      } else if (res.status === 404 || res.status === 204) {
        setCurrentQ(null);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const searchChunks = async (query: string) => {
    setSearching(true);
    try {
      const res = await fetch(`${API_BASE_URL}/qna/semantic-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 3 })
      });
      if (res.ok) {
        const data = await res.json();
        setChunks(data.results);
      }
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const submitEval = async (is_correct: boolean) => {
    if (!currentQ) return;
    try {
      await fetch(`${API_BASE_URL}/tuner/evaluate/${currentQ.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_correct,
          comment,
          retrieved_chunks: chunks,
        })
      });
      fetchNext();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNext();
  }, []);

  if (loading) return <div className="p-8 text-white">Loading next question...</div>;
  if (!currentQ) return <div className="p-8 text-white text-2xl">🎉 All done! No more questions to evaluate.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h1 className="text-3xl font-bold text-white">RAG Tuner (Dev Mode)</h1>
            <p className="text-slate-400 mt-1">Expected Lesson: <span className="text-sky-400 font-mono">{currentQ.expected_lesson}</span></p>
          </div>
          <div className="text-sm text-slate-500 font-mono">QID: {currentQ.id}</div>
        </header>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-medium text-white mb-2">Query:</h2>
          <p className="text-2xl font-serif text-slate-300">"{currentQ.question}"</p>
        </div>

        {searching ? (
          <div className="animate-pulse text-sky-400">Searching vector database...</div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-white border-b border-slate-800 pb-2">Top 3 Retrieved Chunks</h3>
            {chunks.map((chunk, i) => (
              <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-mono uppercase tracking-wider">
                  <span>Match #{i + 1}</span>
                  <span>Dist: {chunk.distance.toFixed(3)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap font-serif text-slate-300">
                  {chunk.content}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl mt-8">
          <h3 className="text-lg font-medium text-white">Evaluation</h3>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add an optional comment if something went wrong (e.g. 'Cut off mid-sentence', 'Wrong lesson retrieved')..."
            className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex gap-4">
            <button
              onClick={() => submitEval(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              ✅ Correct Context
            </button>
            <button
              onClick={() => submitEval(false)}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              ❌ Wrong / Incomplete Context
            </button>
            <button
              onClick={() => fetchNext()}
              className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-lg transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
