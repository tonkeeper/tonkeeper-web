import { Cell, Pie, PieChart } from 'recharts';
import { useAssetsDistribution } from '../../../state/wallet';
import { useMemo } from 'react';
import styled from 'styled-components';

const Container = styled.div`
    padding: 20px;
    path {
        stroke: transparent !important;
    }

    * {
        outline: none;
    }

    .recharts-tooltip-wrapper {
        outline: none;
    }
`;

export const TokensPieChart = () => {
    const { data: distribution } = useAssetsDistribution();

    const chartData = useMemo(() => {
        if (!distribution) {
            return [];
        }

        return distribution.map(d => {
            return {
                name: 'type' in d.meta ? 'Others' : d.meta.name,
                value: d.fiatBalance.toNumber()
            };
        });
    }, [distribution]);

    if (!distribution) {
        return null;
    }

    return (
        <Container>
            <PieChart width={160} height={160}>
                <Pie
                    data={chartData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={distribution[index].meta.color}
                            stroke="transparent"
                        />
                    ))}
                </Pie>
            </PieChart>
        </Container>
    );
};
