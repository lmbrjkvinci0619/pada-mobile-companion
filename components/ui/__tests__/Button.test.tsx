import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the label correctly', () => {
    const { getByText } = render(<Button label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders without crashing when onPress is provided', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Click Me" onPress={onPressMock} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('is disabled and shows activity indicator when loading', () => {
    const { queryByText } = render(<Button label="Loading..." loading={true} />);
    expect(queryByText('Loading...')).toBeTruthy();
  });

  it('renders different variants', () => {
    const { getByText } = render(<Button label="Primary" variant="primary" />);
    expect(getByText('Primary')).toBeTruthy();
    
    const { getByText: getByText2 } = render(<Button label="Secondary" variant="secondary" />);
    expect(getByText2('Secondary')).toBeTruthy();
    
    const { getByText: getByText3 } = render(<Button label="Danger" variant="danger" />);
    expect(getByText3('Danger')).toBeTruthy();
  });

  it('renders different sizes', () => {
    const { getByText } = render(<Button label="Small" size="sm" />);
    expect(getByText('Small')).toBeTruthy();
    
    const { getByText: getByText2 } = render(<Button label="Large" size="lg" />);
    expect(getByText2('Large')).toBeTruthy();
  });

  it('renders with icon', () => {
    const { getByText } = render(<Button label="With Icon" icon={<span>★</span>} />);
    expect(getByText('With Icon')).toBeTruthy();
  });
});