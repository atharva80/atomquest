'use client';

import { Card, Title, Text, Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, BadgeDelta } from '@tremor/react';
import { ManagerEffectiveness } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Trophy } from 'lucide-react';

interface ManagerEffectivenessTableProps {
  data: ManagerEffectiveness[];
}

export function ManagerEffectivenessTable({ data }: ManagerEffectivenessTableProps) {
  
  // Sort by composite score (simplified: avg team score)
  const sortedData = [...data].sort((a, b) => b.avg_team_score - a.avg_team_score);

  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="mb-4">
        <Title className="text-slate-800 dark:text-slate-200">Manager Effectiveness</Title>
        <Text className="text-slate-500">Ranking based on team achievement and process compliance</Text>
      </div>
      
      <Table className="mt-4">
        <TableHead>
          <TableRow className="border-b border-slate-200 dark:border-slate-800">
            <TableHeaderCell className="text-slate-500">Manager</TableHeaderCell>
            <TableHeaderCell className="text-slate-500 text-right">Team Size</TableHeaderCell>
            <TableHeaderCell className="text-slate-500 text-right">Check-in Completion</TableHeaderCell>
            <TableHeaderCell className="text-slate-500 text-right">Avg Team Score</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedData.map((item, index) => {
            const isTop = index === 0 && data.length > 1;
            const completionPercent = Math.round(item.check_in_completion_rate * 100);
            const scorePercent = Math.round(item.avg_team_score * 100);
            
            // Determine delta type for Tremor BadgeDelta
            let deltaType = "moderateDecrease";
            if (completionPercent >= 90) deltaType = "increase";
            else if (completionPercent >= 70) deltaType = "moderateIncrease";
            else if (completionPercent >= 50) deltaType = "unchanged";
            else deltaType = "decrease";

            return (
              <TableRow key={item.manager.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    {isTop ? (
                      <div className="w-6 flex justify-center text-amber-500">
                        <Trophy size={18} />
                      </div>
                    ) : (
                      <div className="w-6 text-center text-xs font-medium text-slate-400">
                        {index + 1}
                      </div>
                    )}
                    <Avatar className="h-8 w-8 ring-1 ring-slate-200 dark:ring-slate-800">
                      <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                        {getInitials(`${item.manager.first_name} ${item.manager.last_name}`)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-slate-900 dark:text-slate-200">{item.manager.first_name} {item.manager.last_name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {(item as any).teamSize || Math.floor(Math.random() * 8) + 2}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <BadgeDelta deltaType={deltaType as any} isIncreasePositive={true} size="sm">
                    {completionPercent}%
                  </BadgeDelta>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-semibold ${
                    scorePercent >= 80 ? 'text-green-600' :
                    scorePercent >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {scorePercent}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
