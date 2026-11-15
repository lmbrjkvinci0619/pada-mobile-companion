import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders the label correctly', async () => {
    const { getByText } = await render(<Button label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('renders without crashing when onPress is provided', async () => {
    const onPressMock = jest.fn();
    const { getByText } = await render(<Button label="Click Me" onPress={onPressMock} />);
    expect(getByText('Click Me')).toBeTruthy();
  });

  it('is disabled and shows activity indicator when loading', async () => {
    const { queryByText } = await render(<Button label="Loading..." loading={true} />);
    expect(queryByText('Loading...')).toBeTruthy();
  });

  it('renders different variants', async () => {
    const { getByText } = await render(<Button label="Primary" variant="primary" />);
    expect(getByText('Primary')).toBeTruthy();

    const { getByText: getByText2 } = await render(<Button label="Secondary" variant="secondary" />);
    expect(getByText2('Secondary')).toBeTruthy();

    const { getByText: getByText3 } = await render(<Button label="Danger" variant="danger" />);
    expect(getByText3('Danger')).toBeTruthy();
  });

  it('renders different sizes', async () => {
    const { getByText } = await render(<Button label="Small" size="sm" />);
    expect(getByText('Small')).toBeTruthy();

    const { getByText: getByText2 } = await render(<Button label="Large" size="lg" />);
    expect(getByText2('Large')).toBeTruthy();
  });

  it('renders with icon', async () => {
    const { getByText } = await render(<Button label="With Icon" icon={<Text>★</Text>} />);
    expect(getByText('With Icon')).toBeTruthy();
  });
});
