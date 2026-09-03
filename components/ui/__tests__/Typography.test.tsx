import React from 'react';
import { render } from '@testing-library/react-native';
import { Hero, Title, Section, TileTitle, Body, Subtitle, Meta, Eyebrow, EyebrowTight, Label } from '../Typography';

describe('Typography', () => {
  it('renders each variant with its content', () => {
    const { getByText: h1 } = render(<Hero>hero text</Hero>);
    expect(h1('hero text')).toBeTruthy();

    const { getByText: t } = render(<Title>title text</Title>);
    expect(t('title text')).toBeTruthy();

    const { getByText: s } = render(<Section tone="primary">section text</Section>);
    expect(s('section text')).toBeTruthy();

    const { getByText: tt } = render(<TileTitle>tile text</TileTitle>);
    expect(tt('tile text')).toBeTruthy();

    const { getByText: b } = render(<Body>body text</Body>);
    expect(b('body text')).toBeTruthy();

    const { getByText: sub } = render(<Subtitle>subtitle text</Subtitle>);
    expect(sub('subtitle text')).toBeTruthy();

    const { getByText: m } = render(<Meta tone="secondary">meta text</Meta>);
    expect(m('meta text')).toBeTruthy();

    const { getByText: e } = render(<Eyebrow tone="secondary">eyebrow text</Eyebrow>);
    expect(e('eyebrow text')).toBeTruthy();

    const { getByText: et } = render(<EyebrowTight tone="secondary">eyebrow tight</EyebrowTight>);
    expect(et('eyebrow tight')).toBeTruthy();

    const { getByText: l } = render(<Label tone="primaryAccent">label text</Label>);
    expect(l('label text')).toBeTruthy();
  });

  it('eyebrow variants carry uppercase + tracking classes', () => {
    const { toJSON } = render(<Eyebrow>x</Eyebrow>);
    const serialized = JSON.stringify(toJSON());
    expect(serialized).toContain('uppercase');
    expect(serialized).toContain('tracking');

    const { toJSON: j2 } = render(<EyebrowTight>x</EyebrowTight>);
    expect(JSON.stringify(j2())).toContain('uppercase');

    const { toJSON: j3 } = render(<Label>x</Label>);
    expect(JSON.stringify(j3())).toContain('uppercase');

    const { toJSON: j4 } = render(<Meta>x</Meta>);
    expect(JSON.stringify(j4())).toContain('uppercase');
  });

  it('display variants carry lowercase + light weight classes', () => {
    const { toJSON } = render(<Hero>x</Hero>);
    const serialized = JSON.stringify(toJSON());
    expect(serialized).toContain('lowercase');
    expect(serialized).toContain('font-light');

    const { toJSON: j2 } = render(<Title>x</Title>);
    expect(JSON.stringify(j2())).toContain('lowercase');

    const { toJSON: j3 } = render(<Section>x</Section>);
    expect(JSON.stringify(j3())).toContain('lowercase');
  });
});
