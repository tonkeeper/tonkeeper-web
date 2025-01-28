import { FC, PropsWithChildren } from 'react';
import styled from 'styled-components';
import { DesktopViewPageLayout } from '../desktop/DesktopViewLayout';

const Wrapper = styled(DesktopViewPageLayout)``;

export const MobileProPageAdapter: FC<PropsWithChildren> = ({ children }) => {
    return <Wrapper>{children}</Wrapper>;
};
