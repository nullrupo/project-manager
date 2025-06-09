import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

interface InvitationChartProps {
    data: any[];
    title: string;
    type: 'line' | 'pie' | 'bar';
}

export function InvitationChart({ data, title, type }: InvitationChartProps) {
    // For now, we'll show a placeholder since we don't have a charting library
    // In a real implementation, you'd use libraries like recharts, chart.js, or d3

    const renderPlaceholder = () => {
        const Icon = type === 'pie' ? PieChart : BarChart3;
        
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <Icon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Chart Visualization</p>
                    <p className="text-sm">
                        {type === 'line' && 'Line chart showing trends over time'}
                        {type === 'pie' && 'Pie chart showing distribution'}
                        {type === 'bar' && 'Bar chart showing comparisons'}
                    </p>
                    <div className="mt-4 text-xs">
                        Data points: {data.length}
                    </div>
                </div>
            </div>
        );
    };

    const renderDataSummary = () => {
        if (type === 'line') {
            const latest = data[0];
            const trend = data.length > 1 ? data[0]?.rate - data[1]?.rate : 0;
            
            return (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center">
                        <div className="text-2xl font-bold">{latest?.rate || 0}%</div>
                        <div className="text-xs text-muted-foreground">Latest Rate</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                            <TrendingUp className={`h-4 w-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(trend).toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">Change</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{data.reduce((sum, item) => sum + (item.total || 0), 0)}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                </div>
            );
        }

        if (type === 'pie') {
            const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
            
            return (
                <div className="space-y-2 mt-4 pt-4 border-t">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ 
                                        backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)` 
                                    }}
                                />
                                <span className="text-sm capitalize">{item.name}</span>
                            </div>
                            <div className="text-sm font-medium">
                                {item.value} ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                            </div>
                        </div>
                    ))}
                </div>
            );
        }

        return null;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription>
                    {type === 'line' && 'Tracking changes over time'}
                    {type === 'pie' && 'Distribution breakdown'}
                    {type === 'bar' && 'Comparative analysis'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {renderPlaceholder()}
                {renderDataSummary()}
            </CardContent>
        </Card>
    );
}
