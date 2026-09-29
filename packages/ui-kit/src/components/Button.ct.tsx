import { Button } from './Button';
import IcSnowflake16 from '../icons/components/IcSnowflake16';
import { expect, screenshot, test } from '../../playwright/test';

screenshot('Button primaryBlue medium', () => <Button variant="primaryBlue">Confirm</Button>);
screenshot('Button primaryGreen medium', () => <Button variant="primaryGreen">Manage</Button>);
screenshot('Button primaryBlueRed medium', () => <Button variant="primaryRed">Delete</Button>);
screenshot('Button secondary medium', () => <Button variant="secondary">Cancel</Button>);
screenshot('Button tertiary medium', () => <Button variant="tertiary">Action</Button>);
screenshot('Button destructive medium', () => <Button variant="destructive">Remove</Button>);
screenshot('Button overlay medium', () => <Button variant="overlay">Open</Button>);
screenshot('Button overlay small', () => (
    <Button variant="overlay" size="small">
        Open
    </Button>
));
screenshot('Button overlay large', () => (
    <Button variant="overlay" size="large">
        Open
    </Button>
));

screenshot('Button primaryBlue small', () => (
    <Button variant="primaryBlue" size="small">
        Confirm
    </Button>
));
screenshot('Button primaryBlue large', () => (
    <Button variant="primaryBlue" size="large">
        Confirm
    </Button>
));

screenshot('Button primaryBlue disabled', () => (
    <Button variant="primaryBlue" disabled>
        Confirm
    </Button>
));
screenshot('Button primaryGreen disabled', () => (
    <Button variant="primaryGreen" disabled>
        Manage
    </Button>
));
screenshot('Button primaryBlueRed disabled', () => (
    <Button variant="primaryRed" disabled>
        Delete
    </Button>
));
screenshot('Button secondary disabled', () => (
    <Button variant="secondary" disabled>
        Cancel
    </Button>
));
screenshot('Button tertiary disabled', () => (
    <Button variant="tertiary" disabled>
        Action
    </Button>
));

screenshot('Button primaryBlue loading small', () => (
    <Button variant="primaryBlue" size="small" loading>
        Confirm
    </Button>
));
screenshot('Button primaryBlue loading medium', () => (
    <Button variant="primaryBlue" loading>
        Confirm
    </Button>
));
screenshot('Button primaryBlue loading large', () => (
    <Button variant="primaryBlue" size="large" loading>
        Confirm
    </Button>
));

screenshot('Button primaryBlue fullWidth', () => (
    <Button variant="primaryBlue" fullWidth>
        Continue
    </Button>
));

screenshot('Button leftIcon small', () => (
    <Button variant="secondary" size="small" leftIcon={<IcSnowflake16 />}>
        Text
    </Button>
));
screenshot('Button rightIcon small', () => (
    <Button variant="secondary" size="small" rightIcon={<IcSnowflake16 />}>
        Text
    </Button>
));
screenshot('Button leftIcon large', () => (
    <Button variant="secondary" size="large" leftIcon={<IcSnowflake16 />}>
        Text
    </Button>
));
screenshot('Button iconOnly small', () => (
    <Button variant="secondary" size="small" leftIcon={<IcSnowflake16 />} />
));

test('Button forwards onClick', async ({ mount }) => {
    let clicks = 0;
    const component = await mount(
        <Button variant="primaryBlue" onClick={() => (clicks += 1)}>
            Click
        </Button>
    );
    await component.click();
    expect(clicks).toBe(1);
});

test('disabled Button is not clickable', async ({ mount }) => {
    const component = await mount(
        <Button variant="primaryBlue" disabled>
            Send
        </Button>
    );
    await expect(component).toBeDisabled();
});

test('loading Button is disabled', async ({ mount }) => {
    const component = await mount(
        <Button variant="primaryBlue" loading>
            Send
        </Button>
    );
    await expect(component).toBeDisabled();
});

test('Button sets a default type of "button"', async ({ mount }) => {
    const component = await mount(<Button variant="primaryBlue">Confirm</Button>);
    await expect(component).toHaveAttribute('type', 'button');
});
