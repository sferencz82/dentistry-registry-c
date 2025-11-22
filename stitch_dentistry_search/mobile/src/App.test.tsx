import { render } from '@testing-library/react-native';
import App from './App';

describe('App', () => {
  it('renders navigation tabs', () => {
    const { getByText } = render(<App />);

    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Appointments')).toBeTruthy();
    expect(getByText('Chat')).toBeTruthy();
    expect(getByText('Settings')).toBeTruthy();
  });
});
