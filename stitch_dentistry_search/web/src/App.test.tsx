import { render, screen } from '@testing-library/react';
import App from './App';

describe('App shell', () => {
  test('renders core sections for dentistry search and booking', () => {
    render(<App />);

    expect(screen.getByText(/Stitch Dentistry Finder/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dentistry search/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dentistry detail/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Provider selection/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Nearest availability/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Booking confirmation/i })).toBeInTheDocument();
  });
});
