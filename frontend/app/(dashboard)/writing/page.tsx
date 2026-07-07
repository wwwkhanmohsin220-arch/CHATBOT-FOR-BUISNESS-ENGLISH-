"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { useState } from "react";
import { Mail, FileText, MessageSquare, ClipboardList, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const filters = ["All", "Emails", "Reports", "Messages", "Proposals"];

const writingTasks = [
  {
    id: "1",
    title: "Write a follow-up email after a client meeting",
    category: "Emails",
    level: "Intermediate",
    duration: "~10 min",
    description: "Practice writing a professional follow-up email after a client meeting.",
    icon: Mail,
  },
  {
    id: "2",
    title: "Summarize meeting action items",
    category: "Reports",
    level: "Beginner",
    duration: "~8 min",
    description: "Practice organizing and communicating next steps clearly.",
    icon: FileText,
  },
  {
    id: "3",
    title: "Respond to an upset customer",
    category: "Messages",
    level: "Intermediate",
    duration: "~12 min",
    description: "Learn to express empathy and offer solutions in a chat format.",
    icon: MessageSquare,
  },
  {
    id: "4",
    title: "Draft a project proposal executive summary",
    category: "Proposals",
    level: "Advanced",
    duration: "~15 min",
    description: "Condense complex project details into a compelling summary.",
    icon: ClipboardList,
  },
  {
    id: "5",
    title: "Decline a meeting invitation politely",
    category: "Emails",
    level: "Beginner",
    duration: "~5 min",
    description: "Learn how to say no professionally without burning bridges.",
    icon: Mail,
  }
];

export default function WritingPracticeDashboard() {
  const [activeFilter, setActiveFilter] = useState("All");

  const filteredTasks = activeFilter === "All" 
    ? writingTasks 
    : writingTasks.filter(t => t.category === activeFilter);

  return (
    <main className="flex-1 p-8">
      <div className="max-w-[800px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-6 text-left">
          <h2 className="text-[32px] leading-[40px] tracking-[-0.02em] font-bold text-white mb-2">
            Writing practice
          </h2>
          <p className="text-[14px] text-[#A0A0AB]">
            Improve your professional writing with AI-reviewed exercises.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-row flex-wrap gap-2 mb-6">
          {filters.map((filter) => (
            <button 
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "h-[36px] px-4 rounded-full text-[13px] font-medium transition-colors",
                activeFilter === filter 
                  ? "bg-[#818CF8]/10 text-[#818CF8]" 
                  : "bg-transparent text-[#A0A0AB] hover:bg-[#26262F]"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Task Cards Stack */}
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => (
            <div 
              key={task.id} 
              className="bg-[#131318] border border-[#242430] rounded-[14px] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#3F3F4E] transition-colors group cursor-pointer"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <task.icon size={18} className="text-[#818CF8]" />
                  <h3 className="font-semibold text-[16px] text-white">
                    {task.title}
                  </h3>
                </div>
                <div className="text-[13px] text-[#5F5F6B] mb-2">
                  {task.category} · {task.level} · {task.duration}
                </div>
                <p className="text-[14px] text-[#A0A0AB]">
                  {task.description}
                </p>
              </div>
              <button className="text-[#818CF8] text-[14px] font-medium group-hover:text-white transition-colors flex items-center gap-1">
                Start <ArrowRight size={16} className="group-hover:translate-x-1 duration-200" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </main>
  );
}
