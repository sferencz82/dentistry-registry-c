import renderer from 'react-test-renderer';
import App from './App';

describe('App', () => {
  it('renders the mobile shell', () => {
    const tree = renderer.create(<App />).toJSON();
    expect(tree).toBeTruthy();
  });
});
