import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Modal } from './Modal';

function Harness() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>Abrir</button>
      {isOpen ? (
        <Modal title="Confirmar" onClose={() => setIsOpen(false)}>
          <button>Primero</button>
          <button>Último</button>
        </Modal>
      ) : null}
    </>
  );
}

const open = async () => userEvent.click(screen.getByRole('button', { name: 'Abrir' }));

describe('Modal', () => {
  it('is an accessible dialog named by its title, focused when it opens', async () => {
    render(<Harness />);
    await open();

    const dialog = screen.getByRole('dialog', { name: 'Confirmar' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
  });

  it('closes with Escape or a click on the backdrop and gives the focus back', async () => {
    render(<Harness />);
    await open();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus();

    await open();
    await userEvent.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when the click happens inside the dialog', async () => {
    render(<Harness />);
    await open();

    await userEvent.click(screen.getByRole('button', { name: 'Primero' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('keeps Tab and Shift+Tab inside the dialog', async () => {
    render(<Harness />);
    await open();

    await userEvent.tab();
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Primero' })).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus();
  });
});
