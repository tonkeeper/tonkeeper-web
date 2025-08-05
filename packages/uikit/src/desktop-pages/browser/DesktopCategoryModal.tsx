import { Notification } from '../../components/Notification';
import React, { FC } from 'react';
import { PromotedApp, PromotionCategory } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { DesktopCategoryGroupItem } from './DesktopPromotedItem';
import styled from 'styled-components';

const DesktopCategoryGroupItemStyled = styled(DesktopCategoryGroupItem)`
    margin: 0 -1rem;
    width: calc(100% + 2rem);
    border-radius: 0;
    padding-left: 0.5rem;
    padding-right: 0.75rem;
`;

export const DesktopCategoryModal: FC<{
    category: PromotionCategory;
    isOpen: boolean;
    onClose: () => void;
    onClickApp?: (app: PromotedApp) => void;
}> = ({ category, isOpen, onClose, onClickApp }) => {
    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={category.title} onTopOfBrowser>
            {() =>
                category.apps.map(app => (
                    <DesktopCategoryGroupItemStyled
                        item={app}
                        key={app.url}
                        onClickApp={onClickApp ? () => onClickApp(app) : undefined}
                    />
                ))
            }
        </Notification>
    );
};
