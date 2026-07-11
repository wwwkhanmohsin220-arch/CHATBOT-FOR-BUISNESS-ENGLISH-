"use client";
/**
 * @ai-restriction
 * Primary Owner: Umer
 */
import { UnitCard, Unit } from "@/components/curriculum/UnitCard";

// Mock data to be replaced by API later
const mockCurriculum: Unit[] = [
  {
    id: "unit-1",
    title: "Unit 1: Professional Introductions",
    status: "completed",
    score: 92,
    completedLessons: 4,
    totalLessons: 4,
  },
  {
    id: "unit-2",
    title: "Unit 2: Email Communication",
    status: "completed",
    score: 85,
    completedLessons: 5,
    totalLessons: 5,
  },
  {
    id: "unit-3",
    title: "Unit 3: Meeting Communication",
    status: "in_progress",
    completedLessons: 3,
    totalLessons: 5,
    assessmentUnlocked: true,
    lessons: [
      { id: "l1", title: "Lesson 1: Structuring an Agenda", status: "completed" },
      { id: "l2", title: "Lesson 2: Opening and Chairing", status: "completed" },
      { id: "l3", title: "Lesson 3: Managing Interruptions", status: "completed" },
      { id: "l4", title: "Lesson 4: Disagreeing Politely", status: "current", href: "/lesson/unit3-lesson4" },
      { id: "l5", title: "Lesson 5: Closing and Action Items", status: "locked" },
    ]
  },
  {
    id: "unit-4",
    title: "Unit 4: Presentations",
    status: "locked",
    totalLessons: 6,
  }
];

export default function LearningPathPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6 md:p-16 relative">
      <div className="max-w-[720px] mx-auto w-full relative z-10 pb-24">
        <h1 className="text-[28px] leading-tight tracking-tight font-bold text-white mb-10">
          Learning path
        </h1>

        <div className="relative pl-12">
          {/* Global Path Line Background */}
          <div className="absolute left-[15px] top-[20px] bottom-[40px] w-[2px] bg-[#242430] z-0" />

          {mockCurriculum.map((unit, index) => (
            <UnitCard 
              key={unit.id} 
              unit={unit} 
              isLast={index === mockCurriculum.length - 1} 
            />
          ))}
        </div>
      </div>
    </main>
  );
}
