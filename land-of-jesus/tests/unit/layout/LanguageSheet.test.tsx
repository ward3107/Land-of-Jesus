import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { navState } from '../helpers/mocks';
import { renderWithIntl } from '../helpers/intl';
import { LanguageSheet } from '@/components/layout/LanguageSheet';

vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

const openSheet = () => fireEvent.click(screen.getByRole('button', { name: 'Language: English' }));

describe('LanguageSheet', () => {
  beforeEach(() => {
    navState.pathname = '/explore';
    navState.replace.mockClear();
  });

  it('starts closed with a labelled trigger', () => {
    renderWithIntl(<LanguageSheet />);
    const trigger = screen.getByRole('button', { name: 'Language: English' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens a labelled modal listing every locale in its own script, focusing the current one', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    const dialog = screen.getByRole('dialog', { name: 'Language' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    const options = within(dialog)
      .getAllByRole('button')
      .filter((b) => b.hasAttribute('lang'));
    expect(options.map((b) => b.textContent)).toEqual(['English', 'العربية', 'עברית']);
    const current = within(dialog).getByRole('button', { name: 'English' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveFocus();
    expect(within(dialog).getByRole('button', { name: 'العربية' })).toHaveAttribute('dir', 'rtl');
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Language: English' })).toHaveFocus();
  });

  it('closes on a backdrop tap and on the close button', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('switches locale and stays on the same page', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'العربية' }));
    expect(navState.replace).toHaveBeenCalledWith('/explore', { locale: 'ar' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does nothing when the current language is chosen', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(navState.replace).not.toHaveBeenCalled();
  });

  it('keeps Tab focus inside the sheet', () => {
    renderWithIntl(<LanguageSheet />);
    openSheet();
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(first).toHaveFocus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});
