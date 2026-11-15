import React from 'react';
import { render } from '@testing-library/react-native';
import { Hero, Title, Section, TileTitle, Body, Subtitle, Meta, Eyebrow, EyebrowTight, Label } from '../Typography';

describe('Typography', () => {
  it('renders each variant with its content', async () => {
    const { getByText: h1 } = await render(<Hero>hero text</Hero>);
    expect(h1('hero text')).toBeTruthy();

    const { getByText: t } = await render(<Title>title text</Title>);
    expect(t('title text')).toBeTruthy();

    const { getByText: s } = await render(<Section tone="primary">section text</Section>);
    expect(s('section text')).toBeTruthy();

    const { getByText: tt } = await render(<TileTitle>tile text</TileTitle>);
    expect(tt('tile text')).toBeTruthy();

    const { getByText: b } = await render(<Body>body text</Body>);
    expect(b('body text')).toBeTruthy();

    const { getByText: sub } = await render(<Subtitle>subtitle text</Subtitle>);
    expect(sub('subtitle text')).toBeTruthy();

    const { getByText: m } = await render(<Meta tone="secondary">meta text</Meta>);
    expect(m('meta text')).toBeTruthy();

    const { getByText: e } = await render(<Eyebrow tone="secondary">eyebrow text</Eyebrow>);
    expect(e('eyebrow text')).toBeTruthy();

    const { getByText: et } = await render(<EyebrowTight tone="secondary">eyebrow tight</EyebrowTight>);
    expect(et('eyebrow tight')).toBeTruthy();

    const { getByText: l } = await render(<Label tone="primaryAccent">label text</Label>);
    expect(l('label text')).toBeTruthy();
  });

  it('eyebrow variants carry uppercase + tracking classes', async () => {
    const { toJSON } = await render(<Eyebrow>x</Eyebrow>);
    const serialized = JSON.stringify(toJSON());
    expect(serialized).toContain('uppercase');
    expect(serialized).toContain('tracking');

    const { toJSON: j2 } = await render(<EyebrowTight>x</EyebrowTight>);
    expect(JSON.stringify(j2())).toContain('uppercase');

    const { toJSON: j3 } = await render(<Label>x</Label>);
    expect(JSON.stringify(j3())).toContain('uppercase');

    const { toJSON: j4 } = await render(<Meta>x</Meta>);
    expect(JSON.stringify(j4())).toContain('uppercase');
  });

  it('display variants carry lowercase + light weight classes', async () => {
    const { toJSON } = await render(<Hero>x</Hero>);
    const serialized = JSON.stringify(toJSON());
    expect(serialized).toContain('lowercase');
    expect(serialized).toContain('font-light');

    const { toJSON: j2 } = await render(<Title>x</Title>);
    expect(JSON.stringify(j2())).toContain('lowercase');

    const { toJSON: j3 } = await render(<Section>x</Section>);
    expect(JSON.stringify(j3())).toContain('lowercase');
  });
});
