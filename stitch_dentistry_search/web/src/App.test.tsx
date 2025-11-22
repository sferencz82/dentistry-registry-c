import { render, screen } from '@testing-library/react';
import App from './App';

test('renders environment info', () => {
  render(<App />);
  expect(screen.getByText(/Stitch Dentistry Web/i)).toBeInTheDocument();
  expect(screen.getByText(/Environment:/i)).toBeInTheDocument();
});
