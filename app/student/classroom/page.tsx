"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Badge, SkeletonCard } from "@/components/ui";

export default function StudentClassroomPage() {
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/student/classroom")
      .then((response) => response.json())
      .then(setData)
      .catch(() => setData({ classrooms: [] }));
  }, []);

  return (
    <AppShell title="Classroom" subtitle="See your enrolled classes and the quizzes assigned in each one.">
      <div className="content grid">
        {!data ? (
          <div className="grid grid-2">{Array.from({ length: 2 }).map((_, index) => <SkeletonCard key={index} lines={4} />)}</div>
        ) : (
          <div className="grid grid-2">
            {data.classrooms.map((classroom: any) => (
              <section className="card pad" key={classroom.id}>
                <div className="section-head">
                  <div>
                    <h2>{classroom.name}</h2>
                    <p className="muted">{classroom.subject} · {classroom.professor}</p>
                  </div>
                  <Badge tone={classroom.averagePerformance >= 70 ? "green" : "amber"}>{classroom.averagePerformance}% avg</Badge>
                </div>
                <p className="muted small">{classroom.quizCount} quizzes assigned</p>
                <div className="grid">
                  {classroom.assignedQuizzes.map((quiz: any) => (
                    <div className="row-item" key={quiz.id}>
                      <div>
                        <strong>{quiz.title}</strong>
                        <div className="muted small">{quiz.questions} questions · {quiz.duration} min</div>
                      </div>
                      <span className="spacer" />
                      <Link className="btn" href={`/quiz/${quiz.id}/instructions`}>Start</Link>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
