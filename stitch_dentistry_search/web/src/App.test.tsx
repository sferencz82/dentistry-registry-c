import { render, screen } from '@testing-library/react';
import App from './App';

describe('Practice admin shell', () => {
  test('renders admin sections for practice management', () => {
    render(<App />);

    expect(screen.getByText(/Practice Administration/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Profile/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Services/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Staff roster/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Availability editor/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Billing & subscription/i })).toBeInTheDocument();
  });
});
