import styled from 'styled-components';
import { DesktopViewHeader } from '../../components/desktop/DesktopViewLayout';
import { Label2 } from '../../components/Text';
import { MultiSendTable } from '../../components/desktop/multi-send/MultiSendTable';
import { MultiSendList, useUserMultiSendLists } from '../../state/multiSend';
import { useNavigate, useParams } from 'react-router-dom';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';

const PageWrapper = styled.div`
    overflow: auto;
    position: relative;
    height: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
`;

const PageBodyWrapper = styled.div`
    padding: 0 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
`;

const MultiSendTableStyled = styled(MultiSendTable)`
    flex: 1;
`;

export const DesktopMultiSendFormPage = () => {
    const { id } = useParams();
    const { data: lists } = useUserMultiSendLists();
    const navigate = useNavigate();

    let list: MultiSendList | undefined = undefined;
    if (id !== undefined && lists) {
        list = lists.find(l => l.id === Number(id));

        if (!list) {
            list = {
                id: Number(id),
                name: `List ${id}`,
                token: TON_ASSET,
                form: {
                    rows: [
                        {
                            receiver: null,
                            amount: null,
                            comment: ''
                        },
                        {
                            receiver: null,
                            amount: null,
                            comment: ''
                        }
                    ]
                }
            };
        }
    }

    return (
        <PageWrapper>
            <DesktopViewHeader backButton>
                <Label2>{list?.name || ''}</Label2>
            </DesktopViewHeader>
            <PageBodyWrapper>
                {list && <MultiSendTableStyled list={list} onBack={() => navigate(-1)} />}
            </PageBodyWrapper>
        </PageWrapper>
    );
};
