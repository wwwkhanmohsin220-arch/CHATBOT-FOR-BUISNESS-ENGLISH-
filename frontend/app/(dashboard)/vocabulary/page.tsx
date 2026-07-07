"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { Search, Volume2, Bookmark, BookmarkCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const mockVocabulary = [
  {
    id: 1,
    word: "Leverage",
    part: "verb",
    definition: "To use something that you already have in order to achieve something new or better.",
    example: "We need to leverage our existing network to find new clients.",
    saved: true,
  },
  {
    id: 2,
    word: "Bandwidth",
    part: "noun",
    definition: "The energy or mental capacity required to deal with a situation.",
    example: "I don't have the bandwidth to take on another project this week.",
    saved: true,
  },
  {
    id: 3,
    word: "Pivot",
    part: "verb",
    definition: "To completely change the direction of a business or strategy.",
    example: "The startup had to pivot when their initial product didn't gain traction.",
    saved: false,
  },
  {
    id: 4,
    word: "Synergy",
    part: "noun",
    definition: "The combined power of a group of things when they are working together.",
    example: "There's a lot of synergy between our marketing and sales departments.",
    saved: true,
  },
  {
    id: 5,
    word: "Align",
    part: "verb",
    definition: "To bring into agreement or cooperation.",
    example: "Let's have a quick meeting to align on our goals for Q3.",
    saved: false,
  }
];

export default function VocabularyPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSaved, setFilterSaved] = useState(false);

  const filteredWords = mockVocabulary.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterSaved ? item.saved : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-12 relative w-full flex justify-center">
      <div className="w-full max-w-[840px] relative z-10 pb-24">
        
        {/* Header Area */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-[28px] md:text-[32px] leading-tight tracking-tight font-bold text-white mb-2">
              My Vocabulary
            </h1>
            <p className="text-[16px] text-[#c6c5d5]">
              Review and master the business terms you've encountered.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-[#131318] border border-[#242430] rounded-[10px] px-4 py-2 flex items-center justify-center">
              <span className="text-[20px] font-bold text-[#818cf8] mr-2">{mockVocabulary.length}</span>
              <span className="text-[12px] font-medium uppercase tracking-wider text-[#5f5f6b]">Words</span>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5f5f6b]" />
            <input 
              type="text" 
              placeholder="Search words or definitions..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#131318] border border-[#242430] rounded-[12px] h-12 pl-12 pr-4 text-[16px] text-[#e4e1e9] focus:border-[#818cf8] focus:ring-1 focus:ring-[#818cf8] outline-none transition-colors placeholder:text-[#52525B]"
            />
          </div>
          
          <div className="flex bg-[#131318] border border-[#242430] rounded-[12px] p-1 shrink-0">
            <button 
              onClick={() => setFilterSaved(false)}
              className={cn(
                "px-4 py-2 rounded-[8px] text-[14px] font-semibold transition-colors",
                !filterSaved ? "bg-[#26262f] text-white" : "text-[#5f5f6b] hover:text-[#c6c5d5]"
              )}
            >
              All Words
            </button>
            <button 
              onClick={() => setFilterSaved(true)}
              className={cn(
                "px-4 py-2 rounded-[8px] text-[14px] font-semibold transition-colors",
                filterSaved ? "bg-[#26262f] text-white" : "text-[#5f5f6b] hover:text-[#c6c5d5]"
              )}
            >
              Saved Only
            </button>
          </div>
        </div>

        {/* Word List */}
        <div className="flex flex-col gap-4">
          {filteredWords.length > 0 ? (
            filteredWords.map((item) => (
              <div 
                key={item.id} 
                className="bg-[#131318] border border-[#242430] rounded-[14px] p-6 hover:border-[#3F3F4E] transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6">
                  <button className="text-[#5f5f6b] hover:text-[#818cf8] transition-colors active:scale-90">
                    {item.saved ? <BookmarkCheck size={24} className="text-[#818cf8]" /> : <Bookmark size={24} />}
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-[22px] font-bold text-white tracking-tight">{item.word}</h3>
                  <span className="text-[12px] font-medium text-[#908f9e] italic bg-[#1f1f25] px-2 py-0.5 rounded border border-[#242430]">
                    {item.part}
                  </span>
                  <button className="text-[#5f5f6b] hover:text-white transition-colors">
                    <Volume2 size={16} />
                  </button>
                </div>
                
                <p className="text-[16px] text-[#e4e1e9] mb-4 pr-8">
                  {item.definition}
                </p>
                
                <div className="bg-[#1c1c23] border-l-[3px] border-[#818cf8] p-3 rounded-r-[8px]">
                  <p className="text-[14px] text-[#c6c5d5]">
                    <span className="text-[#818cf8] font-semibold mr-1">Example:</span> 
                    "{item.example}"
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-[#131318] border border-[#242430] rounded-[14px] border-dashed">
              <div className="w-16 h-16 rounded-full bg-[#1c1c23] flex items-center justify-center mx-auto mb-4 border border-[#242430]">
                <Search size={24} className="text-[#5f5f6b]" />
              </div>
              <h3 className="text-[18px] font-semibold text-white mb-2">No words found</h3>
              <p className="text-[14px] text-[#908f9e]">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
