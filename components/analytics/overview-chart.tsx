'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface OverviewChartProps {
  data: {
    name: string;
    count: number;
    value: number;
  }[];
}

export function OverviewChart({ data }: OverviewChartProps) {
  if (!data || data.length === 0) {
    return (
                      </span >
                    </div >
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Quantidade
                      </span>
                      <span className="font-bold">
                        {payload[0].value}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                        Valor Total
                      </span>
                      <span className="font-bold">
                        ${Number(payload[0].payload.value).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div >
                </div >
              );
  }
  return null;
}}
        />
  < Legend />
  <Bar
    dataKey="count"
    fill="hsl(var(--primary))"
    radius={[4, 4, 0, 0]}
    name="Qtd. Negócios"
  />
      </BarChart >
    </ResponsiveContainer >
  );
}
