import React, {
  FC,
  PropsWithChildren,
  useEffect,
  useRef,
  useState,
} from 'react';
import styled, { css } from 'styled-components';

const DropDownContainer = styled.div`
  position: relative;
  display: inline-block;
`;
const DropDownHeader = styled.div`
  cursor: pointer;
`;

const DropDownListContainer = styled.div<{ center?: boolean }>`
  position: absolute;
  width: 240px;
  
  ${(props) =>
    props.center
      ? css`
          left: 50%;
          margin-left: -120px;
          top: calc(100% + 0.5rem);
        `
      : css`
          top: -1.25rem;
          right: -1rem;
        `}}

  z-index: 1;
  background-color: ${(props) => props.theme.backgroundContentTint};
  border-radius: ${(props) => props.theme.cornerSmall};
  max-height: 368px;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
`;

export const DropDownListPayload = styled.div`
  white-space: nowrap;
`;

const ListItem = styled.div`
  cursor: pointer;
  padding: 10px 20px;

  &:hover {
    background: ${(props) => props.theme.backgroundHighlighted};
  }
`;

function useOutsideAlerter(ref: React.RefObject<Node>, onClick: () => void) {
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClick();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, onClick]);
}

const Container: FC<{
  onClose: () => void;
  children: React.ReactNode;
  center?: boolean;
}> = ({ onClose, children, center }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useOutsideAlerter(wrapperRef, onClose);
  return (
    <DropDownListContainer ref={wrapperRef} center={center}>
      {children}
    </DropDownListContainer>
  );
};

export interface DropDownProps extends PropsWithChildren {
  payload: (onClose: () => void) => React.ReactNode;
  center?: boolean;
  disabled?: boolean;
}

const disableTouchEvent: React.TouchEventHandler<HTMLDivElement> = (e) => {
  e.stopPropagation();
};
export const DropDown = ({
  children,
  payload,
  center,
  disabled,
}: DropDownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggling = () => {
    if (!disabled) {
      setIsOpen((value) => !value);
    }
  };

  const onOpen: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggling();
  };

  return (
    <DropDownContainer
      onTouchStart={disableTouchEvent}
      onTouchMove={disableTouchEvent}
    >
      <DropDownHeader onClick={onOpen}>{children}</DropDownHeader>
      {isOpen && (
        <Container onClose={toggling} center={center}>
          {payload(toggling)}
        </Container>
      )}
    </DropDownContainer>
  );
};

export interface DropDownListProps<T> extends PropsWithChildren {
  options: T[];
  renderOption: (option: T) => React.ReactNode;
  onSelect: (option: T) => void;
  center?: boolean;
  disabled?: boolean;
}

export const DropDownList = <T extends any>({
  children,
  options,
  renderOption,
  onSelect,
  center,
  disabled,
}: DropDownListProps<T>) => {
  return (
    <DropDown
      disabled={disabled}
      center={center}
      payload={(onClose) => (
        <DropDownListPayload>
          {options.map((option, index) => (
            <ListItem
              key={index}
              onClick={() => {
                onClose();
                onSelect(option);
              }}
            >
              {renderOption(option)}
            </ListItem>
          ))}
        </DropDownListPayload>
      )}
    >
      {children}
    </DropDown>
  );
};
