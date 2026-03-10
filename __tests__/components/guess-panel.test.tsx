import { fireEvent, render, screen } from '@testing-library/react';

import { GuessPanel } from '@/components/guess-panel';

describe('GuessPanel', () => {
  it('submits a guess and clears input', () => {
    const onSubmitGuess = jest.fn();
    const onSuggestionsChange = jest.fn();

    render(
      <GuessPanel
        disabled={false}
        suggestions={[]}
        lastResult={null}
        onSubmitGuess={onSubmitGuess}
        onSuggestionsChange={onSuggestionsChange}
      />
    );

    const input = screen.getByLabelText('Guess country');
    fireEvent.change(input, { target: { value: 'France' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(onSubmitGuess).toHaveBeenCalledWith('France');
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('renders and applies suggestion click', () => {
    const onSubmitGuess = jest.fn();
    const onSuggestionsChange = jest.fn();

    render(
      <GuessPanel
        disabled={false}
        suggestions={[{ id: 'FRA', name: 'France' }]}
        lastResult={null}
        onSubmitGuess={onSubmitGuess}
        onSuggestionsChange={onSuggestionsChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'France' }));

    expect(onSuggestionsChange).toHaveBeenCalledWith('');
  });

  it('does not render suggestions in survival mode', () => {
    const onSubmitGuess = jest.fn();
    const onSuggestionsChange = jest.fn();

    render(
      <GuessPanel
        disabled={false}
        isSurvival
        suggestions={[{ id: 'FRA', name: 'France' }]}
        lastResult={null}
        onSubmitGuess={onSubmitGuess}
        onSuggestionsChange={onSuggestionsChange}
      />
    );

    expect(screen.queryByText('Suggestions')).not.toBeInTheDocument();
  });
});
