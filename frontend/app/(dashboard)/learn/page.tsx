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
    title: "Unit 1: The First Impression",
    status: "in_progress",
    completedLessons: 1,
    totalLessons: 3,
    lessons: [
      { id: "u1l1", title: "Lesson 1: Professional Introductions", status: "completed", href: "/lesson/u1l1" },
      { id: "u1l2", title: "Lesson 2: Small Talk with Clients", status: "current", href: "/lesson/u1l2" },
      { id: "u1l3", title: "Lesson 3: Exchanging Contact Info", status: "locked" }
    ]
  },
  {
    id: "unit-2",
    title: "Unit 2: Email Communication",
    status: "locked",
    totalLessons: 5,
  },
  {
    id: "unit-3",
    title: "Unit 3: Meeting Communication",
    status: "locked",
    totalLessons: 5,
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
