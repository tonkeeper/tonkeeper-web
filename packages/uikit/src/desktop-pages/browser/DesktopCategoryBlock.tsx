import { PromotionCategory } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { FC } from 'react';
import styled from 'styled-components';
import { Label1, Label2 } from '../../components/Text';
import { useElementSize } from '../../hooks/useElementSize';

import { DesktopCategoryGroupItem } from './DesktopPromotedItem';
import { useDisclosure } from '../../hooks/useDisclosure';
import { DesktopCategoryModal } from './DesktopCategoryModal';

const Heading = styled.div`
    height: 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem 0 1rem;
    gap: 1rem;
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
    width: 100%;
    margin-bottom: 0.5rem;
`;

const AllButton = styled.button`
    border: none;
    background: transparent;
    height: fit-content;
    width: fit-content;
    color: ${props => props.theme.textAccent};
    cursor: pointer;
    padding: 4px 8px;
`;

const ListContainer = styled.div`
    padding-left: 1rem;
    padding-right: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    grid-template-rows: auto auto;
    overflow: hidden;
    grid-auto-rows: 0;
`;

export const DesktopCategoryBlock: FC<{
    category: PromotionCategory;
    className?: string;
    hideDivider?: boolean;
}> = ({ category, className, hideDivider }) => {
    const [containerRef, { scrollHeight, height }] = useElementSize();
    const canExpand = scrollHeight > height;
    const { isOpen, onClose, onOpen } = useDisclosure(false);

    return (
        <div className={className}>
            {!hideDivider && <Divider />}
            <Heading>
                <Label2>{category.title}</Label2>
                {canExpand && (
                    <AllButton onClick={onOpen}>
                        <Label1>All</Label1>
                    </AllButton>
                )}
            </Heading>
            <ListContainer ref={containerRef}>
                {category.apps.map(item => (
                    <DesktopCategoryGroupItem key={item.url} item={item} />
                ))}
            </ListContainer>
            <DesktopCategoryModal category={category} isOpen={isOpen} onClose={onClose} />
        </div>
    );
};
