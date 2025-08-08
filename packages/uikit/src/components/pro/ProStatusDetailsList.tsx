import styled from 'styled-components';

import { Body2 } from '../Text';
import { SkeletonList } from '../Skeleton';
import { useProState } from '../../state/pro';
import { ListBlock, ListItem, ListItemPayload } from '../List';
import { useProStatusDetailsDisplayData } from '../../hooks/pro/useProStatusDetailsDisplayData';

export const ProStatusDetailsList = () => {
    const { data: subscription, isLoading } = useProState();
    const listItems = useProStatusDetailsDisplayData(subscription);

    if (isLoading) {
        return <SkeletonList fullWidth size={3} />;
    }

    return (
        <ListBlock margin={false} fullWidth>
            {Object.entries(listItems).map(([title, props]) => {
                const { isVisible = true, value, ...restProps } = props;

                return (
                    isVisible && (
                        <ListItemStyled key={title} hover={false}>
                            <ListItemPayloadStyled>
                                <Body2RegularStyled>{title}</Body2RegularStyled>
                                <Body2Styled {...restProps}>{value}</Body2Styled>
                            </ListItemPayloadStyled>
                        </ListItemStyled>
                    )
                );
            })}
        </ListBlock>
    );
};

const Body2Styled = styled(Body2)<{
    color?: 'accentOrange' | 'textSecondary';
    textTransform?: 'uppercase';
}>`
    color: ${({ theme, color }) => (color ? theme[color] : theme.textPrimary)};
    text-transform: ${({ textTransform }) => textTransform ?? 'capitalize'};
`;

const Body2RegularStyled = styled(Body2Styled)`
    color: ${({ theme }) => theme.textSecondary};
    font-weight: 400;
    text-transform: capitalize;
`;

const ListItemStyled = styled(ListItem)`
    &:not(:first-child) > div {
        padding-top: 10px;
    }
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    padding-top: 10px;
    padding-bottom: 10px;
`;
