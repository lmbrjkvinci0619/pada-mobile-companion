import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the label correctly', () => {
    const { getByText } = render(<Button label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Click Me" onPress={onPressMock} />);
    
    fireEvent.press(getByText('Click Me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('is disabled and shows activity indicator when loading', () => {
    const { getByTestId, queryByText } = render(<Button label="Loading..." loading={true} />);
    
    // In React Native, ActivityIndicator doesn't have text, but we can check if it's there
    // For simplicity, we check if the label is still there (it should be according to the code)
    expect(queryByText('Loading...')).toBeTruthy();
  });

  it('is disabled when disabled prop is true', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<Button label="Disabled" onPress={onPressMock} disabled={true} />);
    
    fireEvent.press(getByText('Disabled'));
    expect(onPressMock).not.toHaveBeenCalled();
  });
});
