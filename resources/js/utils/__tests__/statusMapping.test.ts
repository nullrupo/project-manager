import { getStatusFromColumnName, getColumnNameFromStatus } from '../statusMapping';

describe('Status Mapping', () => {
    describe('getStatusFromColumnName', () => {
        test('maps common To Do variations', () => {
            expect(getStatusFromColumnName('To Do')).toBe('to_do');
            expect(getStatusFromColumnName('TODO')).toBe('to_do');
            expect(getStatusFromColumnName('Backlog')).toBe('to_do');
            expect(getStatusFromColumnName('New')).toBe('to_do');
            expect(getStatusFromColumnName('Open')).toBe('to_do');
            expect(getStatusFromColumnName('Pending')).toBe('to_do');
        });

        test('maps common In Progress variations', () => {
            expect(getStatusFromColumnName('In Progress')).toBe('in_progress');
            expect(getStatusFromColumnName('In-Progress')).toBe('in_progress');
            expect(getStatusFromColumnName('Doing')).toBe('in_progress');
            expect(getStatusFromColumnName('Active')).toBe('in_progress');
            expect(getStatusFromColumnName('Working')).toBe('in_progress');
            expect(getStatusFromColumnName('Development')).toBe('in_progress');
        });

        test('maps common Review variations', () => {
            expect(getStatusFromColumnName('Review')).toBe('in_review');
            expect(getStatusFromColumnName('In Review')).toBe('in_review');
            expect(getStatusFromColumnName('Testing')).toBe('in_review');
            expect(getStatusFromColumnName('QA')).toBe('in_review');
            expect(getStatusFromColumnName('Code Review')).toBe('in_review');
        });

        test('maps common Done variations', () => {
            expect(getStatusFromColumnName('Done')).toBe('done');
            expect(getStatusFromColumnName('Completed')).toBe('done');
            expect(getStatusFromColumnName('Finished')).toBe('done');
            expect(getStatusFromColumnName('Closed')).toBe('done');
            expect(getStatusFromColumnName('Deployed')).toBe('done');
        });

        test('maps common Blocked variations', () => {
            expect(getStatusFromColumnName('Blocked')).toBe('blocked');
            expect(getStatusFromColumnName('On Hold')).toBe('blocked');
            expect(getStatusFromColumnName('Waiting')).toBe('blocked');
            expect(getStatusFromColumnName('Paused')).toBe('blocked');
        });

        test('handles edge cases', () => {
            expect(getStatusFromColumnName('')).toBe('to_do');
            expect(getStatusFromColumnName('Random Column')).toBe('to_do');
            expect(getStatusFromColumnName('Test')).toBe('in_review'); // Contains 'test'
        });

        test('is case insensitive', () => {
            expect(getStatusFromColumnName('DONE')).toBe('done');
            expect(getStatusFromColumnName('in progress')).toBe('in_progress');
            expect(getStatusFromColumnName('ToDo')).toBe('to_do');
        });
    });

    describe('getColumnNameFromStatus', () => {
        test('maps statuses to default column names', () => {
            expect(getColumnNameFromStatus('to_do')).toBe('To Do');
            expect(getColumnNameFromStatus('in_progress')).toBe('In Progress');
            expect(getColumnNameFromStatus('in_review')).toBe('In Review');
            expect(getColumnNameFromStatus('done')).toBe('Done');
            expect(getColumnNameFromStatus('blocked')).toBe('Blocked');
        });

        test('handles unknown statuses', () => {
            expect(getColumnNameFromStatus('unknown')).toBe('To Do');
        });
    });
});
