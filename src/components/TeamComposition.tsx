"use client";

import { TeamRole } from "@/lib/types";
import { Users } from "lucide-react";

interface TeamCompositionProps {
  team: TeamRole[];
}

export default function TeamComposition({ team }: TeamCompositionProps) {
  return (
    <section>
      <h3 className="text-xl font-semibold text-gray-900">
        Team Composition
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {team.map((member, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <h4 className="font-medium text-gray-900">{member.role}</h4>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                x{member.count}
              </span>
            </div>

            {member.responsibilities.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium uppercase text-gray-500">
                  Responsibilities
                </p>
                <ul className="mt-1 space-y-0.5">
                  {member.responsibilities.map((r, j) => (
                    <li key={j} className="text-sm text-gray-600">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {member.requiredSkills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.requiredSkills.map((skill, j) => (
                  <span
                    key={j}
                    className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
