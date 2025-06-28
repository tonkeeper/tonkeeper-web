import { ListBlock, ListItem, ListItemPayload } from '../List';
import { Body2 } from '../Text';
import styled from 'styled-components';

// TODO Implement real Query
const TEMP_MOCK_DATA = {
    status: 'active',
    expirationDate: '2024-12-31',
    Price: '$2.99'
};

export const ProStatusDetailsList = () => {
    return (
        <ListBlock margin={false} fullWidth>
            {Object.entries(TEMP_MOCK_DATA).map(([key, value]) => (
                <ListItemStyled key={key}>
                    <ListItemPayloadStyled>
                        <Body2Styled>{key}</Body2Styled>
                        <Body2>{value}</Body2>
                    </ListItemPayloadStyled>
                </ListItemStyled>
            ))}
        </ListBlock>
    );
};

const Body2Styled = styled(Body2)`
    color: ${({ theme }) => theme.textSecondary};
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
