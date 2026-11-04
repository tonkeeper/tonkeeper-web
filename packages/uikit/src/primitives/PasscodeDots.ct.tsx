import { screenshot } from '../../playwright/test';
import { PasscodeDots } from './PasscodeDots';

// Edge cases the screenshot suite targets:
//   - empty, mid-entry (latest dot enlarged), correct (all green, enlarged)
//     and wrong (all red) states;
//   - the enlarged dots don't change the row's footprint.

const STAGE = 'flex w-[160px] flex-col items-center gap-6 bg-backgroundPage p-6';

screenshot('PasscodeDots', () => (
    <div className={STAGE}>
        <PasscodeDots length={4} filled={0} />
        <PasscodeDots length={4} filled={2} />
        <PasscodeDots length={4} filled={4} state="correct" />
        <PasscodeDots length={4} filled={4} state="wrong" className="animate-none" />
    </div>
));
