import React, { FC, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { useAppSdk } from '../hooks/appSdk';
import { ActivityHeader, SettingsHeader } from './Header';
import { ActionsRow } from './home/Actions';
import { BalanceSkeleton } from './home/Balance';
import { CoinInfoSkeleton } from './jettons/Info';
import { ColumnText } from './Layout';
import { ListBlock, ListItem, ListItemPayload } from './List';
import { SubHeader } from './SubHeader';
import { H3 } from './Text';

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomWidth() {
  return randomIntFromInterval(30, 90) + '%';
}

const Base = styled.div`
  display: inline-block;

  @keyframes placeHolderShimmer {
    0% {
      background-position: -800px 0;
    }
    100% {
      background-position: 800px 0;
    }
  }

  animation-duration: 2s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: placeHolderShimmer;
  animation-timing-function: linear;
  background-color: #f6f7f8;
  background: linear-gradient(to right, #4f5a70 8%, #bbbbbb 18%, #4f5a70 33%);
  background-size: 800px 104px;

  opacity: 0.1;

  position: relative;
`;
const Block = styled(Base)<{ size?: string; width?: string }>`
  border-radius: ${(props) => props.theme.cornerExtraExtraSmall};

  ${(props) => css`
    width: ${props.width ?? randomWidth()};
  `}

  ${(props) => {
    switch (props.size) {
      case 'large':
        return css`
          height: 1.5rem;
        `;
      case 'small':
        return css`
          height: 0.5rem;
        `;
      default:
        return css`
          height: 1rem;
        `;
    }
  }}
`;

export const SkeletonText: FC<{ size?: 'large' | 'small'; width?: string }> =
  React.memo(({ size, width }) => {
    return <Block size={size} width={width} />;
  });

const Image = styled(Base)<{ width?: string }>`
  border-radius: ${(props) => props.theme.cornerFull};

  ${(props) => css`
    width: ${props.width ?? '44px'};
    height: ${props.width ?? '44px'};
  `}
`;

export const SkeletonImage: FC<{ width?: string }> = React.memo(({ width }) => {
  return <Image width={width} />;
});

export const SkeletonSubHeader = React.memo(() => {
  return <SubHeader title={<SkeletonText size="large" />} />;
});

const ActionBlock = styled.div`
  width: 55px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

export const SkeletonAction = React.memo(() => {
  return (
    <ActionBlock>
      <SkeletonImage />
      <SkeletonText size="small" width="50px" />
    </ActionBlock>
  );
});

const ListItemBlock = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
`;

export const SkeletonListPayload = React.memo(() => {
  return (
    <ListItemPayload>
      <ListItemBlock>
        <SkeletonImage />
        <ColumnText
          text={<SkeletonText width={randomIntFromInterval(30, 300) + 'px'} />}
          secondary={<SkeletonText size="small" width="40px" />}
        ></ColumnText>
      </ListItemBlock>
    </ListItemPayload>
  );
});

export const SkeletonList: FC<{
  size?: number;
  margin?: boolean;
  fullWidth?: boolean;
}> = React.memo(({ size = 1, margin, fullWidth }) => {
  return (
    <ListBlock margin={margin} fullWidth={fullWidth}>
      {Array(size)
        .fill(null)
        .map((item, index) => (
          <ListItem key={index} hover={false}>
            <SkeletonListPayload />
          </ListItem>
        ))}
    </ListBlock>
  );
});

const SkeletonSettingsList: FC<{ size?: number }> = React.memo(
  ({ size = 1 }) => {
    return (
      <ListBlock>
        {Array(size)
          .fill(null)
          .map((item, index) => (
            <ListItem key={index} hover={false}>
              <ListItemPayload>
                <SkeletonText
                  size="large"
                  width={randomIntFromInterval(30, 300) + 'px'}
                />
                <SkeletonText size="large" width="30px" />
              </ListItemPayload>
            </ListItem>
          ))}
      </ListBlock>
    );
  }
);

const Container = styled.div`
  flex-grow: 1;
  padding: 0 1rem;
`;
const Body = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled(H3)`
  margin: 1.875rem 0 0.875rem;
`;

export const ActivitySkeleton = React.memo(() => {
  const sdk = useAppSdk();
  useEffect(() => {
    return () => {
      sdk.uiEvents.emit('loading');
    };
  }, []);

  return (
    <>
      <ActivityHeader />
      <Container>
        <Title>
          <SkeletonText size="large" />
        </Title>
        <Body>
          <SkeletonList size={1} margin={false} />
          <SkeletonList size={3} margin={false} />
          <SkeletonList size={2} margin={false} />
          <SkeletonList size={4} margin={false} />
        </Body>
      </Container>
    </>
  );
});

export const SettingsSkeleton = React.memo(() => {
  const sdk = useAppSdk();
  useEffect(() => {
    return () => {
      sdk.uiEvents.emit('loading');
    };
  }, []);

  return (
    <>
      <SettingsHeader />
      <Container>
        <Body>
          <SkeletonSettingsList size={2} />
          <SkeletonSettingsList size={4} />
          <SkeletonSettingsList size={3} />
          <SkeletonSettingsList size={6} />
        </Body>
      </Container>
    </>
  );
});

export const HistoryBlock = styled.div`
  margin-top: 3rem;
`;

export const CoinHistorySkeleton = React.memo(() => {
  const sdk = useAppSdk();
  useEffect(() => {
    return () => {
      sdk.uiEvents.emit('loading');
    };
  }, []);

  return (
    <HistoryBlock>
      <Title>
        <SkeletonText size="large" />
      </Title>
      <SkeletonList size={3} />
    </HistoryBlock>
  );
});

export const CoinSkeleton: FC<{ activity?: number }> = React.memo(
  ({ activity = 2 }) => {
    return (
      <div>
        <SkeletonSubHeader />
        <CoinInfoSkeleton />
        <ActionsRow>
          {Array(activity)
            .fill(null)
            .map((item, index) => (
              <SkeletonAction key={index} />
            ))}
        </ActionsRow>

        <CoinHistorySkeleton />
      </div>
    );
  }
);

export const HomeSkeleton = React.memo(() => {
  const sdk = useAppSdk();
  useEffect(() => {
    return () => {
      sdk.uiEvents.emit('loading');
    };
  }, []);

  return (
    <>
      <BalanceSkeleton />
      <ActionsRow>
        <SkeletonAction />
        <SkeletonAction />
        <SkeletonAction />
        <SkeletonAction />
      </ActionsRow>
      <SkeletonList size={5} />
    </>
  );
});
