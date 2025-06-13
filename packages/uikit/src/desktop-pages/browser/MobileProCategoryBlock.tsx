import { PromotedApp, PromotionCategory } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { FC } from 'react';
import styled from 'styled-components';
import { Body3, Label1, Label2 } from '../../components/Text';

import { useDisclosure } from '../../hooks/useDisclosure';
import { DesktopCategoryModal } from './DesktopCategoryModal';
import { useTranslation } from '../../hooks/translation';

const Heading = styled.div`
    height: 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.5rem 0 1rem;
    gap: 1rem;
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

const ListContainer = styled.div<{ $childrenNumber: number }>`
    padding-left: 12px;
    padding-right: 12px;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    justify-items: center;
    justify-content: space-between;
    overflow: hidden;
`;

const GroupItem = styled.div`
    padding: 8px 2px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 90px;
    overflow: hidden;

    > ${Body3} {
        color: ${p => p.theme.textSecondary};
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
    }

    > img {
        width: 64px;
        height: 64px;
        border-radius: ${p => p.theme.cornerSmall};
        margin: 0 auto;
    }
`;

export const MobileProCategoryBlock: FC<{
    category: PromotionCategory;
    className?: string;
    onClickApp: (app: PromotedApp) => void;
}> = ({ category, className, onClickApp }) => {
    const { isOpen, onClose, onOpen } = useDisclosure(false);
    const { t } = useTranslation();

    return (
        <div className={className}>
            <Heading>
                <Label2>{category.title}</Label2>
                <AllButton onClick={onOpen}>
                    <Label1>{t('browser_apps_all')}</Label1>
                </AllButton>
            </Heading>
            <ListContainer $childrenNumber={category.apps.length}>
                {getAppsToDisplay(category.apps).map(item => (
                    <GroupItem key={item.url} onClick={() => onClickApp(item)}>
                        <img src={item.icon} />
                        <Body3>{item.name}</Body3>
                    </GroupItem>
                ))}
            </ListContainer>
            <DesktopCategoryModal category={category} isOpen={isOpen} onClose={onClose} />
        </div>
    );
};

export const MobileProAppsBlock: FC<{
    apps: PromotedApp[];
    className?: string;
    onClickApp: (app: PromotedApp) => void;
}> = ({ apps, onClickApp, className }) => {
    return (
        <div className={className}>
            <ListContainer $childrenNumber={apps.length}>
                {getAppsToDisplay(apps).map(item => (
                    <GroupItem key={item.url} onClick={() => onClickApp(item)}>
                        <img src={item.icon} />
                        <Body3>{item.name}</Body3>
                    </GroupItem>
                ))}
            </ListContainer>
        </div>
    );
};

// Display exact 4 or 8 apps
function getAppsToDisplay(apps: PromotedApp[]) {
    if (apps.length >= 8) {
        return apps.slice(0, 8);
    }

    return apps.slice(0, 4);
}
